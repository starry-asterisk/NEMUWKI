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

const skillSet = [
    {
        name: 'killAll',
        image_url: '',
        cost: 2,
        draw: ()=>{},
        judgeCollision: ()=>true,
    },
    {
        name: 'kamehamepa',
        image_url: '',
        cost: 2,
        draw: ()=>{},
        judgeCollision: (player, enemy)=>{
            player.x;
        },
    },
];

const enemyAbility = {
    EMPTY : {},
    GRAYS : {
        LITEGRAY : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 6.5,
            hp : 100,
            score : 10,
            wait : 180,
            imageNamespace : 'enemy_1'
        },
        GRAY : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 6.5,
            hp : 270,
            score : 20,
            wait : 180,
            imageNamespace : 'enemy_1'
        },
        DARKGRAY : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 7,
            hp : 400,
            score : 40,
            wait : 180,
            imageNamespace : 'enemy_1'
        }
    },
    YELLOWS : {
        LITEYELLOW : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 5,
            hp : 230,
            score : 15,
            wait : 200,
            imageNamespace : 'enemy_1'
        },
        YELLOW : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 5,
            hp : 480,
            score : 40,
            wait : 200,
            imageNamespace : 'enemy_1'
        },
        DARKYELLOW : {
            clazz : BasicEnemy,
            play : BasicPlay,
            s : 5,
            hp : 1050,
            score : 80,
            wait : 200,
            imageNamespace : 'enemy_1'
        }
    },
    REDS : {
        LITERED : {
            clazz : BasicEnemy,
            play : FollowPlay,
            s : 6.5,
            hp : 300,
            score : 25,
            wait : 180,
            imageNamespace : 'enemy_2'
        },
        RED : {
            clazz : BasicEnemy,
            play : FollowPlay,
            s : 6.5,
            hp : 400,
            score : 50,
            wait : 180,
            imageNamespace : 'enemy_2'
        },
        DARKRED : {
            clazz : BasicEnemy,
            play : FollowPlay,
            s : 7.5,
            hp : 800,
            score : 80,
            wait : 180,
            imageNamespace : 'enemy_2'
        }
    },
    BLUES : {
        LITEBLUE : {
            clazz : BasicEnemy,
            play : NoWaitPlay,
            s : 6.5,
            hp : 150,
            score : 20,
            imageNamespace : 'enemy_2'
        },
        BLUE : {
            clazz : BasicEnemy,
            play : NoWaitPlay,
            s : 7.3,
            hp : 350,
            score : 50,
            imageNamespace : 'enemy_2'
        },
        DARKBLUE : {
            clazz : BasicEnemy,
            play : NoWaitPlay,
            s : 7.8,
            hp : 600,
            score : 100,
            imageNamespace : 'enemy_2'
        }
    }
};

