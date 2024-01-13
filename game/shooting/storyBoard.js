const imageOptions = [
    {
        namespace: 'player_1',
        url: './imageSet/67x63_airplane.png'
    },
    {
        namespace: 'player_2',
        url: './imageSet/player_2.png'
    },
    {
        namespace: 'enemy_1',
        url: './imageSet/enemy_1.png',
        flip: true
    },
    {
        namespace: 'enemy_2',
        url: './imageSet/enemy_2.png',
        flip: true
    },
]

class hikari_yo {
    name = 'hikari_yo';
    image_url = '/game/shooting/imageSet/skill2.jpg';
    cost = 5;
    speed = 10.0;
    duration = 150;
    delay = 150;
    remain = 0;
    fire_x = 0;
    fire_y = 0;
    x = 0;
    y = 0;
    r = 10;
    damage = 1000;
    isFire = false;
    collisionEnemy = [];
    demageAnimation = Animation.demageAnimation;
    demagedDuration =  times.demage_animation_duration;
    regist = ({ x, y }) => {
        if (this.remain > 0) return;
        this.r = 10;
        this.x = this.fire_x = x;
        this.y = this.fire_y = y;
        this.remain = this.duration + this.delay;
        this.isFire = true;
        this.collisionEnemy = [];
    };
    draw = ({ x, y }) => {
        if (this.remain < 1) return;
        this.remain--;
        if (this.remain < 1) {
            this.isFire = false;
        }
        let speed = 10.0;
        let total_t = this.duration + this.delay;
        let total_t2 = this.duration;

        if (total_t2 < this.remain) {
            this.x = this.fire_x = x;
            this.y = this.fire_y = y;

            let delay = [50, 0, 10, 40, 20];
            let t1 = (total_t - this.remain) % 100;
            let size = 80;


            let gradient4 = context.createRadialGradient(x, y, 0, x, y, size);
            gradient4.addColorStop(0, "transparent");
            gradient4.addColorStop(0.5, "#96FAFCdd");
            gradient4.addColorStop(1, "transparent");

            context.shadowBlur = 3;
            context.shadowColor = '#4641F699';
            context.strokeStyle = gradient4;
            context.lineWidth = 3;

            context.beginPath();

            for (let i = 0; i < 5; i++) {
                if (t1 < delay[i]) continue;

                let d1 = Math.PI * 0.4 * i;
                let s1 = Math.max(size - t1 + delay[i], 0);
                let s2 = Math.max(size - (t1 - delay[i]) * 2, 0);
                let cos = Math.cos(d1);
                let sin = Math.sin(d1);
                context.moveTo(x + cos * s1, y - 30 + sin * s1);
                context.lineTo(x + cos * s2, y - 30 + sin * s2);
            }

            context.stroke();


            let r = (total_t - this.remain) / this.delay * 75;
            context.shadowBlur = 0;
            context.shadowColor = '';


            let gradient6 = context.createRadialGradient(x, y - 30, 0, x, y - 30, r * 2);
            gradient6.addColorStop(0.1, "#FFFFFF55");
            gradient6.addColorStop(0.2, "#B62FE155");
            gradient6.addColorStop(0.3, "#4641F655");
            gradient6.addColorStop(0.8, "#4641F600");
            context.fillStyle = gradient6;

            context.beginPath();
            context.rect(x - 75, y - 33, 150, 6);
            context.rect(x - 3, y - 105, 6, 150);
            context.fill();

            let gradient5 = context.createRadialGradient(x, y - 30, 0, x, y - 30, r);
            gradient5.addColorStop(0.1, "#FFFFFF");
            gradient5.addColorStop(0.2, "#B62FE155");
            gradient5.addColorStop(0.3, "#4641F655");
            gradient5.addColorStop(1, "#4641F600");
            context.fillStyle = gradient5;


            context.beginPath();
            context.arc(x, y - 30, r, Math.PI * 2, 0);
            context.fill();

        } else {
            this.r = 120;

            x = this.fire_x;
            y = this.fire_y;
            let y_bottom = y;
            let y_top = this.y = y_bottom + (this.remain - total_t2) * speed + 70;
            let y_top2 = y_bottom + (this.remain - total_t2) * (speed - 5) + 70;


            /*===============================================================================================================*/

            let y1 = y_top - 150;
            let y2 = y_top2 - y_top > 300 ? y_top + 150 : y_top2 - 150;

            let gradient2 = context.createLinearGradient(0, y1, 0, y2);
            gradient2.addColorStop(0, "#4641F699");
            gradient2.addColorStop(1, "#4641F600");
            context.fillStyle = gradient2;
            context.filter = 'blur(2px)';

            context.beginPath();
            context.moveTo(x - 100, y_top + 150);
            context.bezierCurveTo(x - 100, y_top - 50, x - 50, y_top - 150, x, y_top - 150);
            context.bezierCurveTo(x + 50, y_top - 150, x + 100, y_top - 50, x + 100, y_top + 150);
            context.fill();

            /*===============================================================================================================*/

            let gradient = context.createLinearGradient(0, y_top - 140, 0, y_bottom);
            gradient.addColorStop(0, "#FDCFFE99");
            gradient.addColorStop(0.2, "#B62FE199");
            gradient.addColorStop(0.4, "#4641F699");
            gradient.addColorStop(1, "transparent");
            context.fillStyle = gradient;
            context.filter = 'blur(2px)';

            context.beginPath();
            context.arc(x, y_top - 100, 40, Math.PI, 0);
            context.moveTo(x - 40, y_top - 100);
            context.lineTo(x - 35, y_top - 70);
            context.lineTo(x - 30, y_top - 75);
            context.lineTo(x - 25, y_top - 45);
            context.lineTo(x - 20, y_top - 50);
            context.lineTo(x - 15, y_top - 25);
            context.lineTo(x - 10, y_top - 30);
            context.lineTo(x - 5, y_top - 10);
            context.lineTo(x, y_top2);
            context.lineTo(x + 5, y_top - 10);
            context.lineTo(x + 10, y_top - 30);
            context.lineTo(x + 15, y_top - 25);
            context.lineTo(x + 20, y_top - 50);
            context.lineTo(x + 25, y_top - 45);
            context.lineTo(x + 30, y_top - 75);
            context.lineTo(x + 35, y_top - 70);
            context.lineTo(x + 40, y_top - 100);

            context.fill();


            /*===============================================================================================================*/

            let gradient3 = context.createLinearGradient(0, y_top - 60, 0, y_top + 100);
            gradient3.addColorStop(0, "#ffffffaa");
            gradient3.addColorStop(0.7, "transparent");
            context.strokeStyle = gradient3;
            context.lineWidth = 4;
            context.filter = 'blur(1px)';

            context.beginPath();
            lightning(-15);
            lightning();
            lightning(15);

            context.stroke();

            function lightning(x_offset = 0) {
                let l_x = x + x_offset;
                let l_y = y_top - 100;
                let offset = 5;
                context.moveTo(l_x, l_y);
                while (l_y < y_bottom) {
                    l_x = randomInt(l_x - offset, l_x + offset);
                    l_y += randomInt(0, 10);
                    context.lineTo(l_x, l_y);
                }
            }


            /*===============================================================================================================*/

            context.fillStyle = '#ffffff22';
            context.filter = 'blur(5px)';

            context.beginPath();
            context.arc(x, y_top - 100, 50, 0, 2 * Math.PI);
            context.fill();

            /*===============================================================================================================*/

            context.fillStyle = '#ffffff';
            context.filter = 'blur(1px)';

            context.beginPath();
            context.arc(x, y_top - 100, 30, 0, 2 * Math.PI);
            context.fill();

            context.filter = 'none';
        }

    };
    judgeCollision = (enemy) => {
        if(this.collisionEnemy[enemy._id]) return false;
        if(this.isFire && isCollisionArc({x: this.x, y: this.r > 5 ? this.y + 50 : this.y, r: this.r}, enemy)){
            this.collisionEnemy[enemy._id] = true;
            return true;
        }
        return false;
    };
};

