let _random = '?' + Math.random();


importScripts('./util/Variables.js' + _random);
importScripts('./util/Animation.js' + _random);
importScripts('./ItemManager.js' + _random);
importScripts('./enemy/BasicEnemy.js' + _random);
importScripts('./enemy/BasicPlay.js' + _random);
importScripts('./enemy/NoWaitPlay.js' + _random);
importScripts('./enemy/FollowPlay.js' + _random);
importScripts('./enemy/PlayManager.js' + _random);






importScripts('./bullet.js' + _random);

importScripts('./storyBoard.js' + _random);


const randomInt = (min, max, random_float = Math.random()) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random_float * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
};

const randomInt2 = (min, max, num = frameIndex) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random(num) * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함

    function random(num) {
        return (cos(num, 1, 1) + cos(num, 2, 7) + cos(num, 3, 2) + cos(num, 4, 8) + cos(num, 5, 9)) / 15;
    }

    function cos(x, max_height = 1, step = 1) {
        return Math.cos(Math.PI * 2 * x / step) * max_height;
    }
}

const isCollisionWithBullet = (arc, bullet) => {
    let top = bullet.y - bullet.r - arc.r;
    if (arc.y < top) {
        return false;
    }

    let left = bullet.x - bullet.r - arc.r;
    let right = bullet.x + bullet.r + arc.r;
    return arc.x >= left && arc.x <= right;
};

const isCollisionArc = (arc1, arc2) => {
    let x = Math.pow(Math.abs(arc1.x - arc2.x), 2);
    let y = Math.pow(Math.abs(arc1.y - arc2.y), 2);
    return Math.sqrt(x + y) <= arc1.r + arc2.r;
};

const isCollisionSector = (sector, point) => {
    let y = sector.y - point.y;
    let x = point.x - sector.x;
    let angle = Math.atan2(y, x);
    let r = x / Math.cos(angle);
    angle = angle / Math.PI;
    if(angle < 0) angle *= -1;
    else angle = 2 - angle;
    if(r < sector.inner_r | r > sector.outer_r | angle < sector.s_angle | angle > sector.e_angle) return false;
    return true;
}

const renderBoom = (fillStyle, x, y, r) => {
    let h = r / 2;
    context.beginPath();
    context.moveTo(x - r, y);
    context.arcTo(x, y, x - h, y + h, r);
    context.arcTo(x, y, x, y + r, r);
    context.arcTo(x, y, x + h, y + h, r);
    context.arcTo(x, y, x + r, y, r);

    context.arcTo(x, y, x + h, y - h, r);
    context.arcTo(x, y, x, y - r, r);
    context.arcTo(x, y, x - h, y - h, r);
    context.arcTo(x, y, x - r, y, r);
    context.fillStyle = fillStyle;
    context.fill();
    context.closePath();
};

const contextScale = () => {
    let ratioX = canvas.width / rWidth;
    let ratioY = canvas.height / rHeight;
    context.scale(ratioX, ratioY);
};

const clear = () => {
    context.clearRect(0, 0, rWidth, rHeight);
};

const drawObject = (namespace, { x, y, r, isDemaged }) => {
    r += 5;
    if (isDemaged) context.filter = filters.demaged;
    let aspect_ratio = imageSet[namespace].height / imageSet[namespace].width;
    context.drawImage(imageSet[namespace], x - r, y - (r * aspect_ratio), 2 * r, 2 * r * aspect_ratio);
    if (isDemaged) context.filter = "none";

}

