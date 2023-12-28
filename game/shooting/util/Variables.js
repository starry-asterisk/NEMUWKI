let canvas = undefined;
let context = undefined;

const rWidth = 400;
const rHeight = 400 * 1.5;

const imageSet = {};

const ViewerStatus = {
    opening: Symbol('opening'),
    guide: Symbol('guide'),
    playing: Symbol('playing'),
    ending: Symbol('ending'),
    dead: Symbol('dead'),
    pause: Symbol('pause')
};

const BulletStatus = {
    fire: Symbol('fire'),
    collision: Symbol('collision'),
    destroy: Symbol('destroy')
};

const PlayStatus = {
    opening : Symbol('opening'),
    playing : Symbol('playing'),
    ending : Symbol('ending'),
    exit : Symbol('exit')
};