const rWidth = 400;
const rHeight = 400 * 1.5;

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

const renderTxtView = (canvas, txtData) => {
    let context = getContext(canvas);
    let data = Object.assign({
        bg : { rgb : '256,256,256', alpha : 1 },
        font : { rgb : '0,0,0', alpha : 1 },
        message : '',
        bottomMessage : undefined,
        usePressKey : false,
        pressMessage : 'press enter key to restart'
    }, txtData);

    let x = rWidth/2, y = rHeight/2;
    context.beginPath();
    context.fillStyle = data.bgStyle || `rgba(${data.bg.rgb},${data.bg.alpha})`;
    context.fillRect(0, 0, rWidth, rHeight);
    context.fillStyle = data.fontStyle || `rgba(${data.font.rgb},${data.font.alpha})`;
    context.textAlign = "center";
    context.font = "38px Sans MS";
    context.fillText(data.message, x, y - (data.usePressKey ? 30 : 0));
    if (data.usePressKey) {
        context.font = "20px Sans MS";
        context.fillText(data.pressMessage, x, y + 30);
    }
    if (data.bottomMessage) {
        context.textAlign = "right";
        context.font = "15px Sans MS";
        context.fillText(data.bottomMessage, rWidth - 30, rHeight - 20);
    }
    context.closePath();
};

const renderMultiTxtView = (canvas, txtData) => {
    let context = getContext(canvas);
    let data = Object.assign({
        bg : { rgb : '256,256,256', alpha : 1 },
        font : { rgb : '0,0,0', alpha : 1, size : 20 },
        messageList : [''],
        usePressKey : false,
        pressMessage : 'press enter key or touch to start'
    }, txtData);

    let lineSize = data.font.size + 10, x = rWidth/2, y = (rHeight/2) - (lineSize * data.messageList.length / 2);
    context.beginPath();
    context.fillStyle = data.bgStyle || `rgba(${data.bg.rgb},${data.bg.alpha})`;
    context.fillRect(0, 0, rWidth, rHeight);
    context.fillStyle = data.fontStyle || `rgba(${data.font.rgb},${data.font.alpha})`;
    context.textAlign = "center";
    context.font = `${data.font.size}px Sans MS`;
    for (let msg of data.messageList) {
        context.fillText(msg, x, y);
        y += lineSize;
    }

    if (data.usePressKey) {
        context.fillText(data.pressMessage, x, y);
    }
    context.closePath();
};

const renderBoom = (context, fillStyle, x, y, r) => {
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

const contextScale = (canvas) => {
    let context = canvas.getContext('2d');
    let ratioX = canvas.width / rWidth;
    let ratioY = canvas.height / rHeight;
    context.scale(ratioX, ratioY);
};

const getContext = (canvas) => canvas.getContext('2d');

const clear = (context) => {
    context.clearRect(0, 0, rWidth, rHeight);
};

const imageSet = {};

class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = getContext(canvas);
        this.s = 3;//move step
        this.r = 28;//size of character radius
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
        this.isDirectKeyPress = false;
        this.directKey = undefined;
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        //this.bulletItemList = [ new BasicBullet(canvas) ];
        //this.fireTerm = 0;
        this.isLive = true;
    };

    onKeyDirectEvent = (eventName, key) => {
        this.isDirectKeyPress = eventName == 'keydown';
        this.directKey = this.isDirectKeyPress ? key : undefined;
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
        //this.fireBullet();
        //this.bulletItemList.forEach(bulletItem => bulletItem.calPosition());
    };

    moveBody = () => {
        if (!this.isDirectKeyPress) {
            return;
        }

        let { x, s, r } = this;
        if (this.directKey) {
            this.x = (this.directKey == 'left' ? Math.max(x-s, r) : Math.min(x+s, rWidth - r));
        }
    };