const drawHpGauge = ({x, y, r}, hp_ratio, color = '#64E9F8') => {
    y -= r;
    let hp_width = Math.floor(hp_ratio * 48);
    context.beginPath();
    context.moveTo(x - 24, y - 17);
    context.lineTo(x + 26, y - 17);
    context.lineTo(x + 24, y - 7);
    context.lineTo(x - 26, y - 7);
    context.lineTo(x - 23, y - 19);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    context.fillStyle = '#51516B';
    context.stroke();
    context.fill();
    context.beginPath();
    context.moveTo(x - 23, y - 16);
    context.lineTo(x - 23 + hp_width, y - 16);
    context.lineTo(x - 25 + hp_width, y - 8);
    context.lineTo(x - 25, y - 8);
    context.lineTo(x - 23, y - 16);
    context.fillStyle = color;
    context.fill();
    context.beginPath();
    context.moveTo(x+1, y - 16);
    context.lineTo(x-1, y - 8);
    context.moveTo(x+13, y - 16);
    context.lineTo(x+11, y - 8);
    context.moveTo(x-11, y - 16);
    context.lineTo(x-13, y - 8);
    context.strokeStyle = '#51516B';
    context.lineWidth = 1;
    context.stroke();
    context.closePath();
}



class Player {
    constructor(imageNamespace = 'player_1') {
        this.s = 4;//move step
        this.r = 23;//size of character radius
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
        this.directKey = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.imageNamespace = imageNamespace;
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        this.inputSkill = undefined;
        this.bulletItemList = [new BasicBullet()];
        this.skillList = [
            new hikari_yo(),
            new sector_skill1(),
            new sector_skill2()
        ];
        this.skillList.forEach(this.postSkill);
        this.shuffleSkill(3);
        this.fireTerm = 0;
        this.isLive = true;
        this.isDemaged = false;
        this.hp = this.max_hp = 400;
    };

    shuffleSkill = (cnt = 1) => {
        let first_skill = this.skillList.shift();
        this.skillList[this.skillList.length] = first_skill;
        if(cnt > 1) this.shuffleSkill(cnt - 1);
    }

    postSkill = skill => postMessage({type: 'skill_set',info: {
        name: skill.name,
        cost: skill.cost,
        image_url: skill.image_url
    }});

    onKeyDirectEvent = (eventName, key) => {
        this.directKey[key] = eventName == 'keydown';
    };

    onKeyInputEvent = (eventName, key, skillName) => {
        if (['w', '1','2','3'].indexOf(key) == -1) {
            return;
        }
        this.isInputKeyPress = eventName == 'keydown';
        this.inputKey = this.isInputKeyPress ? key : undefined;
        this.inputSkill = skillName;
    };

    calPosition = () => {
        this.moveBody();
        this.fireBullet();
        this.bulletItemList.forEach(bulletItem => bulletItem.calPosition());
    };

    moveBody = () => {
        let { x, y, s, r } = this;
        if (this.directKey.up) this.y = Math.max(y - s, r);
        if (this.directKey.down) this.y = Math.min(y + s, rHeight - r);
        if (this.directKey.left) this.x = Math.max(x - s, r);
        if (this.directKey.right) this.x = Math.min(x + s, rWidth - r);
    };

    fireBullet = () => {
        if (this.fireTerm > 0) {
            this.fireTerm--;
            return;
        }

        if (this.isInputKeyPress && this.inputKey == 'w') {
            this.currentBulletItem().registOne(this.x, this.y - this.r - 0.5);
            this.fireTerm = this.currentBulletItem().fireTerm;
        }

        if (['1','2','3'].indexOf(this.inputKey) > -1) {
            if (this.isInputKeyPress) {
                this.skillList.find(skill => skill.name == this.inputSkill).regist(this);
                console.log(this.skillList[0].name);
                if(this.skillList[0].name == this.inputSkill) this.shuffleSkill();
                console.log(this.skillList[0].name);
                this.postSkill(this.skillList[0]);
                this.isInputKeyPress = false;
                this.inputKey = undefined;
                this.inputSkill = undefined;
            }
        }
    };

    currentBulletItem = () => this.bulletItemList.filter(item => !item.isEmpty())[0];

    addBulletItem = (bullet) => {
        let curBullet = this.currentBulletItem();
        if (bullet.constructor.name == curBullet.constructor.name) {
            curBullet.limit += bullet.limit;
        } else {
            this.bulletItemList.forEach(item => item.limit = 0);
            this.bulletItemList.unshift(bullet);
        }
    };

