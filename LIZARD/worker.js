importScripts('./LiZARD/util/Animation.js');
importScripts('./LiZARD/util/Util.js');
importScripts('./LiZARD/background/BgCosmos.js');
importScripts('./LiZARD/ItemManager.js');
importScripts('./LiZARD/Lizard.js');
importScripts('./LiZARD/enemy/BasicEnemy.js');
importScripts('./LiZARD/enemy/BasicPlay.js');
importScripts('./LiZARD/enemy/NoWaitPlay.js');
importScripts('./LiZARD/enemy/FollowPlay.js');
importScripts('./LiZARD/enemy/PlayManager.js');
importScripts('./LiZARD/bullet/Bullet.js');
importScripts('./LiZARD/bullet/BasicBullet.js');
importScripts('./LiZARD/bullet/WaveBullet.js');
importScripts('./LiZARD/bullet/QuintupleBullet.js');
importScripts('./LiZARD/bullet/FastBullet.js');
importScripts('./LiZARD/bullet/StrongBullet.js');
importScripts('./LiZARD/Viewer.js');
importScripts('./LiZARD/storyBoard.js');

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

const __events = {
    init : event => {
        let canvas = event.data.canvas;
        contextScale(canvas);
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
            __events.nextEvent(viewer);
        } else {
            (viewer.onKeyInputEvent || function(){})(eventName, key);
        }
    },
    touchEvent : event => {
        let { eventName, x } = event.data;
        if (eventName == 'touchend' && viewer.status != ViewerStatus.playing) {
            __events.nextEvent(viewer);
        } else {
            (viewer.onTouchEvent || function(){})(eventName, x);
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

    __events[event.data.type](event);
};