class sector_skill1 {
    name = 'sector_skill1';
    image_url = '/game/shooting/imageSet/skill1.jpg';
    cost = 2;
    speed = 0.2;
    speed2 = 60;
    duration = 150;
    delay = 0;
    remain = 0;
    x = 0;
    y = 0;
    inner_r = 50;
    outer_r = 600;
    s_angle = 1.35;
    e_angle = 1.65;
    damage = 100;
    isFire = false;
    bulletList = [];
    bulletSize = 3;
    color = '#DE52AA';
    text = '1P';
    demageAnimation = ({x, y, r, imageNamespace, randomSeed}, time) => {
        drawObject(imageNamespace, {x, y, r});
        let p = time / this.demagedDuration;
        let alpha = (Math.floor(p * 154)+16).toString(16);
        drawPixelArtCircle(Math.ceil((1 - p) * 3 ) * 2 + 4, Math.ceil(p * 2), x + randomInt(-r, r, randomSeed), y, this.color + alpha , '#ffffff' + alpha);
        drawDemage(x + randomInt(0, 10, randomSeed), y, this.damage, p);
    };
    demagedDuration = 16;
    demageInterval = 10;
    regist = ({x, y}) => {
        if (this.remain > 0) return;
        this.r = 10;
        this.x = x;
        this.y = y;
        this.remain = this.duration + this.delay;
        this.isFire = true;
    };
    draw = ({x, y}) => {
        if (this.remain < 1) return;
        this.remain--;
        if (this.remain < 1) {
            this.isFire = false;
        }
        this.x = x;
        this.y = y;
        /*  부채꼴 그리는 function
        context.beginPath();
        context.moveTo(x, y);
        context.arc(x, y, this.outer_r, this.s_angle * Math.PI, this.e_angle * Math.PI, false);
        context.moveTo(x, y);
        context.arc(x, y, this.inner_r, this.e_angle * Math.PI, this.s_angle * Math.PI, true);
        context.fillStyle = '#ffffff22';
        context.fill();*/
        context.beginPath();
        let i = 3;
        
        if(this.remain % (1 / this.speed) == 0) this.addBullet();

        for(let index in this.bulletList){
            let cos = Math.cos(this.bulletList[index].angle * Math.PI);
            let sin = Math.sin(this.bulletList[index].angle * Math.PI);
            this.bulletList[index].r2 = Math.min(this.bulletList[index].r2 + this.speed2 * 2, this.outer_r);
            this.bulletList[index].r1 += this.speed2;
            context.moveTo(this.bulletList[index].fired.x + cos * this.bulletList[index].r1, this.bulletList[index].fired.y + sin * this.bulletList[index].r1);
            context.lineTo(this.bulletList[index].fired.x + cos * this.bulletList[index].r2, this.bulletList[index].fired.y + sin * this.bulletList[index].r2)
        }

        this.bulletList = this.bulletList.filter(bullet =>  bullet.r1 < this.outer_r);

        context.strokeStyle = '#ffffff';
        context.lineWidth = this.bulletSize;
        context.stroke();
        context.strokeStyle = this.color + '55';
        context.lineWidth = this.bulletSize + 4;
        context.filter = 'blur(3px)';
        context.stroke();
        context.closePath();

        context.filter = 'none';

        let seq = [0,1,2,3,4,4,3,2,1,0]

        drawPixelFont(x,y - 45 - seq[Math.floor(this.remain / 10) % 10], this.text , this.color);
    };
    addBullet = (num = 0) => {
        this.bulletList.push({
            angle: this.s_angle + randomInt(0, (this.e_angle - this.s_angle) * 100, random[Math.floor(this.remain + num) % 100]) / 100,
            r1: 0,
            r2: 0,
            fired: {
                x: this.x,
                y: this.y
            }
        });
    };
    judgeCollision = (enemy) => {
        if(this.remain % (this.demagedDuration + this.demageInterval) != 0) return false;
        if(!this.isFire) return false;
        return isCollisionSector(this, enemy);
    }
}

