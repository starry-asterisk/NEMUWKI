/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-21
* Description: personal canvas project for NEMU
*/

import { BaseElement } from './Base.js?_=2';
import { modalInit, modalExport } from './Dialog.js?_=2';
import { toolsWindow, brushSettingWindow, brushesWindow, erasersWindow, layersWindow, canvasWindow } from './Windows.js?_=2';

window.nemu = {
    modalInit,
    modalExport,
    _pointer: {},
    _initialAngle: null,
    _initialDistance: null,
    setPointer(e, el) {
        el.setPointerCapture(e.pointerId);
        this.trackPointer(e);
    },
    trackPointer(e) {
        this._pointer[e.pointerId] = e;
    },
    releasePointer(e, el) {
        this._initialAngle = null;
        this._initialDistance = null;
        delete this._pointer[e.pointerId];
        if (el) el.releasePointerCapture(e.pointerId);
    },
    gesture(isPointerDown) {
        // 활성화된 포인터가 두 개가 아니라면 핀치 제스처를 수행하지 않음
        const pointers = Object.values(this._pointer);
        if (pointers.length < 2) {
            return;
        }

        const layerWrap = nemu.layerWrap;

        const [pointer1, pointer2] = pointers;

        // 두 포인터 사이의 거리 계산
        const distance = Math.pow(pointer2.clientX - pointer1.clientX, 2) + Math.pow(pointer2.clientY - pointer1.clientY, 2);

        // 두 포인터 사이의 각도 계산 (atan2 사용)
        const angle = Math.atan2(
            pointer2.clientY - pointer1.clientY,
            pointer2.clientX - pointer1.clientX
        );  // 라디안을 각도로 변환

        if (isPointerDown) {
            // 첫 번째 포인터 다운일 때 초기 거리와 각도를 저장
            if (this._initialDistance === null) {
                this._initialDistance = distance;
                this._originalScale = layerWrap.scale;
            }
            if (this._initialAngle === null) {
                this._initialAngle = angle;
                this._originalRotation = layerWrap._rotation;
            }
        } else {
            // 확대 비율 계산 (현재 거리 / 초기 거리)
            let scale = distance / this._initialDistance;

            // 회전 각도 계산 (현재 각도 - 초기 각도)
            let rotation = Math.round((angle - this._initialAngle) * 180 / Math.PI);

            layerWrap._rotation = this._originalRotation - rotation;
            layerWrap.rotation = layerWrap._rotation / 180 * Math.PI;
            layerWrap.scale = parseFloat((this._originalScale * Math.sqrt(scale)).toFixed(2));
            layerWrap.applyTrans();
            nemu.displayScale(layerWrap.scale);
            nemu.displayRotate(layerWrap._rotation);
        }
    },
    _windows: {},
    toggleWindow(name, bool) {
        let rect1 = this.layerWrap.getBoundingClientRect();
        let win = this._windows[name];
        if (win == undefined || win.el == undefined) return Utils.error(`Error :: 해당 윈도우를 열수 없습니다. (${name})`)
        if (bool === undefined) bool = !win.input?.checked;
        win.el.toggleClass('hide', bool);
        win.input.checked = !bool;
        this.fixCanvasScroll(rect1, this.layerWrap.getBoundingClientRect());
    },
    isOpened(name) {
        let win = this._windows[name];
        return !win.el.classList.contains('hide');
    },
    fixCanvasScroll(rect1, rect2) {
        let diffX = rect2.x - rect1.x;
        let diffY = rect2.y - rect1.y;
        let container = this.layerWrap.parentNode;
        container.scrollLeft += diffX;
        container.scrollTop += diffY;
    },
    resetScroll() {
        if (!this.layerWrap) return;
        let rect = this.layerWrap.parentNode.getBoundingClientRect();
        this.layerWrap.scale = parseFloat(Math.min(rect.width / this.layerWrap.width, rect.height / this.layerWrap.height).toFixed(2));
        this.layerWrap.rotation = 0;
        this.layerWrap._rotation = 0;
        this.layerWrap.applyTrans();
        this.displayScale(this.layerWrap.scale);
        this.displayRotate(0);

        let node = this.layerWrap.parentNode;
        node.scrollTop = (node.scrollHeight - node.offsetHeight) / 2;
        node.scrollLeft = (node.scrollWidth - node.offsetWidth) / 2;
    }
};

const $TAG_PREFIX = 'nemu';

const Direction = {
    left: Symbol('left'),
    right: Symbol('right'),
}