    judgeCollision = (wave) => {
        let collisionList;
        if(this.isLive && (collisionList = (wave.enemyList || []).filter(e => e.isLive).filter(e => isCollisionArc(e, this))).length > 0){
            for(let e of collisionList){
                this.hp -= e.demage;
            }
            this.isLive = this.hp > 0;
        }
    };

    render = () => {
        this.bulletItemList.forEach(bulletItem => bulletItem.render());
        drawObject(this.imageNamespace, this);
        drawHpGauge(this, Math.max(this.hp / this.max_hp, 0),'#BAF649');
        this.skillList.forEach(skill => skill.draw(this));

        this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
        this.bulletItemList.filter(item => !item.isEmpty())[0].renderBulletInfo();
    };
}

class BgCosmos {
    constructor() {
        this.starList = [];
        this.cloudList = [
            [0.76, 0.82, 0.10],
            [0.60, 0.88, 0.10],
            [0.38, 0.80, 0.10],
            [0.25, 0.87, 0.10],
            [0.8, 0.98, 0.10],
            [-0.11, 0.95, 0.14],
            [0.11, 0.95, 0.10],
            [0.43, 0.91, 0.10],
            [0.43, 0.95, 0.20],
            [0.48, 0.88, 0.10],
            [0.89, 0.69, 0.10],
            [1.04, 0.55, 0.12],
            [0.97, 0.63, 0.10],
            [0.89, 0.88, 0.16]
        ];
        for (let i = 0; i < 50; i++) {
            this.addStar(randomInt(0, rHeight));
        }
    };

    addStar = (y = 0) => {
        this.starList[this.starList.length] = {
            x: randomInt(5, rWidth - 5), y: y, r: randomInt(1, 4) / 2
        };
    };

    calStar = () => {
        if (this.starList.length < 50 && randomInt(0, 100) > 75) {
            this.addStar();
        }

        this.starList = this.starList.map(star => {
            star.y += star.r;
            return star;
        })
            .filter(star => star.y - star.r < rHeight);
    };

    drawStar = (x, y, r) => {
        context.moveTo(x - r, y);
        context.arcTo(x, y, x, y + r, r);
        context.arcTo(x, y, x + r, y, r);
        context.arcTo(x, y, x, y - r, r);
        context.arcTo(x, y, x - r, y, r);
    };

    render = () => {
        this.calStar();
        if (this.starList.length <= 0) {
            return;
        }

        context.beginPath();
        context.lineWidth = 0.7;
        this.starList.forEach(star => {
            this.drawStar(star.x, star.y, star.r);
        });
        context.strokeStyle = '#fff';
        context.fillStyle = '#fff';
        context.stroke();
        context.fill();
        context.closePath();

        let wave_offset = Math.cos(Math.PI * frameIndex / 300) * 5;
        context.beginPath();
        this.cloudList.forEach(cloud => {
            context.arc(cloud[0] * rWidth + wave_offset, cloud[1] * rHeight, cloud[2] * rHeight, 0, 2 * Math.PI);
        });
        context.fillStyle = '#ffffff33';
        context.fill();
        context.closePath();

    }
}


class Viewer {
    initialize = () => {
        this.status = ViewerStatus.opening;
        this.itemManager = new ItemManager();
        this.background = new BgCosmos();
    };

    playing = () => {
        this.score = 0;
        this.story = storyBoard.story.concat();
        this.status = ViewerStatus.playing;
        this.player = new Player('player_2');
        this.onKeyDirectEvent = this.player.onKeyDirectEvent;
        this.onKeyInputEvent = this.player.onKeyInputEvent;
        postMessage({type: 'start'});
        this.toNextStory();
    };

    opening = () => {
        clear();
        //this.background.render();
    };

    guide = () => {
        this.status = ViewerStatus.guide;
        clear();
    };

    ending = () => {
    };

