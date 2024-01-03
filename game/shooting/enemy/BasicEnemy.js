class BasicEnemy {
    constructor({ play, x, s = 4, y = -28, r = 23, hp, score, wait, imageNamespace = 'enemy_1' }) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
        this.max_hp = this.hp = hp;
        this.score = score;
        this.wait = wait;
        this.isLive = true;
        this.isDemaged = false;
        this.demage = 10;
        this.outOfView = false;
        this.play = new play(this);
        this.calPosition = this.play.calPosition;
        this.imageNamespace = imageNamespace;
        this.timer = undefined;
    }

    damaged = ({ damage }) => {
        if(this.hp <= 0) return;
        this.hp -= damage;
        if (this.timer) clearTimeout(this.timer);
        else this.isDemaged = true;
        this.timer = setTimeout(() => {
            this.isLive = this.hp > 0;
            this.isDemaged = false;
            this.timer = undefined;
        }, times.demage_animation_duration);
    };

    render = () => {
        drawHpGauge(this, Math.max(this.hp / this.max_hp, 0));
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

    judgeCollisionWithSkill = (skill) => {
        if (this.isLive && skill.judgeCollision(this)) {
            this.damaged(skill);
            return true;
        } else {
            return false;
        }
    };
}