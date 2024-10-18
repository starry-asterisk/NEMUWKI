/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-18
* Description: personal canvas project for NEMU
*/

import { BaseElement } from './Base.js?_=1';
import { toolsWindow, brushSettingWindow, brushesWindow, erasersWindow, layersWindow, usersWindow, canvasWindow } from './Windows.js?_=1';

window.nemu = {
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
    fixCanvasScroll(rect1, rect2){
        let diffX = rect2.x - rect1.x;
        let diffY = rect2.y - rect1.y;
        let container = this.layerWrap.parentNode;
        container.scrollLeft += diffX;
        container.scrollTop += diffY;
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
        default: [layersWindow, usersWindow],
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
        nemu.toggleWindow('users', true);
        nemu.pens[0].onclick();
        nemu.startup_rtc();
        return frag;
    }

    connectedCallback() {
        nemu.layerWrap.scrollIntoView({ block:'center', inline:'center' });
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
            return true;
        });
        createLi(fileUl, '캔버스 불러오기', 'button', function () {
            return true;
        });
        createLi(fileUl, '캔버스 저장', 'button', function () {
            return true;
        });
        createLi(fileUl, '이미지로 저장하기', 'button', function () {
            return true;
        });
        let layerUl = createUl('레이어');
        createLi(layerUl, '캔버스 사이즈 변경', 'button', function () {
            return true;
        });
        createLi(layerUl, '캔버스 원위치', 'button', function () {
            return true;
        });
        createLi(layerUl, '색상 보정', 'button', function () {
            return true;
        });
        createLi(layerUl, '레이어 클리어', 'button', function () {
            return true;
        });
        createLi(layerUl, '가우시안 블러', 'button', function () {
            return true;
        });
        createLi(layerUl, '레이어를 아래로 통합', 'button', function () {
            return true;
        });
        createLi(layerUl, '레이어 추가', 'button', function () {
            return true;
        });
        createLi(layerUl, '레이어 삭제', 'button', function () {
            return true;
        });
        let windowUl = createUl('윈도우');
        let winSettings = [
            {title: '도구', name: 'tools'},
            {title: '드로잉 설정', name: 'brusheSetting'},
            {title: '브러쉬', name: 'brushes'},
            {title: '지우개', name: 'erasers'},
            {title: '레이어', name: 'layers'},
            {title: '연결된 사용자 목록', name: 'users'},
        ];
        for(let setting of winSettings) {
            if(!nemu._windows[setting.name]) nemu._windows[setting.name] = {};
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
                if(section.childNodes[0]?.nodeType == 3) section.childNodes[0].remove();
                else section.childNodes[0]?.addClass('toast');
                section.prepend(item);
            }
        }
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
        li > input {
            margin: 0 0 0 auto;
        }
        section {
            color: #FAFAFA;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            line-height: 24px;
            counter-reset: alarm;
            position: relative;
            margin: 5px auto ;
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
        } else setEndDrawHandler();

        if(id === host_peer) history.replaceState('', {}, `${location.origin + location.pathname}`);
    });

    peer.on('connection', handleConnection);
    peer.on('error', errorHandle);
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
        const { canvas, width, height } = layerElement;
        conn.send({ type: 'refreshCanvas', dataUrl: toDataUrl(canvas, 0, 0, width, height), minX: 0, minY: 0, w: width, h: height });
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
        conn.send({ type: 'initResponse', list: connections.map(conn => conn.peer) })
    },
    initResponse(conn, data) {
        Utils.info('공용 캔버스에 입장하셨습니다.');
        let list = data.list.filter(peer_id => (peer_id != host_peer && peer_id != my_peer));
        for (let peer_id of list) {
            var conn = peer.connect(peer_id);
            handleConnection(conn);
        }
        setEndDrawHandler();
    },
    refreshCanvas(conn, data, layer) {
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
        const { canvas, layerData } = layerElement;
        const { minX, minY, maxX, maxY } = layerData;
        let w = maxX - minX + 1;
        let h = maxY - minY + 1;
        let data = { type: 'refreshCanvas', dataUrl: toDataUrl(canvas, minX, minY, w, h), minX, minY, w, h };

        for (let conn of connections) conn.send(data);
    });
}

