class BasicEnemy {
    constructor({ play, x, s = 4, y = -28, r = 28, hp, score, wait, imageNamespace = 'enemy_1' }) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
        this.hp = hp;
        this.score = score;
        this.wait = wait;
        this.isLive = true;
        this.isDemaged = false;
        this.outOfView = false;
        this.play = new play(this);
        this.calPosition = this.play.calPosition;
        this.imageNamespace = imageNamespace;
        this.timer = undefined;
    }

    damaged = ({ damage }) => {
        this.hp -= damage;
        this.isLive = this.hp > 0;
        if (this.timer) clearTimeout(this.timer);
        else this.isDemaged = true;
        this.timer = setTimeout(() => {
            this.isDemaged = false;
            this.timer = undefined;
        }, times.demage_animation_duration);
    };

    render = () => {
        drawObject(this.imageNamespace, this);
    };

    judgeCollision = (bullet) => {
        if (this.isLive && isCollisionWithBullet(this, bullet)) {
            this.damaged(bullet);
            return true;
        } else {
            return false;
        }
    };
}