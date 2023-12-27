class Lizard {
    constructor(canvas, image) {
        this.canvas = canvas;
        this.image = image;
        this.context = getContext(canvas);
        this.s = 3;//move step
        this.r = 28;//size of character radius
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
        this.isDirectKeyPress = false;
        this.directKey = undefined;
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        this.bulletItemList = [ new BasicBullet(canvas) ];
        this.fireTerm = 0;
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
        this.fireBullet();
        this.bulletItemList.forEach(bulletItem => bulletItem.calPosition());
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
    };

    render = () => {
        this.bulletItemList.forEach(bulletItem => bulletItem.render());
        this.drawBody();
        //this.drawEyes();

        this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
        this.bulletItemList.filter(item => !item.isEmpty())[0].renderBulletInfo();
    };
/*
    drawEyes = () => {
        let { x, y } = this;
        this.context.beginPath();
        this.context.arc(x-13, y-10, 7, 0, Math.PI*2, false);
        this.context.arc(x+13, y-10, 7, 0, Math.PI*2, false);
        this.context.fillStyle = '#b4ddfc';
        this.context.fill();
        this.context.closePath();

        this.context.beginPath();
        this.context.arc(x-11, y-13, 2, 0, Math.PI*2, false);
        this.context.arc(x+11, y-13, 2, 0, Math.PI*2, false);
        this.context.fillStyle = '#200e09';
        this.context.fill();
        this.context.closePath();
    };*/

    drawBody = async () => {
        /*
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
        this.context.fillStyle = '#5FAA23';
        this.context.fill();
        this.context.strokeStyle = "rgba(0, 0, 255, 0.5)";
        this.context.stroke();
        this.context.closePath();*/
        this.context.drawImage(this.image, this.x - (this.image.width / 2), this.y - (this.image.height / 2));
    };
}