const snapZone = [
    {
        left: 42,
        width: 42,
        minWidth: 42,
        maxWidth: 162,
        default: [toolsWindow],
        max: 1
    },
    {
        left: 242,
        width: 250,
        minWidth: 100,
        maxWidth: 400,
        default: [brushSettingWindow, brushesWindow, erasersWindow],
        max: 7
    },
    {
        disabled: true,
        default: [canvasWindow]
    },
    {
        right: 242,
        width: 242,
        minWidth: 200,
        maxWidth: 400,
        default: [layersWindow],
        max: 7,
        direction: Direction.right
    }
];

let windowZindex = 2;

class RootContainerElement extends BaseElement {
    constructor() {
        super();
    }

    render() {
        let frag = Utils.createFragment();
        for (let zone of snapZone) {
            zone.instance = createZone(zone).appendTo(frag);
        }
        for (let layer of nemu.layerWrap.layers) nemu.registLayer(layer);
        nemu.toggleWindow('layers', true);
        nemu.toggleWindow('brusheSetting', true);
        nemu.toggleWindow('brushes', true);
        nemu.toggleWindow('erasers', true);
        nemu.pens[0].onclick();
        nemu.startup_rtc();
        return frag;
    }

    connectedCallback() {
        let node = nemu.layerWrap.parentNode;
        node.scrollTop = (node.scrollHeight - node.offsetHeight) / 2;
        node.scrollLeft = (node.scrollWidth - node.offsetWidth) / 2;
    }

    stylesheet() {
        return `
        :host {
            position: fixed;
            top: 35px;
            left: 0;
            right: 0;
            bottom: 25px;
            overflow: visible;
            display: flex;
            flex-direction: row;
            /*gap: var(--gap-small);*/
        }
        .flexZone {
            display: flex;
            flex-direction: column;
            /*gap: var(--gap-small);*/
            --width: auto;
            position: relative;
            width: var(--width);
        }
        :host > ${$TAG_PREFIX}-window {
            max-height: 50vh;
        }
        .flexZone > ${$TAG_PREFIX}-window {
            position: relative;
            left: unset !important;
            top: unset !important;
            width: auto !important;
            z-index: 0 !important;
        }
        .flexZone:not(:has(${$TAG_PREFIX}-window:not(.hide))):not(${$TAG_PREFIX}-window.moving ~ *) {
            width: 0 !important;
        }
        ${$TAG_PREFIX}-window.moving ~ * {
            overflow: hidden;
        }
        ${$TAG_PREFIX}-window.hide {
            display: none !important;
        }    
        .flexZone.main {
            overflow: auto;
            cursor: grab;
            align-items: stretch;
        }
        .flexZone.main:active {
            cursor: grabbing;
        }     
        ${$TAG_PREFIX}-window.moving ~ .flexZone:not(.main)::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: 5px;
            border-radius: var(--br-small);
            background: skyblue;
            z-index: 1;
            opacity: 0.3;
        } 
        .resizer {
            position: absolute;
            top:0;
            right: -4px;
            bottom:0;
            border: none;
            padding: 0;
            width: 8px;
            cursor: pointer;
            opacity: 0.5;
            background-color: transparent;
            z-index: 99;
        }
        .resizer.right {
            right: unset;
            left: -4px;
        }
        .resizer:hover {
            background-color: #6495ed;
        }
        .resizer:last-child {
            display: none;
        }
        ${$TAG_PREFIX}-layer-wrap {
            cursor: crosshair;
        }
        ${$TAG_PREFIX}-layer-wrap[data-mode="drag"]{
            pointer-events: none;
        }
        `;
    }
}

customElements.define(`${$TAG_PREFIX}-root`, RootContainerElement);

class TopMenuElement extends BaseElement {
    constructor() {
        super();
    }

