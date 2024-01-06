

class PlayManager {
    constructor(story) {
        this.timer = undefined;
        this.status = PlayStatus.opening;
        this.story = story;
        this.waveList = (this.story.waveList || []).map(waveData => this.createWave(waveData));
        this.currentWave = this.waveList.shift();
    }

    createWave = (waveData) => {
        let wave = {
            outOfView : false,
            enemyList : [],
            deadEList : [],
        };
        let x = 40;
        for (let i=0 ; i < 5 ; i++) {
            let enemyData = waveData[i];
            if (!enemyData || !enemyData.clazz) {
                continue;
            }
            let { clazz } = enemyData;
            let opt = Object.assign({}, enemyData, { x : x + (i * 80) });
            wave.enemyList[wave.enemyList.length] = new clazz(opt);
        }
        return wave;
    };

    doSleep = (time, post, pre) => {
        if (this.timer) return;

        if (pre) pre();

        this.timer = setTimeout(() => {
            this.timer = undefined;
            post();
        }, time);
    };

    [PlayStatus.opening] = () => {
        this.doSleep(1500, 
            () => this.status = PlayStatus.playing, 
            () => postMessage({type: 'message', position: 'start', html: `<h1 content="#${this.story.level} START"></h1>`, time: 1000})
        );
    };

    [PlayStatus.playing] = () => {
        if (!this.currentWave || this.currentWave.outOfView) {
            this.doSleep(700, () => {
                this.currentWave = this.waveList.shift();
                if (!this.currentWave) {
                    this.status = PlayStatus.ending;
                }
            });
        } else {
            this.currentWave.enemyList.forEach(e => e.renderLive());
            this.currentWave.deadEList.forEach(e => e.renderDead());
        }
    };

    [PlayStatus.ending] = () => {
        //renderTxtView(this.story.ending);
        this.doSleep(1500, 
            () => this.status = PlayStatus.exit, 
            () => postMessage({type: 'message', position: 'clear', html: `<h1 content="#${this.story.level} VICTORY"></h1>`, time: 600})
        );
    };

    render = () => {
        (this[this.status]||function(){})();
    };

    calPosition = (player) => {
        if (this.status == PlayStatus.playing && this.currentWave && !this.currentWave.outOfView) {
            this.currentWave.enemyList.forEach(e => e.calPosition(player));
            this.flatCurrentWave();
        }
    };

    judgeCollision = (bulletList) => {
        if (!this.currentWave || !this.currentWave.enemyList || this.currentWave.enemyList.length < 1) {
            return {};
        }
        let res = { score : 0, seqList : [] };
        (bulletList||[]).forEach(b => {
            let enemy = this.currentWave.enemyList
                    .filter(e => e.isLive)
                    .filter(e => !e.outOfView)
                    .find(e => e.judgeCollision(b));
            if (enemy) {
                res.seqList.push(b.seq);
                if (!enemy.isLive) {
                    this.putDeadEList(enemy);
                    res.score += enemy.score;
                }
            }
        });

        this.flatCurrentWave();
        return res;
    };

    judgeCollisionWithSkill = (skillList) => {
        if (!this.currentWave || !this.currentWave.enemyList || this.currentWave.enemyList.length < 1) {
            return {};
        }

        let res = { score : 0};
        (skillList||[]).forEach(s => {
            let enemyList = this.currentWave.enemyList
                    .filter(e => e.isLive)
                    .filter(e => !e.outOfView)
                    .filter(e => e.judgeCollisionWithSkill(s))
                    .filter(e => !e.isLive)
            if (enemyList.length > 0) {
                for(let enemy of enemyList) {
                    this.putDeadEList(enemy);
                    res.score += enemy.score;
                }
            }
        });

        this.flatCurrentWave();
        return res;
    };

    putDeadEList = (enemy) => {
        enemy.deadDuration = times.dead_duration;
        this.currentWave.deadEList.push(enemy);
    }

    flatCurrentWave = () => {
        this.currentWave.enemyList = this.currentWave.enemyList.filter(e => e.isLive).filter(e => !e.outOfView);
        this.currentWave.deadEList = this.currentWave.deadEList.filter(e => e.deadDuration > 0);
        this.currentWave.outOfView = this.currentWave.enemyList.length <= 0 &&  this.currentWave.deadEList.length <= 0;
    };
}
