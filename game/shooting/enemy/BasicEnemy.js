class BasicEnemy {
    constructor(canvas, { play, x, s = 4, y = -28, r = 28, hp, score, bodyStyle, bodyStrokeStyle, wait }) {
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
        this.play = new play(canvas, this);
        this.calPosition = this.play.calPosition;
    }

    damaged = ({ damage }) => {
        this.hp -= damage;
        this.isLive = this.hp > 0;
    };

    drawBody = ({context, x, y, r, bodyStyle, bodyStrokeStyle}) => {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.fillStyle = bodyStyle;
        context.fill();

        context.strokeStyle = bodyStrokeStyle;
        context.stroke();
        context.closePath();
    };

    drawEyes = ({ context, x, y }, outerEyesStyle, innerEyesStyle) => {
        context.beginPath();
        context.arc(x-12, y+10, 7, 0, Math.PI*2, false);
        context.arc(x+12, y+10, 7, 0, Math.PI*2, false);
        context.fillStyle = outerEyesStyle;
        context.fill();
        context.closePath();

        context.beginPath();
        context.arc(x-11, y+13, 2, 0, Math.PI*2, false);
        context.arc(x+11, y+13, 2, 0, Math.PI*2, false);
        context.fillStyle = innerEyesStyle;
        context.fill();
        context.closePath();
    };

    render = () => {
        // body
        this.drawBody(this);

        // eyes
        let outerEyesStyle = '#FEFEFE';
        let innerEyesStyle = '#090909';
        this.drawEyes(this, outerEyesStyle, innerEyesStyle);
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