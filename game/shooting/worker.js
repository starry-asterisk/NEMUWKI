let _random = '?' + Math.random();


importScripts('./util/Variables.js' + _random);
importScripts('./util/Animation.js' + _random);
importScripts('./ItemManager.js' + _random);
importScripts('./enemy/BasicEnemy.js' + _random);
importScripts('./enemy/BasicPlay.js' + _random);
importScripts('./enemy/NoWaitPlay.js' + _random);
importScripts('./enemy/FollowPlay.js' + _random);
importScripts('./enemy/PlayManager.js' + _random);






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

const drawObject = (namespace, { x, y, r, isDemaged }) => {
    if(isDemaged) context.filter = filters.demaged; 
    let aspect_ratio = imageSet[namespace].height / imageSet[namespace].width;
    context.drawImage(imageSet[namespace], x - r, y - (r * aspect_ratio), 2 * r, 2 * r * aspect_ratio);
    if(isDemaged) context.filter = "none"; 

}



class Player {
    constructor(imageNamespace = 'player_1') {
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
        this.imageNamespace = imageNamespace;
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        this.bulletItemList = [new BasicBullet()];
        this.fireTerm = 0;
        this.isLive = true;
        this.isDemaged = false;
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
        drawObject(this.imageNamespace, this);

        this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
        this.bulletItemList.filter(item => !item.isEmpty())[0].renderBulletInfo();
    };
}

class BgCosmos {
    constructor() {
        this.frameIndex = 0;
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

        let wave_offset = Math.cos(Math.PI * this.frameIndex / 300) * 5;
        this.frameIndex++;
        context.beginPath();
        this.cloudList.forEach(cloud => {
            context.arc(cloud[0] * rWidth + wave_offset, cloud[1] * rHeight, cloud[2] * rHeight, 0, 2 * Math.PI);
        });
        context.fillStyle = '#ffffff33';
        context.fill();
        context.closePath();
        this.skill();
        
    }

    skill = () =>
    {

        context.fillStyle = '#ffffff33';
        context.beginPath();
        context.rect(rWidth / 2, 0, 40, rHeight);
        context.fill();
        context.closePath();
        context.beginPath();
        context.rect(rWidth / 2 + 18, 0, 4, rHeight);
        context.fillStyle = '#ffffff';
        context.fill();
        context.fillStyle = '#ffffff33';
        context.closePath();

        
        context.filter = 'blur(5px)';
        context.beginPath();
        context.rect(rWidth /2 - 20, 0, 80, rHeight);
        context.fill();
        context.beginPath();
        context.closePath();
        context.rect(rWidth / 2, 0, 40, rHeight);
        context.fill();
        context.beginPath();
        context.closePath();
        context.rect(rWidth / 2 + 19, 0, 2, rHeight);
        context.fill();
        context.closePath();
        context.filter = 'none';

        
        context.fillStyle = '#000000';
        context.strokeStyle = '#000000';
        context.beginPath();
        context.lineWidth = 4;
        let h= rHeight / 2;
        let i = -40
        context.moveTo(rWidth / 2 + i, h);
        for(; i <= 80; i += randomInt(1, 10)){
            h += randomInt(0, 8) - 2;
            context.lineTo(rWidth / 2 + i, h);
        }
        for(; i > -60; i -= randomInt(1, 10)){
            h += randomInt(0, 8) - 2;
            context.lineTo(rWidth / 2 + i, h);
        }
        for(; i <= 100; i += randomInt(1, 10)){
            h += randomInt(0, 8) - 2;
            context.lineTo(rWidth / 2 + i, h);
        }
        for(; i > -50; i -= randomInt(1, 10)){
            h += randomInt(0, 8) - 2;
            context.lineTo(rWidth / 2 + i, h);
        }
        for(; i <= 90; i += randomInt(1, 10)){
            h += randomInt(0, 8) - 2;
            context.lineTo(rWidth / 2 + i, h);
        }
        context.stroke();
        context.closePath();
        context.fillStyle = '#ffffff33';
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
        this.background.render();
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

postMessage({ type: 'ready' });