nemu.setUserName = text => {
    nemu.username = text;
    let data = { type: 'setUserName', username: text };
    for (let conn of connections) conn.send(data);
}

function toDataUrl(srcCanvas, minX, minY, w, h) {
    let msgCanvas = Utils.createElement('canvas');
    let msgCtx = msgCanvas.getContext('2d');
    msgCanvas.width = w;
    msgCanvas.height = h;
    msgCtx.drawImage(srcCanvas, minX, minY, w, h, 0, 0, w, h);
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
            let canvas_rect = nemu.layerWrap.getBoundingClientRect();
            let s_rect = win.getBoundingClientRect();
            let n_rect = { top: s_rect.top, left: s_rect.left };
            let n_e = s_e;

            // 기본 터치 및 팬 동작 방지 (예: 스크롤)
            s_e.preventDefault();

            win.css({ 'z-index': ++windowZindex }).addClass('moving');
            nemu.fixCanvasScroll(canvas_rect, nemu.layerWrap.getBoundingClientRect());

            window.onpointermove = (s_m) => {
                // 기본 동작 방지
                s_m.preventDefault();
                n_e = s_m;
                if (win.parentNode != root.shadowRoot) requestAnimationFrame(() => {
                    root.shadowRoot.prepend(win);
                    nemu.fixCanvasScroll(canvas_rect, nemu.layerWrap.getBoundingClientRect());
                });
                n_rect.top = parseInt(s_rect.top - s_e.clientY + s_m.clientY);
                n_rect.left = parseInt(s_rect.left - s_e.clientX + s_m.clientX);
                win.css({
                    top: `${n_rect.top - 35}px`,
                    left: `${n_rect.left}px`,
                });
            };

            // pointerup 및 pointercancel로 드래그 종료 처리
            clearDragEvent(() => {
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

        button.drag {
            position: sticky;
            top: 0;
            width: 100%;
            height: 25px;
        }

        .layer-list {
            list-style: none;
            padding: 0;
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
        .layer-item:last-child {
            border-bottom: 1px solid var(--clr-border);
        }
        .layer-item.focus {
            background-color: skyblue;
        }

        .brush-list {
            list-style: none;
            padding: 0;
        }
        .brush-item {
            border-top: 1px solid var(--clr-border);
            padding: 20px;
            color: #fff;
        }
        .brush-item:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .brush-item:last-child {
            border-bottom: 1px solid var(--clr-border);
        }
        .brush-item.focus {
            background-color: skyblue;
            font-weight: bold;
        }

        .user-list {
            list-style: none;
            padding: 0;
        }
        .user-item {
            border-top: 1px solid var(--clr-border);
            padding: 10px;
            color: #fff;
        }
        .user-item:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .user-item:last-child {
            border-bottom: 1px solid var(--clr-border);
        }
        .user-item.focus {
            background-color: skyblue;
            font-weight: bold;
        }
        .user-name-input {
            display: block;
            margin: 10px auto;
            border-bottom: 1px solid var(--clr-border);
            text-align: center;
        }
        .user-name-input:focus {
            border-bottom-color: skyblue;
        }
        .user-name-button {
            display: block;
            margin: 10px auto;
            padding: 5px;
            width: 150px;
            background: none;
            border: 1px solid var(--clr-border);
            color: #FAFAFA;
        }
        .user-name-button:hover {
            border-color: skyblue;
        }
        .user-name-button:active {
            opacity: 0.5;
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
    window.onpointerup = window.onpointercancel = () => {
        cb();
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
            clearDragEvent(() => { });
        };
    }
    else {
        zone_div.addClass('main').css({ flex: 1 });
        zone_div.onmousedown = e_d => {
            if (e_d.target != zone_div) return;
            let { scrollTop, scrollLeft } = zone_div;
            window.onmousemove = e_m => {
                zone_div.scrollTop = scrollTop + (e_d.clientY - e_m.clientY);
                zone_div.scrollLeft = scrollLeft + (e_d.clientX - e_m.clientX);
            }
            window.onmouseleave = window.onmouseup = () => {
                window.onmouseleave = window.onmouseup = window.onmousemove = null;
            }
        }
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