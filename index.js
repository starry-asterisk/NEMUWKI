class Loader {
    _container;
    _topMenu__auto;
    _mode = 'main';
    constructor() {
        this._container = document.querySelector('.container');
        this._topMenu__auto = document.querySelector('.topMenu__auto');
    }
    load(mode) {
        let _this = this;
        this._mode = mode;
        this._container.setAttribute('mode', '');
        this._container.setAttribute('style', '');
        this._topMenu__auto.classList.remove('active-gold');
        this._topMenu__auto.onclick = null;
        document.querySelector('.loading').animate({
            height: ['0', '100%', '100%', ''],
            offset: [0, 0.1, 0.9, 1]
        }, { duration: 500 }).finished.then(() => {
            _this._container.setAttribute('mode', mode);
            switch (mode) {
                case 'story':
                    let vn = new VisualNovel();
                    vn.load(script);
                    break;
                case 'game':
                    /*
                    let game = new Game();
                    game.init();
                    game.start();*/
                    break;
                case 'talk':
                    break;
                case 'setting':
                    break;
            }
        });

    }
}


class VisualNovel {
    _object_container;
    _choice_container;
    _dialog;
    _dialog_name;
    _dialog_team;
    _dialog_contents;

    _topMenu__menu;
    _topMenu__auto;
    _auto_timer;
    _auto_interval = 4000;

    _script;
    _scene_oder;
    _flags;

    _objects = [];

    constructor() {
        this._object_container = document.querySelector('.container__object');
        this._choice_container = document.querySelector('.container__choice');
        this._dialog = document.querySelector('.dialog');
        this._dialog_name = document.querySelector('.dialog__title__name');
        this._dialog_team = document.querySelector('.dialog__title__team');
        this._dialog_contents = document.querySelector('.dialog__contents');
        this._topMenu__menu = document.querySelector('.topMenu__menu');
        this._topMenu__auto = document.querySelector('.topMenu__auto');
    }

    load(script = [], flags = [], scene_order = 0) {
        let _this = this;
        this._object_container.innerHTML = '';
        this._choice_container.innerHTML = '';
        this._dialog.style.display = 'none';
        this._dialog_name.innerHTML = '';
        this._dialog_team.innerHTML = '';
        this._dialog_contents.innerHTML = '';
        this._script = script;
        this._scene_oder = scene_order;
        this._flags = flags;

        if(script.length > 0){
            this._topMenu__auto.onclick = () => {
                if (_this._topMenu__auto.classList.toggle('active-gold')) {
                    _this.autoProgress(false);
                } else {
                    _this.autoProgress(true);
                }
            };
            this._topMenu__menu.onclick = () =>{
                _this.load();
                app.load('main');
            }
            this.start();
        }else {
            this._topMenu__auto.onclick = this._topMenu__menu.onclick = null
        }
    }

    autoProgress(isAuto) {
        let _this = this;
        if (isAuto) {if(this._auto_timer) clearTimeout(this._auto_timer);}
        else this._auto_timer = setTimeout(() => {
            if (_this._choice_container.matches(':empty') & _this._dialog.onclick) _this._dialog.onclick();
            _this.autoProgress(false);
        }, this._auto_interval);
    }

    start() {
        const routes = this._script[this._scene_oder];
        if (routes) {
            let route_type = -1;
            routes.forEach((route, idx) => {
                let isTarget = true;
                if (route.condition) {
                    if (route.condition.and) {
                        for (let eq of route.condition.and) {
                            if (this._flags.indexOf(eq) < 0) { isTarget = false; break; }
                        }
                    }
                    if (route.condition.not) {
                        for (let not of route.condition.not) {
                            if (this._flags.indexOf(not) > -1) { isTarget = false; break; }
                        }
                    }
                }
                if (isTarget) route_type = idx;
            });
            if (route_type < 0) route_type = 0;
            let scene = routes[route_type];
            let { stopable_arr } = this.frameHandler(scene[0]);
            let index = 1;

            this._dialog.onclick = () => {
                //동작완료 애니메이션에 경우 stop등을 사용하면 오류가 나서 try catch로 임시조치함
                for (let skipHandler of stopable_arr) { try { skipHandler(); } catch { } }
                if (scene[index] == null) {
                    this._scene_oder++;
                    this._dialog.onclick = null;
                    this.start();
                } else {
                    let r = this.frameHandler(scene[index]);
                    stopable_arr = r.stopable_arr;
                    r.buttons.forEach(button => button.addEventListener('click', this._dialog.onclick))
                    index++;
                }
            };
        } else {
            this.autoProgress(true);
            this.load();
            app.load('main');
        }
    }

