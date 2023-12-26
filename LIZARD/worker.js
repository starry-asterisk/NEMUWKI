importScripts('./LIZARD/util/Animation.js');
importScripts('./LIZARD/util/Util.js');
importScripts('./LIZARD/background/BgCosmos.js');
importScripts('./LIZARD/ItemManager.js');
importScripts('./LIZARD/Lizard.js');
importScripts('./LIZARD/enemy/BasicEnemy.js');
importScripts('./LIZARD/enemy/BasicPlay.js');
importScripts('./LIZARD/enemy/NoWaitPlay.js');
importScripts('./LIZARD/enemy/FollowPlay.js');
importScripts('./LIZARD/enemy/PlayManager.js');
importScripts('./LIZARD/bullet/Bullet.js');
importScripts('./LIZARD/bullet/BasicBullet.js');
importScripts('./LIZARD/bullet/WaveBullet.js');
importScripts('./LIZARD/bullet/QuintupleBullet.js');
importScripts('./LIZARD/bullet/FastBullet.js');
importScripts('./LIZARD/bullet/StrongBullet.js');
importScripts('./LIZARD/Viewer.js');
importScripts('./LIZARD/storyBoard.js');

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
