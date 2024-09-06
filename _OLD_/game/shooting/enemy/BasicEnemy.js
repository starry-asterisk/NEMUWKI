class BasicEnemy {
    constructor({ play, x, s = 4, y = -28, r = 23, hp, score, wait, imageNamespace = 'enemy_1' }) {
        this._id = Math.random();
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
        this.max_hp = this.hp = hp;
        this.score = score;
        this.wait = wait;
        this.isLive = true;
        this.demagedDuration = 0;
        this.demage = 10;
        this.outOfView = false;
        this.play = new play(this);
        this.calPosition = this.play.calPosition;
        this.imageNamespace = imageNamespace;
        this.deadDuration = 0;
        this.demageAnimation;
        this.randomSeed;
    }

    damaged = ({ damage, demageAnimation = Animation.demageDefault(damage), demagedDuration = times.demage_animation_duration}) => {
        if(!this.isLive) return;
        this.hp -= damage;
        this.isLive = this.hp > 0;
        this.demagedDuration = demagedDuration;
        this.demageAnimation = demageAnimation;
        this.randomSeed = Math.random();
    };

    renderLive = () => {
        if(this.demagedDuration) {
            this.demagedDuration--;
            this.demageAnimation(this, this.demagedDuration);
        } else {
            drawObject(this.imageNamespace, this);
        }
        
        drawHpGauge(this, Math.max(this.hp / this.max_hp, 0));
    };

    renderDead = () => {
        if(this.demagedDuration) {
            this.demagedDuration--;
            this.demageAnimation(this, this.demagedDuration);
        } else {
            this.deadDuration--;
            let p = this.deadDuration / times.dead_duration;
            context.globalAlpha = p;
            drawObject(this.imageNamespace, this);
            context.globalAlpha = 1;
            drawBoom(this.x, this.y, p);
        }
    }

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