    render() {
        let frag = Utils.createFragment();
        let fileUl = createUl('파일');
        createLi(fileUl, '새로운 캔버스', 'button', function () {
            window.open(location.origin + location.pathname,'_blank');
            return true;
        });
        createLi(fileUl, '이미지 불러오기', 'button', function () {
            (async () => {
                try {
                    const [fileHandle] = await window.showOpenFilePicker();
                    const file = await fileHandle.getFile();
                    let img = new Image();
                    img.onload = () => {
                        let layer = nemu.layerElement;
                        nemu.layerWrap.resizeCanvas(img.width, img.height);
                        layer.ctx.drawImage(img, 0, 0, img.width, img.height);
                        layer.off_ctx.drawImage(img, 0, 0, img.width, img.height);
                        layer.layerData.resize(layer.off_ctx.getImageData(0, 0, img.width, img.height).data, img.width, img.height);
                        nemu.resetScroll();
                        nemu.displaySize(layer.width, layer.height);
                    }
                    img.src = URL.createObjectURL(file);
                } catch(e) {

                }
            })();
            return true;
        });
        // createLi(fileUl, '캔버스 불러오기', 'button', function () {
        //     return true;
        // });
        // createLi(fileUl, '캔버스 저장', 'button', function () {
        //     return true;
        // });
        createLi(fileUl, '이미지로 저장하기', 'button', function () {
            nemu.modalExport();
            return true;
        });
        // createLi(fileUl, '설정', 'button', function () {
        //     return true;
        // });
        let layerUl = createUl('레이어');
        createLi(layerUl, '캔버스 사이즈 변경', 'button', function () {
            nemu.modalInit();
            return true;
        });
        createLi(layerUl, '캔버스 원위치', 'button', function () {
            nemu.resetScroll();
            return true;
        });
        // createLi(layerUl, '색상 보정', 'button', function () {
        //     return true;
        // });
        // createLi(layerUl, '레이어 클리어', 'button', function () {
        //     return true;
        // });
        // createLi(layerUl, '가우시안 블러', 'button', function () {
        //     return true;
        // });
        // createLi(layerUl, '레이어를 아래로 통합', 'button', function () {
        //     return true;
        // });
        // createLi(layerUl, '레이어 추가', 'button', function () {
        //     return true;
        // });
        // createLi(layerUl, '레이어 삭제', 'button', function () {
        //     return true;
        // });
        let windowUl = createUl('윈도우');
        let winSettings = [
            { title: '도구', name: 'tools' },
            { title: '드로잉 설정', name: 'brusheSetting' },
            { title: '브러쉬', name: 'brushes' },
            { title: '지우개', name: 'erasers' },
            { title: '레이어', name: 'layers' }
        ];
        for (let setting of winSettings) {
            if (!nemu._windows[setting.name]) nemu._windows[setting.name] = {};
            nemu._windows[setting.name].input = createLi(windowUl, setting.title, 'checkbox', function () {
                nemu.toggleWindow(setting.name, !this.checked)
                return true;
            }, true);
        }
        let section = Utils.createElement('section').appendTo(frag);
        let timer;
        nemu.displayDynamicIsland = (item, time) => {
            if (time) {
                section.append(item);
                section.addClass('toast');
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => section.removeClass('toast'), time);
            } else {
                if (section.childNodes[0]?.nodeType == 3) section.childNodes[0].remove();
                else section.childNodes[0]?.addClass('toast');
                section.prepend(item);
            }
        }
        let aside = Utils.createElement('aside').appendTo(frag);
        let aside_btn = Utils.createIconBtn('\u{F0415}').appendTo(aside);
        let aside_ul = Utils.createElement('ul').appendTo(aside_btn).css({ right: '0' });
        let aside_input = Utils.createElement('input').addClass('aside-input').attrs({ type: 'text', maxlength: 20, placeholder: '사용자명' }).appendTo(aside_ul);

        Utils.createElement('button').addClass('aside-button').props({
            innerHTML: '적용', onclick() {
                var new_name = aside_input.value || '이름은 비울 수 없습니다.';
                nemu.setUserName(new_name);
                aside_input.value = new_name;
                this.blur();
                document.activeElement.blur();
            }
        }).appendTo(aside_ul);

        function name2color(name) {
            let r = (name.charCodeAt(0) % 255) || 125;
            let g = (name.charCodeAt(1) % 255) || 125;
            let b = (name.charCodeAt(2) % 255) || 125;
            let ret = '#';
            ret += r.toString(16).padStart(2, '0');
            ret += g.toString(16).padStart(2, '0');
            ret += b.toString(16).padStart(2, '0');
            return { back: ret, fore: (r + g + b) / 775 < 0.6 ? '#FAFAFA' : 'var(--clr-background)' };
        }

        nemu.registForeignUser = conn => {
            let new_name = conn.username || conn.peer;
            let color = name2color(new_name);
            Utils.createElement('li')
                .attrs({ 'data-peer': conn.peer })
                .props({ innerHTML: new_name, title: new_name })
                .appendTo(aside_ul);
            Utils.createElement('span')
                .attrs({ 'data-peer': conn.peer, title: new_name })
                .props({ innerHTML: new_name.charAt(0) })
                .css({ 'background-color': color.back, 'color': color.fore }).appendTo(aside);
        };
        nemu.removeForeignUser = conn => {
            aside_ul.querySelector(`li[data-peer="${conn.peer}"]`).remove();
            aside.querySelector(`span[data-peer="${conn.peer}"]`).remove();
        };
        nemu.setForeignUserName = conn => {
            let new_name = conn.username || conn.peer;
            let color = name2color(new_name);
            aside_ul.querySelector(`li[data-peer="${conn.peer}"]`)
                .attrs({ title: new_name })
                .props({ innerHTML: new_name });
            aside.querySelector(`span[data-peer="${conn.peer}"]`)
                .attrs({ title: new_name })
                .props({ innerHTML: new_name.charAt(0) })
                .css({ 'background-color': color.back, 'color': color.fore });
        };

