class BasicEnemy {
    constructor({ play, x, s = 4, y = -28, r = 28, hp, score, bodyStyle, bodyStrokeStyle, wait }) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
        this.hp = hp;
        this.score = score;
        this.bodyStyle = bodyStyle;
        this.bodyStrokeStyle = bodyStrokeStyle;
        this.wait = wait;
        this.isLive = true;
        this.outOfView = false;
        this.play = new play(this);
        this.calPosition = this.play.calPosition;
    }

    damaged = ({ damage }) => {
        this.hp -= damage;
        this.isLive = this.hp > 0;
    };

    drawBody = ({x, y, r, bodyStyle, bodyStrokeStyle}) => {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.fillStyle = bodyStyle;
        context.fill();

        context.strokeStyle = bodyStrokeStyle;
        context.stroke();
        context.closePath();
    };

    render = () => {
        // body
        this.drawBody(this);
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