/*
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
        this.isLive = !(wave.enemyList||[]).filter(e => e.isLive).some(e => isCollisionArc(e, this));
    };*/

    render = () => {
        //this.bulletItemList.forEach(bulletItem => bulletItem.render());
        this.drawBody();

        //this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
        //this.bulletItemList.filter(item => !item.isEmpty())[0].renderBulletInfo();
    };

    drawBody = async () => {
        this.context.drawImage(imageSet.player, this.x - (imageSet.player.width / 2), this.y - (imageSet.player.height / 2));
    };
}

const ViewerStatus = {
    opening : Symbol('opening'),
    guide : Symbol('guide'),
    playing : Symbol('playing'),
    ending : Symbol('ending'),
    dead : Symbol('dead')
};

class Viewer {
    initialize = (canvas) => {
        this.status = ViewerStatus.opening;
        this.canvas = canvas;
        this.context = getContext(this.canvas);
        //this.background = new BgCosmos(this.canvas, this.context);
        //this.itemManager = new ItemManager(this.canvas);
    };

    playing = () => {
        this.score = 0;
        //this.story = storyBoard.story.concat();
        this.status = ViewerStatus.playing;
        this.player = new Player(this.canvas);
        this.onKeyDirectEvent = this.player.onKeyDirectEvent;
        this.onKeyInputEvent = this.player.onKeyInputEvent;

        //this.toNextStory();
    };

    opening = () => {
        clear(this.context);
        //this.background.render();
        //renderTxtView(this.canvas, storyBoard.txt.opening);
    };

    guide = () => {
        this.status = ViewerStatus.guide;
        clear(this.context);
        //this.background.render();
        //renderMultiTxtView(this.canvas, storyBoard.txt.guide);
    };

    ending = () => {
        //renderTxtView(this.canvas, storyBoard.txt.ending);
    };

    render = () => {
        clear(this.context);
        //this.background.render();
        //this.playManager.render();
        this.player.render();
        //this.itemManager.render();
        //this.renderScore();

        this.calPosition();
        //this.judgeCollisionWithBullet();
        //this.judgeCollisionWithPlayer();
        //this.itemManager.judgeCollision(this.player);
        //this.judgeToNext();
    };
/*
    renderScore = () => {
        this.context.beginPath();
        this.context.font = "15px Sans MS";
        this.context.fillStyle = '#FFFFFF';
        this.context.textAlign = "left";
        this.context.fillText(`SCORE : ${this.score}`, 15, 20);
        this.context.closePath();
    };*/

    calPosition = () => {
        this.player.calPosition();
        //this.playManager.calPosition(this.player);
    };
/*
    toNextStory = () => {
        let story = this.story.shift();
        if (!story) {
            this.status = ViewerStatus.ending;
            return;
        }
        this.playManager = new PlayManager(this.canvas, story);
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
            renderTxtView(this.canvas, storyBoard.txt.dead);
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
    }*/
}

const viewer = new Viewer();
const render = time => {
    switch (viewer.status) {
        case ViewerStatus.playing :
            viewer.render(); break;
        case ViewerStatus.opening :
            viewer.opening(); break;
        case ViewerStatus.guide :
            viewer.guide(); break;
        case ViewerStatus.ending :
            viewer.ending(); break;
    }
    requestAnimationFrame(render);
};

const getImageBitmap = async url => await createImageBitmap(await (await fetch(url)).blob());

const __events = {
    init : async event => {
        let canvas = event.data.canvas;
        contextScale(canvas);

        imageSet.player = await getImageBitmap('./imageSet/67x63_airplane.png');

        viewer.initialize(canvas);
        requestAnimationFrame(render);
    },
    keyDirect : event => {
        let { eventName, key } = event.data;
        (viewer.onKeyDirectEvent||function(){})(eventName, key);
    },
    keyInput : event => {
        let { eventName, key } = event.data;
        if (key == 'enter' && viewer.status != ViewerStatus.playing) {
            if(eventName == 'keyup') __events.nextEvent(viewer);
        } else {
            (viewer.onKeyInputEvent || function(){})(eventName, key);
        }
    },
    nextEvent : (viewer) => {
        switch (viewer.status) {
            case ViewerStatus.opening : viewer.guide(); break;
            case ViewerStatus.guide : viewer.playing(); break;
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