        return frag;
        function createUl(title, disabled = false) {
            let btn = Utils.createElement('button').props({ innerHTML: `${title}`, disabled }).appendTo(frag);
            return Utils.createElement('ul').appendTo(btn);
        }
        function createLi(ul, title = '', type = 'button', callback = () => { }, defaultValue) {
            let li = Utils.createElement('li').props({
                innerHTML: title,
                onclick(e) {
                    if (type == 'checkbox') input.checked = !input.checked;
                    if (callback.bind(input)(e)) {
                        ul.parentNode.blur();
                        document.activeElement.blur();
                    }
                }
            }).appendTo(ul);
            let input = Utils.createElement('input').attrs({ type }).css({ 'pointer-events': 'none' }).appendTo(li);
            if (defaultValue !== undefined) {
                if (type == 'checkbox') input.checked = defaultValue;
                else input.value = defaultValue;
            }
            return input;
        }
    }

    stylesheet() {
        return `
        :host {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 35px;
            box-sizing: border-box;
            overflow: visible;
            background-color: var(--clr-background);
            border-bottom: 1px solid var(--clr-border);
            display: flex;
        }
        button {
            position: relative;
            color: #FAFAFA;
            line-height: 34px;
            padding: 0;
            width: 50px;
            border: 0;
            background: none;
        }
        button:hover, button:focus, button:focus-within {
            background: skyblue;
        }
        ul {
            position: absolute;
            top: 100%;
            margin: 0;
            list-style: none;
            border: 1px solid var(--clr-border);
            background-color: var(--clr-background);
            box-shadow: 5px 5px 5px 0 var(--clr-background-dark);
            z-index: 999;
            padding: 0;
            min-width: fit-content;
            display: none;
        }
        button:focus > ul, button:hover > ul, button:focus-within > ul {
            display: block;
        }
        li {
            display: flex;
            word-break: keep-all;
            white-space: pre;
            width: 150px;
            min-width: fit-content;
            gap: 10px;
            padding: 2px 10px;
            cursor: pointer;
        }
        li:hover {
            background: skyblue;
        }
        li > input {
            margin: 0 0 0 auto;
        }
        li > input[type="button"] {
            opacity: 0;
        }
        section {
            color: #FAFAFA;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            line-height: 24px;
            counter-reset: alarm;
            position: relative;
            margin: 5px 0px 5px auto;
            border-radius: 12px;
            min-width: 200px;
            height: 24px;
            background: var(--clr-background-dark);
            transition: 400ms 400ms min-width, 300ms height, 300ms box-shadow;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        section:hover {
            min-width: 450px;
            height: 240px;
            transition: 400ms min-width, 400ms 300ms height;
            box-shadow: 0 0 5px 0 #fff7, 0 0 10px 0 #000;
        }
        section > *, section:after {
            --n: 0;
            position: absolute;
            top: calc(var(--n) * 24px);
            padding-inline: 24px;
            width: 100%;
            box-sizing: border-box;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            user-select: none;
        }
        section > *[aria-role] {
            cursor: pointer;
        }
        section > *:nth-last-child(1):not(:first-child) { --n: 1; }
        section > *:nth-last-child(2):not(:first-child) { --n: 2; }
        section > *:nth-last-child(3):not(:first-child) { --n: 3; }
        section > *:nth-last-child(4):not(:first-child) { --n: 4; }
        section > *:nth-last-child(5):not(:first-child) { --n: 5; }
        section > *:nth-last-child(6):not(:first-child) { --n: 6; }
        section > *:nth-last-child(7):not(:first-child) { --n: 7; }
        section > *:nth-last-child(8):not(:first-child) { --n: 8; }
        section > *:nth-last-child(n + 9):not(:first-child) {
            counter-increment: alarm;
            opacity: 0;
            pointer-events: none;
        }
        section * {
            color: #FAFAFA;
            text-decoration: none;
            transition: 130ms margin-top;
        }
        section:has(:nth-child(10)):after{
            content: '외'counter(alarm)'건';
            top: calc(9 * 24px);
            opacity: 0.5;
        }
        section:not(:has(:nth-child(2))):after{
            content: '알림이 없습니다.';
            top: 36px;
            bottom: 0;
            margin: auto;
            height: 24px;
            opacity: 0.5;
        }
        section > *[data-level]:before {
            content: '';
            position: absolute;
            top: 0;
            left: 7px;
            bottom: 0;
            width: 10px;
            height: 10px;
            margin: auto;
            background-color: skyblue;
            border-radius: 50%;
        }
        section > *[data-level="success"]:before {
            background-color: limegreen;
        }
        section > *[data-level="warn"]:before {
            background-color: darkorange;
        }
        section > *[data-level="error"]:before {
            background-color: darkred;
        }
        section.toast > * {
            transition: none;
        }
        section.toast > * {
            margin-top: -24px;
        }
        aside {
            display: flex;
            margin: 5px auto 5px 5px;
            gap: 5px;
        }
        aside > *, aside > button.icon {
            display: block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            border-radius: 50%;
        }
        aside > button.icon {
            order: 1;
        }
        aside > span {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            background-color: grey;
            color: #FAFAFA;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
        }
        aside > span:hover {
            outline: 2px solid skyblue;
        }
        aside > *:nth-child(n + 5) {
            display: none;
        }
        aside ul {
            min-width: 202px;
        }
        li[data-peer] {
            position: relative;
            max-width: 200px;
            min-width: 200px;
            text-overflow: ellipsis;
            text-align: left;
            overflow: hidden;
            white-space: nowrap;
            display: block;
            padding: 10px 10px 15px;
            font-size: 14px;
        }
        li[data-peer]::after {
            content: attr(data-peer);
            position: absolute;
            left: 10px;
            top: 25px;
            font-size: 0.7em;
            opacity: 0.5;
        }
        .aside-input {
            display: block;
            margin: 10px auto;
            width: 140px;
            border: 1px solid transparent;
            border-bottom-color: var(--clr-border);
            background: transparent;
            outline: none;
            text-align: center;
            line-height: 36px;
            color: #FAFAFA;
        }
        .aside-input:focus {
            border-bottom-color: skyblue;
        }
        .aside-button {
            display: block;
            margin: 10px auto;
            padding: 2px;
            width: 140px;
            background: none;
            border: 1px solid var(--clr-border);
            color: #FAFAFA;
        }
        .aside-button:hover {
            border-color: skyblue;
        }
        .aside-button:active {
            opacity: 0.5;
        }
        `;
    }
}