class sector_skill2 extends sector_skill1 {
    name = 'sector_skill2';
    image_url = '/game/shooting/imageSet/skill3.jpg';
    color = '#88ED5B';
    text = '2P';
    speed = 0.05;
    bulletSize = 6;
    damage = 1000;

    addBullet = (num = 0) => {
        let wave = viewer.playManager.currentWave;
        if(wave == null || wave.outOfView) return;
        let list = wave.enemyList.filter(e => e.isLive && e.y < this.y);
        if(list.length < 1) return;
        let target = list[randomInt(0, list.length - 1)];
        let angle =  Math.atan2(this.y - target.y , this.x - target.x) / Math.PI;
        if(angle < 0) angle *= -1;
        else angle = 1 + angle;
        
        this.bulletList.push({
            _id: target._id,
            angle: angle,
            demaged: false,
            r1: 0,
            r2: 0,
            fired: {
                x: this.x,
                y: this.y
            }
        });
    };
    judgeCollision = (enemy) => {
        if(!this.isFire) return false;
        let bullet = this.bulletList.find(b => b._id == enemy._id);
        if(bullet == undefined || bullet.demaged ||  bullet.r1 < this.outer_r * 0.8) return false;
        return bullet.demaged = true;
    }
}

const skillSet = [
    hikari_yo,
    sector_skill1,
    sector_skill2
];