const story = (function(){
    let genOpening = level => Object.assign({
        message : 'STAGE ' + level,
        bgStyle : 'rgba(0,128,0,0.2)',
        fontStyle : '#ffdb2a'
    });
    let ending = {
        message : 'MISSION COMPLETE',
        bgStyle : 'rgba(0,128,0,0.2)',
        fontStyle : '#ffdb2a'
    };
    let genStory = level => (...waveList) => (step, ...items) => ({
        level : level,
        itemRule : { step : step, itemList : items},
        waveList : waveList
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
                merge(LITEGRAY, {wait:LITEGRAY.wait + 25}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 50}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 75}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 100})
            ],
            [
                merge(LITEGRAY, {wait:LITEGRAY.wait + 100}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 75}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 50}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 25}),
                LITEGRAY
            ],
            [
                merge(LITEYELLOW, {wait:LITEYELLOW.wait+25}),
                merge(LITEGRAY, {wait:LITEYELLOW.wait-25}),
                LITEYELLOW,
                merge(LITEGRAY, {wait:LITEYELLOW.wait-25}),
                merge(LITEYELLOW, {wait:LITEYELLOW.wait+25})
            ],
            [
                LITEYELLOW,
                merge(LITEYELLOW, {wait:LITEYELLOW.wait+25}),
                EMPTY,
                merge(LITEYELLOW, {wait:LITEYELLOW.wait+25}),
                LITEYELLOW
            ],
            [
                merge(LITEBLUE, {y:-250}),
                merge(LITEGRAY, {wait:LITEGRAY.wait - 20}),
                merge(LITEBLUE, {y:-250}),
                merge(LITEGRAY, {wait:LITEGRAY.wait - 20}),
                merge(LITEBLUE, {y:-250})
            ]
        )(100, FastBullet),
        genStory(2)(
            [
                merge(LITEGRAY, {wait:LITEGRAY.wait + 40}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 20}),
                LITEGRAY,
                merge(LITEGRAY, {wait:LITEGRAY.wait + 20}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 40})
            ],
            [
                merge(LITEBLUE, {y:-360}),
                merge(LITEGRAY, {wait:LITEGRAY.wait - 40}),
                merge(LITEBLUE, {y:-290}),
                merge(LITEGRAY, {wait:LITEGRAY.wait - 40}),
                merge(LITEBLUE, {y:-220})
            ],
            [LITEGRAY, LITEYELLOW, LITERED, LITEYELLOW, LITEGRAY],
            [
                merge(LITEBLUE, {y:-300}),
                LITERED,
                merge(LITEBLUE, {y:-300}),
                LITERED,
                merge(LITEBLUE, {y:-300})
            ],
            [
                LITERED,
                merge(DARKBLUE, {y:-350}),
                LITERED,
                merge(DARKBLUE, {y:-350}),
                LITERED
            ]
        )(150, FastBullet, WaveBullet),
        genStory(3)(
            [
                merge(GRAY, {wait:LITEGRAY.wait + 40}),
                merge(LITEGRAY, {wait:LITEGRAY.wait + 20}),
                GRAY,
                merge(LITEGRAY, {wait:LITEGRAY.wait + 20}),
                merge(GRAY, {wait:LITEGRAY.wait + 40})
            ],
            [
                LITEGRAY,
                merge(GRAY, {wait:GRAY.wait + 20}),
                merge(LITEGRAY, {wait:GRAY.wait + 40}),
                merge(GRAY, {wait:GRAY.wait + 20}),
                LITEGRAY
            ],
            [
                GRAY,
                merge(LITERED, {wait:GRAY.wait + 20}),
                GRAY,
                merge(LITERED, {wait:GRAY.wait + 20}),
                GRAY
            ],
            [
                YELLOW,
                EMPTY,
                merge(LITERED, {wait:YELLOW.wait + 20}),
                EMPTY,
                YELLOW
            ],
            [
                merge(LITERED, {wait:LITERED.wait + 20}),
                merge(LITERED, {wait:LITERED.wait + 10}),
                LITERED,
                merge(LITERED, {wait:LITERED.wait + 10}),
                merge(LITERED, {wait:LITERED.wait + 20})
            ]
        )(200, FastBullet, WaveBullet, StrongBullet),
        genStory(4)(
            [YELLOW, YELLOW, YELLOW, YELLOW, LITERED],
            [LITERED, GRAY, GRAY, GRAY, GRAY],
            [LITERED, RED, EMPTY, RED, LITERED],
            [EMPTY, RED, merge(LITEBLUE, {y:-360}), RED, EMPTY],
            [RED, merge(LITEBLUE, {y:-360}), RED, merge(LITEBLUE, {y:-360}), RED]
        )(200, FastBullet, WaveBullet, StrongBullet, QuintupleBullet),
        genStory(5)(
            [
                merge(LITEBLUE, {y:-480}),
                merge(LITEBLUE, {y:-360}),
                merge(LITEBLUE, {y:-240}),
                merge(LITEBLUE, {y:-120}),
                LITEBLUE
            ],
            [
                LITEBLUE,
                merge(LITEBLUE, {y:-120}),
                merge(LITEBLUE, {y:-240}),
                merge(LITEBLUE, {y:-360}),
                merge(LITEBLUE, {y:-480})
            ],
            [
                merge(GRAY, {wait:GRAY.wait - 40}),
                merge(BLUE, {y:-270}),
                merge(GRAY, {wait:GRAY.wait - 40}),
                merge(BLUE, {y:-270}),
                merge(GRAY, {wait:GRAY.wait - 40})
            ],
            [
                merge(GRAY, {wait:GRAY.wait - 40}),
                merge(BLUE, {y:-270}),
                EMPTY,
                merge(BLUE, {y:-270}),
                merge(GRAY, {wait:GRAY.wait - 40})
            ],
            [
                BLUE,
                merge(DARKBLUE, {y:-180}),
                BLUE,
                merge(DARKBLUE, {y:-180}),
                BLUE
            ]
        )(170, StrongBullet, QuintupleBullet)
    ];
})();

const storyBoard = {
    version : 1,
    title : 'Lizard Flight',
    txt : {
        opening : {
            message : 'Lizard Flight',
            bottomMessage : 'Created by jistol',
            fontStyle : '#10ff25',
            bgStyle : 'rgba(0,128,0,0.2)',
            usePressKey : true
        },
        guide : {
            messageList : [
                'KEY GUIDE',
                'shout bullet : press "w" key or touch',
                'move : press "<-", "->" key or slide',
                ''
            ],
            fontStyle : '#dcffe9',
            bgStyle : 'rgba(0,128,0,0.2)',
            usePressKey : true,
            pressMessage : 'press enter key or touch to continue'
        },
        dead : {
            message : 'YOU DIED',
            fontStyle : '#c80000',
            bgStyle : 'rgba(128,0,0,0.2)',
            usePressKey : true
        },
        ending : {
            message : 'THE END',
            fontStyle : '#5d8ff9',
            bgStyle : 'rgba(20,20,20,0.2)',
            usePressKey : true
        }
    },
    story : story
};