customElements.define(`${$TAG_PREFIX}-top-menu`, TopMenuElement);

class BottomMenuElement extends BaseElement {
    constructor() {
        super();
    }

    render() {
        let frag = Utils.createFragment();
        let txt_size = Utils.createElement('span').appendTo(frag);
        let txt_coords = Utils.createElement('span').appendTo(frag);
        let txt_scale = Utils.createElement('span').appendTo(frag);
        let txt_rotate = Utils.createElement('span').appendTo(frag);
        nemu.displaySize = (w, h) => {
            txt_size.innerHTML = `${w}px x ${h}px`;
        }
        nemu.displayCoords = (coords) => {
            txt_coords.innerHTML = `(${Math.ceil(coords[0])}, ${Math.ceil(coords[1])})`;
        }
        nemu.displayScale = (scale) => {
            txt_scale.innerHTML = `${Math.floor(scale * 100)}%`;
        }
        nemu.displayRotate = (degree) => {
            txt_rotate.innerHTML = `${Math.floor(degree)}deg`;
        }
        nemu.layerWrap.initSetting();
        return frag;
    }

    stylesheet() {
        return `
        :host {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 25px;
            box-sizing: border-box;
            overflow: visible;
            background-color: var(--clr-background);
            border-top: 1px solid var(--clr-border);
            display: flex;
        }
        :host > * {
            padding-inline: 10px;
            color: white;
            font-size: 12px;
            align-content: center;
        }
        `;
    }
}

customElements.define(`${$TAG_PREFIX}-bottom-menu`, BottomMenuElement);