const enemyAbility = {
    EMPTY: {},
    GRAYS: {
        LITEGRAY: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 6.5,
            hp: 100,
            score: 10,
            wait: 180,
            imageNamespace: 'enemy_1'
        },
        GRAY: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 6.5,
            hp: 270,
            score: 20,
            wait: 180,
            imageNamespace: 'enemy_1'
        },
        DARKGRAY: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 7,
            hp: 400,
            score: 40,
            wait: 180,
            imageNamespace: 'enemy_1'
        }
    },
    YELLOWS: {
        LITEYELLOW: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 5,
            hp: 230,
            score: 15,
            wait: 200,
            imageNamespace: 'enemy_1'
        },
        YELLOW: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 5,
            hp: 480,
            score: 40,
            wait: 200,
            imageNamespace: 'enemy_1'
        },
        DARKYELLOW: {
            clazz: BasicEnemy,
            play: BasicPlay,
            s: 5,
            hp: 1050,
            score: 80,
            wait: 200,
            imageNamespace: 'enemy_1'
        }
    },
    REDS: {
        LITERED: {
            clazz: BasicEnemy,
            play: FollowPlay,
            s: 6.5,
            hp: 300,
            score: 25,
            wait: 180,
            imageNamespace: 'enemy_2'
        },
        RED: {
            clazz: BasicEnemy,
            play: FollowPlay,
            s: 6.5,
            hp: 400,
            score: 50,
            wait: 180,
            imageNamespace: 'enemy_2'
        },
        DARKRED: {
            clazz: BasicEnemy,
            play: FollowPlay,
            s: 7.5,
            hp: 800,
            score: 80,
            wait: 180,
            imageNamespace: 'enemy_2'
        }
    },
    BLUES: {
        LITEBLUE: {
            clazz: BasicEnemy,
            play: NoWaitPlay,
            s: 6.5,
            hp: 150,
            score: 20,
            imageNamespace: 'enemy_2'
        },
        BLUE: {
            clazz: BasicEnemy,
            play: NoWaitPlay,
            s: 7.3,
            hp: 350,
            score: 50,
            imageNamespace: 'enemy_2'
        },
        DARKBLUE: {
            clazz: BasicEnemy,
            play: NoWaitPlay,
            s: 7.8,
            hp: 600,
            score: 100,
            imageNamespace: 'enemy_2'
        }
    }
};