    render = () => {
        frameIndex++;
        clear();
        this.background.render();
        this.playManager.render();
        this.player.render();
        this.itemManager.render();

        this.calPosition();
        this.judgeCollisionWithSkill();
        this.judgeCollisionWithBullet();
        this.judgeCollisionWithPlayer();
        this.itemManager.judgeCollision(this.player);
        this.judgeToNext();
    };


    calPosition = () => {
        this.player.calPosition();
        this.playManager.calPosition(this.player);
    };

    toNextStory = () => {
        let story = this.story.shift();
        if (!story) {
            this.status = ViewerStatus.ending;
            return;
        }
        this.playManager = new PlayManager(story);
        this.itemManager.itemRule = story.itemRule;
    };

    judgeToNext = () => {
        if (this.playManager.status == PlayStatus.exit) {
            this.toNextStory();
        }
    };

    judgeCollisionWithPlayer = () => {
        if (!this.playManager.currentWave) {
            return;
        }

        this.player.judgeCollision(this.playManager.currentWave);
        if (!this.player.isLive) {
            this.status = ViewerStatus.dead;
            postMessage({ type: 'message', position: 'main', html: `<h1 style='color: red;'>You Dead</h1>`, time: 1500 })
        }
    };

    judgeCollisionWithBullet = () => {
        this.player.bulletItemList.forEach(bulletItem => {
            let result = this.playManager.judgeCollision(bulletItem.bulletList.filter(b => b.status == BulletStatus.fire));
            if (result && result.seqList && result.seqList.length > 0) {
                bulletItem.setupCollision(result.seqList);
                this.addScore(result.score);
            }
        });
    };

    judgeCollisionWithSkill = () => {
        let result = this.playManager.judgeCollisionWithSkill(this.player.skillList.filter(skill => skill.isFire));
        if (result && result.score && result.score > 0) this.addScore(result.score);
    };

    addScore = score => {
        let bScore = this.score, aScore = this.score + score;
        this.score = aScore;
        this.itemManager.changeScore(bScore, aScore);

        postMessage({ type: 'score', score: this.score });
    }
}

const viewer = new Viewer();
const render = time => {
    switch (viewer.status) {
        case ViewerStatus.playing:
            viewer.render(); break;
        case ViewerStatus.opening:
            viewer.opening(); break;
        case ViewerStatus.guide:
            viewer.guide(); break;
        case ViewerStatus.ending:
            viewer.ending(); break;
    }
    requestAnimationFrame(render);
};

const getImageBitmap = async (url, flip = false) => await createImageBitmap(await (await fetch(url)).blob(), { imageOrientation: flip ? 'flipY' : 'none' });

const __events = {
    init: async event => {
        canvas = event.data.canvas;
        context = canvas.getContext('2d');
        contextScale();

        imageOptions.forEach(
            async option => {
                imageSet[option.namespace] = await getImageBitmap(option.url, option.flip == true);
            }
        )

        viewer.initialize();
        requestAnimationFrame(render);
    },
    keyDirect: event => {
        let { eventName, key } = event.data;
        (viewer.onKeyDirectEvent || function () { })(eventName, key);
    },
    keyInput: event => {
        let { eventName, key, skillName } = event.data;
        if (key == 'enter') {
            if (eventName == 'keydown') return
            __events.nextEvent(viewer);
        } else {
            (viewer.onKeyInputEvent || function () { })(eventName, key, skillName);
        }
    },
    nextEvent: (viewer) => {
        switch (viewer.status) {
            case ViewerStatus.opening: viewer.playing(); break;
            case ViewerStatus.playing: viewer.status = ViewerStatus.pause;postMessage({type: 'pause'}); break;
            case ViewerStatus.pause: viewer.status = ViewerStatus.playing;postMessage({type: 'start'}); break;
        }
    }
};


self.onmessage = event => {
    let type = event.data.type;
    if(type == 'keyInput') console.log(event.data);

    if (!type || !__events[type]) {
        return;
    }

    __events[type](event);
};

postMessage({ type: 'ready' });