var connections = [], my_peer, host_peer, peer;
nemu.connections = connections;
nemu.username = null;
nemu.startup_rtc = () => {
    peer = new Peer();
    peer.on('open', function (id) {
        my_peer = id;
        nemu.username = localStorage.getItem('username') || id;
        var params = new URLSearchParams(location.search);
        var host_peer = params.get('host_peer') || my_peer;
        var invite_code = Utils.createElement('a')
            .attrs({ href: `${location.origin + location.pathname}?host_peer=${my_peer}`, 'data-level': 'info' })
            .props({
                onclick(e) {
                    e.preventDefault();
                    Utils.copyToClipboard(`${location.origin + location.pathname}?host_peer=${my_peer}`);
                }, innerHTML: '초대 코드 복사 <icon>\u{F0337}</icon>'
            })
        nemu.displayDynamicIsland(invite_code);

        if (host_peer !== id) {
            var conn = peer.connect(host_peer);
            handleConnection(conn, true);
        } else {
            setEndDrawHandler();
            modalInit();
        }
        if (id === host_peer) history.replaceState('', {}, `${location.origin + location.pathname}`);
    });

    peer.on('connection', handleConnection);
    peer.on('error', errorHandle);
    peer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        peer.reconnect();  // 자동으로 재연결 시도
    });
}

function errorHandle(err) {
    switch (err.type) {
        case 'browser-incompatible':
            Utils.error('호환되지 않는 브라우저입니다');
            break;
        case 'disconnected':
            Utils.error('연결 종료됨');
            break;
        case 'invalid-id':
            Utils.error('유효하지 않은 연결');
            break;
        case 'invalid-key':
            Utils.error('유효하지 않은 연결');
            break;
        case 'network':
            Utils.error('네트워크 오류', 3600000);
            break;
        case 'peer-unavailable':
            host_peer = my_peer;
            Utils.error('이미 방을 나간 사용자의 링크입니다.');
            break;
        case 'ssl-unavailable':
            Utils.error('인증서 오류', 3600000);
            break;
        case 'server-error':
            Utils.error('서버 오류', 3600000);
            break;
        case 'socket-error':
            Utils.error('소켓서버 오류', 3600000);
            break;
        case 'socket-closed':
            Utils.error('소켓서버 종료됨', 3600000);
            break;
        case 'unavailable-id':
            Utils.error(err);
            break;
        default:
            Utils.error(err);
            break;
    }
}

function handleConnection(conn, isInit) {
    let layer;
    connections.push(conn);
    conn.on('data', function (data) {
        if (typeof rtcFn[data?.type] == 'function') rtcFn[data.type](conn, data, layer);
    });
    conn.peerConnection.oniceconnectionstatechange = () => {
        const state = conn.peerConnection.iceConnectionState;
        if (state === 'disconnected' || state === 'failed') {
            conn.close(); // 연결 종료
        }
    };
    conn.on('close', () => handleDisConnection(conn, layer));
    conn.on('open', () => {
        layer = nemu.registForeignLayer(conn.peer);
        Utils.info(`${conn.peer} 님이 연결되었습니다.`);
        const { layers, width, height } = layerWrap;
        conn.send({ type: 'canvasRefresh', dataUrl: toDataUrl(layers, 0, 0, width, height), minX: 0, minY: 0, w: width, h: height });
        if (nemu.username != my_peer) conn.send({ type: 'setUserName', username: nemu.username });
        nemu.registForeignUser(conn);
        isInit && conn.send({ type: 'initRequest' });
    });
}

function handleDisConnection(conn, layer) {
    nemu.removeLayer(layer);
    connections = connections.filter(old_conn => old_conn.peer != conn.peer);
    Utils.warn(`${conn.peer} 님과의 연결이 종료되었습니다.`);
    nemu.removeForeignUser(conn);
}

var rtcFn = {
    initRequest(conn) {
        conn.send({ type: 'initResponse', list: connections.map(conn => conn.peer), width: nemu.layerWrap.width, height: nemu.layerWrap.height })
    },
    initResponse(conn, data) {
        Utils.info('공용 캔버스에 입장하셨습니다.');
        let list = data.list.filter(peer_id => (peer_id != host_peer && peer_id != my_peer));
        for (let peer_id of list) {
            var conn = peer.connect(peer_id);
            handleConnection(conn);
        }
        nemu.layerWrap.resizeCanvas(data.width, data.height);
        nemu.displaySize(data.width, data.height);
        nemu.resetScroll();
        setEndDrawHandler();
    },
    canvasRefresh(conn, data, layer) {
        const img = new Image();
        img.onload = function () {
            // 이미지가 로드된 후 캔버스에 그리기
            nemu.drawForeign(layer, img, data);
        };

        // 데이터 URL을 이미지 소스로 설정
        img.src = data.dataUrl;
    },
    setUserName(conn, data, layer) {
        Utils.info(`이름 변경 ${conn.username || conn.peer} => ${data.username}`);
        conn.username = data.username;
        layer.setName(`${data.username}님의 레이어`);
        nemu.setForeignUserName(conn);
    }
}