    frameHandler(frame) {
        let _this = this;
        let stopable_arr = [];
        let buttons = [];
        for (let s_prop in frame) {
            let options = frame[s_prop];
            switch (s_prop) {
                case 'skipable':
                    break;
                case 'filter':
                    break;
                case 'dialog':
                    if (options.hide) {
                        this._dialog.style.display = 'none';
                    } else {
                        this._dialog.style.display = 'block';
                        if (options.dialog_mode == 나레이션) {
                            this._dialog_name.style.display = 'none';
                            this._dialog_team.style.display = 'none';
                        } else {
                            this._dialog_name.style.removeProperty('display');
                            this._dialog_team.style.removeProperty('display');
                        }
                        let render = function () {
                            _this._dialog_name.innerHTML = options.name;
                            _this._dialog_team.innerHTML = options.team;
                            _this._dialog_contents.innerHTML = '';
                            if (options.contents || options.contents === '') {
                                let contents_arr = options.contents.split('');
                                let interver = setInterval(() => {
                                    if (contents_arr.length < 1) return clearInterval(interver);
                                    _this._dialog_contents.innerHTML += contents_arr.shift();
                                }, 80);
                                stopable_arr.push(() => {
                                    clearInterval(interver);
                                    _this._dialog_contents.innerHTML = options.contents;
                                });
                            }
                        }
                        if (options.window_mode == 'opening') {
                            this._dialog.setAttribute('mode', 'opening');
                        } else {
                            if (this._dialog.getAttribute('mode') === 'opening') {
                                let render_opening = render;
                                render = () => { };
                                _this._dialog.animate(keyframes.fadeOut, { duration: 500 }).finished.then(() => {
                                    _this._dialog.setAttribute('mode', 'normal');
                                    render_opening();
                                });
                            }
                        }
                        render();
                    }
                    break;
                case 'choice':
                    for (let option of options) {
                        let button = document.createElement('button');
                        button.innerHTML = `<span>${option.contents}</span>`;
                        button.style.order = option.order;
                        button.onclick = () => {
                            _this._flags.push(option.flag);
                            buttons.forEach(unchoose => {
                                if (unchoose == button) {
                                    unchoose.animate(
                                        {
                                            transform: [
                                                'skew(-6deg) scale(1)',
                                                'skew(-6deg) scale(1.1)',
                                                'skew(-6deg) scale(1.1)',
                                                'skew(-6deg) scale(1.1)',
                                                'skew(-6deg) scale(1.1)'
                                            ],
                                            opacity: ['1', '1', '0', '1', '0'],
                                            offset: [0, 0.7, 0.8, 0.90]
                                        },
                                        {
                                            duration: 300,
                                            fill: 'forwards'
                                        }
                                    );
                                } else {
                                    unchoose.animate(
                                        {
                                            marginLeft: ['0', '100vw']
                                        },
                                        {
                                            duration: 300,
                                            fill: 'forwards'
                                        }
                                    );
                                }
                                setTimeout(function () {
                                    unchoose.remove();
                                }, 350);
                            })
                        };
                        buttons.push(button);
                        _this._choice_container.appendChild(button);
                    }
                    break;
                case 'background':
                    if (options.filename) app._container.style.backgroundImage = `url("./resource/bg/${options.filename}")`;
                    if (options.cutout_animation) { }
                    if (options.animation) { }
                    break;
                case 'object':
                    for (let option of options) {
                        let object = _this._objects[option.id];
                        if (object == null) {
                            _this._objects[option.id] = object = {
                                id: option.id,
                                name: option.name,
                                type: option.type,
                                _instance: document.createElement('div'),
                                _img: document.createElement('img')
                            };
                            object._img.src = `${URL_PREFIX_}/resource/imageSet/${option.name}/${option.type}.png`;
                            object._instance.style.setProperty('--mask', `url(${URL_PREFIX_}/resource/imageSet/${option.name}/${option.type}.png)`);
                            object._instance.appendChild(object._img);
                            _this._object_container.appendChild(object._instance);
                        } else {
                            option = { ...object, ...option };
                            object._img.src = `${URL_PREFIX_}/resource/imageSet/${option.name}/${option.type}.png`;
                            object._instance.style.setProperty('--mask', `url(${URL_PREFIX_}/resource/imageSet/${option.name}/${option.type}.png)`);
                        }
    
                        if (option.horizontal_invert === true) object._instance.classList.add('horizontal_invert');
                        else if (option.horizontal_invert === false) object._instance.classList.remove('horizontal_invert');
    
                        if (option.vertical_invert === true) object._instance.classList.add('vertical_invert');
                        else if (option.vertical_invert === false) object._instance.classList.remove('vertical_invert');
    
                        if (option.isBehind === true) object._instance.classList.add('behind');
                        else if (option.isBehind === false) object._instance.classList.remove('behind');
    
                        if (option.scale) object._instance.style.zoom = option.scale;
                        if (option.order) object._instance.style.zIndex = option.order;
                        if (option.animation) stopable_arr.push(object._instance.animate(option.animation.keyframes, option.animation.option).finish);
                        if (option.base_x) object._instance.style.left = option.base_x;
                        if (option.base_y) object._instance.style.top = option.base_y;
                        if (option.destroy) object._instance.remove();
                    }
                    break;
                case 'bgm':
                    break;
                case 'se':
                    break;
            }
        }
        return { stopable_arr, buttons };
    }
}

//dialog mode
const 회상 = 2;
const 나레이션 = 1;
const 대사 = 0;

const URL_PREFIX_ = 'https://starry-asterisk.github.io/exam';

let app;



document.addEventListener("DOMContentLoaded", (event) => {
    app = new Loader();
    app.load('main');
    document.querySelectorAll('.mainMenu button').forEach(
        button => button.addEventListener('click', mainMenuHandler)
    );


});

function mainMenuHandler(e) {
    let button = e.target;
    let circle = document.createElement('div');
    circle.classList.add('circle');
    circle.style.top = e.offsetY + 'px';
    circle.style.left = e.offsetX + 'px';
    button.appendChild(circle);
    circle.animate({
        width: ['2px', '70vw', '70vw'],
        height: ['2px', '70vw', '70vw'],
        easing: 'linear'
    }, {
        fill: 'forwards',
        duration: 500
    }).finished.then(() => {
        circle.remove();
        let _mode, _link;
        if (_mode = button.getAttribute('data-mode')) app.load(_mode);
        else if (_link = button.getAttribute('data-link')) window.open(_link, '_blank');
    });

}

const VisualNovelLoader = {

}
