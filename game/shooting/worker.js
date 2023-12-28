let _random = '?'+Math.random();


importScripts('./util/Variables.js'+_random);
importScripts('./util/Animation.js'+_random);
importScripts('./ItemManager.js'+_random);
importScripts('./enemy/BasicEnemy.js'+_random);
importScripts('./enemy/BasicPlay.js'+_random);
importScripts('./enemy/NoWaitPlay.js'+_random);
importScripts('./enemy/FollowPlay.js'+_random);
importScripts('./enemy/PlayManager.js'+_random);






importScripts('./bullet.js');

importScripts('./storyBoard.js');


const randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
};

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



class Player {
    constructor() {
        this.s = 4;//move step
        this.r = 28;//size of character radius
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
        this.directKey = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        this.bulletItemList = [new BasicBullet()];
        this.fireTerm = 0;
        this.isLive = true;
    };

    onKeyDirectEvent = (eventName, key) => {
        this.directKey[key] = eventName == 'keydown';
    };

    onKeyInputEvent = (eventName, key) => {
        if (key != 'w') {
            return;
        }
        this.isInputKeyPress = eventName == 'keydown';
        this.inputKey = this.isInputKeyPress ? key : undefined;
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
        this.isLive = !(wave.enemyList || []).filter(e => e.isLive).some(e => isCollisionArc(e, this));
    };

    render = () => {
        this.bulletItemList.forEach(bulletItem => bulletItem.render());
        this.drawBody();

        this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
        this.bulletItemList.filter(item => !item.isEmpty())[0].renderBulletInfo();
    };

    drawBody = async () => {
        context.drawImage(imageSet.player, this.x - (imageSet.player.width / 2), this.y - (imageSet.player.height / 2));
    };
}


class Viewer {
    initialize = () => {
        this.status = ViewerStatus.opening;
        //this.background = new BgCosmos();
        this.itemManager = new ItemManager();
    };

    playing = () => {
        this.score = 0;
        this.story = storyBoard.story.concat();
        this.status = ViewerStatus.playing;
        this.player = new Player();
        this.onKeyDirectEvent = this.player.onKeyDirectEvent;
        this.onKeyInputEvent = this.player.onKeyInputEvent;

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
        clear();
        this.playManager.render();
        this.player.render();
        this.itemManager.render();

        this.calPosition();
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
    
        addScore = score => {
            let bScore = this.score, aScore = this.score + score;
            this.score = aScore;
            this.itemManager.changeScore(bScore, aScore);
            
            postMessage({type: 'score', score: this.score});
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

const getImageBitmap = async url => await createImageBitmap(await (await fetch(url)).blob());

const __events = {
    init: async event => {
        canvas = event.data.canvas;
        context = canvas.getContext('2d');
        contextScale();

        imageSet.player = await getImageBitmap('./imageSet/67x63_airplane.png');

        viewer.initialize();
        requestAnimationFrame(render);
    },
    keyDirect: event => {
        let { eventName, key } = event.data;
        (viewer.onKeyDirectEvent || function () { })(eventName, key);
    },
    keyInput: event => {
        let { eventName, key } = event.data;
        if (key == 'enter') {
            if (eventName == 'keydown') return
            __events.nextEvent(viewer);
        } else {
            (viewer.onKeyInputEvent || function () { })(eventName, key);
        }
    },
    nextEvent: (viewer) => {
        switch (viewer.status) {
            case ViewerStatus.opening: viewer.playing(); break;
            case ViewerStatus.playing: viewer.status = ViewerStatus.pause; break;
            case ViewerStatus.pause: viewer.status = ViewerStatus.playing; break;
        }
    }
};


self.onmessage = event => {
    let type = event.data.type;

    if (!type || !__events[type]) {
        return;
    }

    __events[type](event);
};