function setEndDrawHandler() {
    layerWrap.addEventListener('enddraw', () => {
        const { layerData } = layerElement;
        const { minX, minY, maxX, maxY } = layerData;
        let w = maxX - minX + 1;
        let h = maxY - minY + 1;
        let data = { type: 'canvasRefresh', dataUrl: toDataUrl(layerWrap.layers, minX, minY, w, h), minX, minY, w, h };

        for (let conn of connections) conn.send(data);
    });
}

nemu.setUserName = text => {
    nemu.username = text;
    let data = { type: 'setUserName', username: text };
    for (let conn of connections) conn.send(data);
}

function toDataUrl(srcLayers, minX, minY, w, h) {
    let msgCanvas = Utils.createElement('canvas');
    let msgCtx = msgCanvas.getContext('2d', { willReadFrequently: true });
    msgCanvas.width = w;
    msgCanvas.height = h;
    for (let layer of srcLayers) {
        if (layer.foreign) continue;
        if (!layer.visibility) continue;
        msgCtx.globalCompositeOperation = layer.blendMode;
        msgCtx.globalAlpha = layer.opacity;
        msgCtx.drawImage(layer.canvas, minX, minY, w, h, 0, 0, w, h);
    }
    return msgCanvas.toDataURL('image/jpg');
}

class WindowElement extends BaseElement {

    constructor() {
        super();

    }

    render(win) {
        let frag = Utils.createFragment();
        let btn_drag = Utils.createIconBtn('\u{F01DC}').addClass('drag').appendTo(frag);

        btn_drag.onpointerdown = (s_e) => {
            btn_drag.focus();
            let canvas_rect = nemu.layerWrap.getBoundingClientRect();
            let s_rect = win.getBoundingClientRect();
            let s_w_ratio = (s_e.clientX - s_rect.left) / s_rect.width;
            let n_rect = { top: s_rect.top, left: s_rect.left };
            let n_e = s_e;

            // 기본 터치 및 팬 동작 방지 (예: 스크롤)
            s_e.preventDefault();
            s_e.stopPropagation();

            win.css({ 'z-index': ++windowZindex }).addClass('moving');
            nemu.fixCanvasScroll(canvas_rect, nemu.layerWrap.getBoundingClientRect());

            window.onpointermove = (s_m) => {
                // 기본 동작 방지
                s_m.preventDefault();
                s_m.stopPropagation();
                n_e = s_m;
                if (win.parentNode != root.shadowRoot) requestAnimationFrame(() => {
                    root.shadowRoot.prepend(win);
                    nemu.fixCanvasScroll(canvas_rect, nemu.layerWrap.getBoundingClientRect());
                });
                n_rect.top = parseInt(s_rect.top - s_e.clientY + s_m.clientY);
                n_rect.left = parseInt(s_m.clientX - s_w_ratio * (win.clientWidth));
                win.css({
                    top: `${n_rect.top - 35}px`,
                    left: `${n_rect.left}px`,
                });
            };

            // pointerup 및 pointercancel로 드래그 종료 처리
            clearDragEvent(e => {
                for (let zone of snapZone) if (!zone.disabled && compareDistance(n_e, zone.instance.getBoundingClientRect())) {
                    if (zone.max <= zone.instance.children.length - 1) continue;
                    zone.instance.append(win);
                }
                win.removeClass('moving');
                nemu.fixCanvasScroll(canvas_rect, nemu.layerWrap.getBoundingClientRect());
            });
        };

        return frag;
    }

    stylesheet() {
        return `
        :host {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 0;
            left: 0;
            min-width: 40px;
            min-height: 40px;
            overflow: auto;
            background-color: var(--clr-background);
            border: 1px solid var(--clr-border);
            border-radius: var(--br-small);
            box-sizing: border-box;
            touch-action: none; /* 터치 스크롤 방지 */
            font-size: 13px;
        }

        ::-webkit-scrollbar-track {
            border-left: 1px solid var(--clr-border);
        }

        button.drag {
            position: sticky;
            top: 0;
            width: 100%;
            height: 25px;
        }

        .layer-list {
            display: flex;
            flex-direction: column-reverse;
            list-style: none;
            padding: 0;
            overflow-y: auto;
            border-block: 1px solid var(--clr-border);
        }
        .layer-item {
            border-top: 1px solid var(--clr-border);
            color: #fff;
            display: flex;
        }
        .layer-item > * {
            align-self: center;
            padding: 5px;
        }
        .layer-item > button.icon {
            width: 35px;
            min-width: 35px;
            height: 35px;
            border-right: 1px solid var(--clr-border);
            font-size: 20px;
        }
        .layer-item:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .layer-item:first-child {
            border-bottom: 1px solid var(--clr-border);
        }
        .layer-item.focus {
            background-color: skyblue;
        }

        .brush-list {
            list-style: none;
            padding: 0;
            border-block: 1px solid var(--clr-border);
        }
        .brush-item {
            border-top: 1px solid var(--clr-border);
            padding: 20px;
            color: #fff;
        }
        .brush-item:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .brush-item.focus {
            background-color: skyblue;
            font-weight: bold;
        }
        input, select, button.text {
            background: none;
            color: #fff;
            height: 35px;
            border: none;
            outline: none;
        }
        select > option {
            background: var(--clr-background);
        }
        .slider {
            color: #FAFAFA;
            display: grid;
            grid-template-columns: 60px 1fr 40px;
            gap: 5px;
            align-items: center;
            padding-inline: 5px;
        }
        input[type="range"] {
            -webkit-appearance: none; /* 기본 스타일 제거 */
            background: #FAFAFA;
            overflow: hidden;
            height: 20px;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; /* 기본 스타일 제거 */
            width: 0;
            height: 0;
            background: transparent;
            box-shadow: -500px 0 0 500px #6495ed;
            cursor: pointer;
        }
        `;
    }
}