const story = (function () {
    let genOpening = level => Object.assign({
        message: 'STAGE ' + level,
        bgStyle: 'rgba(0,128,0,0.2)',
        fontStyle: '#ffdb2a'
    });
    let ending = {
        message: 'MISSION COMPLETE',
        bgStyle: 'rgba(0,128,0,0.2)',
        fontStyle: '#ffdb2a'
    };
    let genStory = level => (...waveList) => (step, ...items) => ({
        level: level,
        itemRule: { step: step, itemList: items },
        waveList: waveList
    });

    let merge = (enemy, opt) => Object.assign({}, enemy, opt);
    let { EMPTY } = enemyAbility;
    let { LITEGRAY, GRAY, DARKGRAY } = enemyAbility.GRAYS;
    let { LITEYELLOW, YELLOW, DARKYELLOW } = enemyAbility.YELLOWS;
    let { LITERED, RED, DARKRED } = enemyAbility.REDS;
    let { LITEBLUE, BLUE, DARKBLUE } = enemyAbility.BLUES;

    return [
        genStory(1)(
            [
                LITEGRAY,
                merge(LITEGRAY, { wait: LITEGRAY.wait + 25 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 50 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 75 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 100 })
            ],
            [
                merge(LITEGRAY, { wait: LITEGRAY.wait + 100 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 75 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 50 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 25 }),
                LITEGRAY
            ],
            [
                merge(LITEYELLOW, { wait: LITEYELLOW.wait + 25 }),
                merge(LITEGRAY, { wait: LITEYELLOW.wait - 25 }),
                LITEYELLOW,
                merge(LITEGRAY, { wait: LITEYELLOW.wait - 25 }),
                merge(LITEYELLOW, { wait: LITEYELLOW.wait + 25 })
            ],
            [
                LITEYELLOW,
                merge(LITEYELLOW, { wait: LITEYELLOW.wait + 25 }),
                EMPTY,
                merge(LITEYELLOW, { wait: LITEYELLOW.wait + 25 }),
                LITEYELLOW
            ],
            [
                merge(LITEBLUE, { y: -250 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait - 20 }),
                merge(LITEBLUE, { y: -250 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait - 20 }),
                merge(LITEBLUE, { y: -250 })
            ]
        )(100, FastBullet),
        genStory(2)(
            [
                merge(LITEGRAY, { wait: LITEGRAY.wait + 40 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 20 }),
                LITEGRAY,
                merge(LITEGRAY, { wait: LITEGRAY.wait + 20 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 40 })
            ],
            [
                merge(LITEBLUE, { y: -360 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait - 40 }),
                merge(LITEBLUE, { y: -290 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait - 40 }),
                merge(LITEBLUE, { y: -220 })
            ],
            [LITEGRAY, LITEYELLOW, LITERED, LITEYELLOW, LITEGRAY],
            [
                merge(LITEBLUE, { y: -300 }),
                LITERED,
                merge(LITEBLUE, { y: -300 }),
                LITERED,
                merge(LITEBLUE, { y: -300 })
            ],
            [
                LITERED,
                merge(DARKBLUE, { y: -350 }),
                LITERED,
                merge(DARKBLUE, { y: -350 }),
                LITERED
            ]
        )(150, FastBullet, WaveBullet),
        genStory(3)(
            [
                merge(GRAY, { wait: LITEGRAY.wait + 40 }),
                merge(LITEGRAY, { wait: LITEGRAY.wait + 20 }),
                GRAY,
                merge(LITEGRAY, { wait: LITEGRAY.wait + 20 }),
                merge(GRAY, { wait: LITEGRAY.wait + 40 })
            ],
            [
                LITEGRAY,
                merge(GRAY, { wait: GRAY.wait + 20 }),
                merge(LITEGRAY, { wait: GRAY.wait + 40 }),
                merge(GRAY, { wait: GRAY.wait + 20 }),
                LITEGRAY
            ],
            [
                GRAY,
                merge(LITERED, { wait: GRAY.wait + 20 }),
                GRAY,
                merge(LITERED, { wait: GRAY.wait + 20 }),
                GRAY
            ],
            [
                YELLOW,
                EMPTY,
                merge(LITERED, { wait: YELLOW.wait + 20 }),
                EMPTY,
                YELLOW
            ],
            [
                merge(LITERED, { wait: LITERED.wait + 20 }),
                merge(LITERED, { wait: LITERED.wait + 10 }),
                LITERED,
                merge(LITERED, { wait: LITERED.wait + 10 }),
                merge(LITERED, { wait: LITERED.wait + 20 })
            ]
        )(200, FastBullet, WaveBullet, StrongBullet),
        genStory(4)(
            [YELLOW, YELLOW, YELLOW, YELLOW, LITERED],
            [LITERED, GRAY, GRAY, GRAY, GRAY],
            [LITERED, RED, EMPTY, RED, LITERED],
            [EMPTY, RED, merge(LITEBLUE, { y: -360 }), RED, EMPTY],
            [RED, merge(LITEBLUE, { y: -360 }), RED, merge(LITEBLUE, { y: -360 }), RED]
        )(200, FastBullet, WaveBullet, StrongBullet, QuintupleBullet),
        genStory(5)(
            [
                merge(LITEBLUE, { y: -480 }),
                merge(LITEBLUE, { y: -360 }),
                merge(LITEBLUE, { y: -240 }),
                merge(LITEBLUE, { y: -120 }),
                LITEBLUE
            ],
            [
                LITEBLUE,
                merge(LITEBLUE, { y: -120 }),
                merge(LITEBLUE, { y: -240 }),
                merge(LITEBLUE, { y: -360 }),
                merge(LITEBLUE, { y: -480 })
            ],
            [
                merge(GRAY, { wait: GRAY.wait - 40 }),
                merge(BLUE, { y: -270 }),
                merge(GRAY, { wait: GRAY.wait - 40 }),
                merge(BLUE, { y: -270 }),
                merge(GRAY, { wait: GRAY.wait - 40 })
            ],
            [
                merge(GRAY, { wait: GRAY.wait - 40 }),
                merge(BLUE, { y: -270 }),
                EMPTY,
                merge(BLUE, { y: -270 }),
                merge(GRAY, { wait: GRAY.wait - 40 })
            ],
            [
                BLUE,
                merge(DARKBLUE, { y: -180 }),
                BLUE,
                merge(DARKBLUE, { y: -180 }),
                BLUE
            ]
        )(170, StrongBullet, QuintupleBullet)
    ];
})();

const storyBoard = {
    version: 1,
    title: 'Lizard Flight',
    txt: {
        opening: {
            message: 'Lizard Flight',
            bottomMessage: 'Created by jistol',
            fontStyle: '#10ff25',
            bgStyle: 'rgba(0,128,0,0.2)',
            usePressKey: true
        },
        guide: {
            messageList: [
                'KEY GUIDE',
                'shout bullet : press "w" key or touch',
                'move : press "<-", "->" key or slide',
                ''
            ],
            fontStyle: '#dcffe9',
            bgStyle: 'rgba(0,128,0,0.2)',
            usePressKey: true,
            pressMessage: 'press enter key or touch to continue'
        },
        dead: {
            message: 'YOU DIED',
            fontStyle: '#c80000',
            bgStyle: 'rgba(128,0,0,0.2)',
            usePressKey: true
        },
        ending: {
            message: 'THE END',
            fontStyle: '#5d8ff9',
            bgStyle: 'rgba(20,20,20,0.2)',
            usePressKey: true
        }
    },
    story: story
};