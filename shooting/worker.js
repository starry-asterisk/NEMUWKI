importScripts('./util/Animation.js');
importScripts('./util/Util.js');
importScripts('./background/BgCosmos.js');
importScripts('./ItemManager.js');
importScripts('./Lizard.js');
importScripts('./enemy/BasicEnemy.js');
importScripts('./enemy/BasicPlay.js');
importScripts('./enemy/NoWaitPlay.js');
importScripts('./enemy/FollowPlay.js');
importScripts('./enemy/PlayManager.js');
importScripts('./bullet/Bullet.js');
importScripts('./bullet/BasicBullet.js');
importScripts('./bullet/WaveBullet.js');
importScripts('./bullet/QuintupleBullet.js');
importScripts('./bullet/FastBullet.js');
importScripts('./bullet/StrongBullet.js');
importScripts('./Viewer.js');
importScripts('./storyBoard.js');

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
    init : async event => {
        let canvas = event.data.canvas;
        contextScale(canvas);

        const response = await fetch('./imageSet/67x63_airplane.png');
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        viewer.initialize(canvas, imageBitmap);
        requestAnimationFrame(render);
    },
    keyDirect : event => {
        let { eventName, key } = event.data;
        (viewer.onKeyDirectEvent||function(){})(eventName, key);
    },
    keyInput : event => {
        let { eventName, key } = event.data;
        if (key == 'enter' && viewer.status != ViewerStatus.playing) {
            if(eventName == 'keyup') __events.nextEvent(viewer);
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