customElements.define(`${$TAG_PREFIX}-window`, WindowElement);

function clearDragEvent(cb = () => { }) {
    // pointerup 또는 pointercancel로 드래그 종료 처리
    window.onlostpointercapture = window.onpointerup = window.onpointercancel = e => {
        cb(e);
        window.onpointerdown = window.onpointermove = window.onpointerup = window.onpointercancel = undefined;
    };
}

function compareDistance(e, zone_rect) {
    // 거리 계산 로직 (추가 필요)

    return zone_rect.left <= e.clientX && e.clientX <= zone_rect.right;
}

function createZone(zone) {
    let zone_div = Utils.createElement('div').addClass('flexZone')
    if (!zone.disabled) {
        zone_div.attrs({ 'data-width': zone.width }).style.setProperty('--width', `${zone.width}px`);
        let isRight = zone.direction == Direction.right;
        let btn_resize = Utils.createElement('button').addClass('resizer').toggleClass('right', isRight).appendTo(zone_div);
        btn_resize.onpointerdown = (s_e) => {
            btn_resize.focus();
            let s_width = Number(zone_div.dataset.width);
            let n_width = s_width;

            // 기본 터치 및 팬 동작 방지 (예: 스크롤)
            s_e.preventDefault();

            window.onpointermove = (s_m) => {
                // 기본 동작 방지
                s_m.preventDefault();
                n_width = Math.max(Math.min(parseInt(s_width + (s_m.clientX - s_e.clientX) * (isRight ? -1 : 1)), zone.maxWidth), zone.minWidth);
                zone_div.attrs({ 'data-width': n_width }).style.setProperty('--width', `${n_width}px`);
            };

            // pointerup 및 pointercancel로 드래그 종료 처리
            clearDragEvent();
        };
    }
    else {
        zone_div.tabIndex = 0;
        zone_div.addClass('main').css({ flex: 1 });
        zone_div.onpointerdown = (e_d) => {
            zone_div.focus();
            nemu.setPointer(e_d, zone_div);
            if (!e_d.isPrimary) return nemu.gesture(true);
            let { scrollTop, scrollLeft } = zone_div;
            window.onpointermove = e_m => {
                nemu.trackPointer(e_m);
                if (e_d.pointerType !== e_m.pointerType || !e_m.isPrimary) return nemu.gesture();
                zone_div.scrollTop = scrollTop + (e_d.clientY - e_m.clientY);
                zone_div.scrollLeft = scrollLeft + (e_d.clientX - e_m.clientX);
            }

            clearDragEvent(e => {
                nemu.releasePointer(e);
            });
        }
        window.addEventListener('pointerup', e => nemu.releasePointer(e));
    }

    for (let winBuilder of (zone.default || [])) {
        winBuilder().appendTo(zone_div);
    }
    return zone_div;
}

window.onload = () => {
    Utils.createElement('nemu-top-menu').appendTo(document.body);
    Utils.createElement('nemu-root').attrs({ id: 'root' }).appendTo(document.body);
    Utils.createElement('nemu-bottom-menu').appendTo(document.body);
}

// 텍스트 선택 방지
document.addEventListener('selectstart', function (event) {
    event.preventDefault(); // 텍스트 선택 막기
});

// // 터치 이벤트에서 발생하는 기본 동작 막기
// document.addEventListener('touchstart', function (event) {
//     event.preventDefault(); // 기본 터치 동작 방지
// }, { passive: false });