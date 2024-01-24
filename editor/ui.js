let app;
let files = [
    { id: Math.random(), name: 'files_1.txt' },
    { id: Math.random(), name: 'index.css' },
    { id: Math.random(), name: 'index', isFolder: true, children: [{ name: 'index.html' }] },
    { id: Math.random(), name: 'index.html' }
]
Vue.component('file', {
    props: {
        'id': {},
        'name': { default: '[no_named_file]' },
        'isFolder': { default: false },
        'children': { default: () => [] },
        'state': { type: Number },
        'onTab': {},
        'padding': { default: 2.2 }
    },
    template: `
    <div class="aside_folder" v-if="isFolder">
        <div class="aside_line" onclick="this.parentElement.classList.toggle('open')" tabindex="0" :style="'padding-left:'+padding+'rem;'">{{ name }}</div>
        <file v-for="child in children" v-bind="{...child,onTab,padding: padding + 2.2}"></file>
    </div>
    <div class="aside_line" v-else 
        v-on:click="onTab.addSubTab({id, name, isFolder, onTab}, true)"
        v-on:dblclick="onTab.addSubTab({id})"
        :type="name.split('.')[1]||'file'"
        :style="'padding-left:'+padding+'rem;'"
        tabindex="0">{{ name }}</div>
    `
})
const TabState = {
    temp: 0,
    open: 1
}

class Tab {
    constructor(_app) {
        this._uid = Math.random();
        this._app = _app;
        this._icon = 'mdi-radiobox-blank';
        this._nam = 'empty tab';
        this._subTabs = [];

        this._onSubTab = new SubTab();
    }

    addSubTab = ({
        name = 'file1.txt',
        id
    }, temp = false) => {
        if (this._subTabs.find(subTab => subTab._state != TabState.temp && subTab._uid == id)) return;
        let subTab = null, temp_index = this._subTabs.findIndex(subTab => subTab._state == TabState.temp);
        let state = temp ? TabState.temp : TabState.open;

        if (temp_index < 0) {
            editor.clear();
            if (temp_index = this._subTabs.findIndex(subTab => subTab._uid == id) > -1) return;
            this._app.onTab._onSubTab = subTab = create();
            this._subTabs.push(subTab);
        } else if (this._subTabs[temp_index]._uid === id) {
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
            subTab.set('state', state);
        } else {
            editor.clear();
            this._app.$set(this._app.onTab._subTabs, temp_index, create());
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
        }

        function create() {
            return new SubTab(this, { uid: id, name, state });
        }

        return subTab;
    }
}

class GameTab extends Tab {
    constructor(_app) {
        super(_app);
        this._nam = 'game develop';
        this._icon = 'mdi-gamepad-square';
    }
}

class SubTab {
    constructor(tab, props = {}) {
        this._uid = Math.random();
        this._tab = tab;
        for (let propName in props) this['_' + propName] = props[propName];
    }

    set = (p, v) => this['_' + p] = v;
}

window.onload = () => {
    app = new Vue({
        el: '.bodyContainer',
        updated: () => {
            repaintScrollbarVisible();
        },
        data: {
            files,
            tabs: [],
            onTab: new Tab(),
        },
        methods: {
            addTab: function () {
                let tab = new Tab(this);
                this.tabs.push(tab);
            },
            changeTab: function (tab) {
                this.onTab = tab;
            },
            changeSubTab: function (subTab) {
                editor.clear();
                this.onTab._onSubTab = subTab
            },
            closeSubTab: function ({ _uid }) {
                editor.clear();
                this.onTab._subTabs = this.onTab._subTabs.filter(sub => sub._uid != _uid);
            }
        }
    });
    app.addTab();
    app.addTab();
    app.addTab();
    app.onTab._app = app;

    let aside = document.querySelector('section');
    let resizer = document.querySelector('.resizer');

    resizer.onmousedown = e_down => {
        aside = document.querySelector('section');
        let pos = e_down.screenX;
        let width = aside.getBoundingClientRect().width;
        window.onmousemove = e_move => aside.style.width = `${width - e_move.screenX + pos}px`;
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        }
    }

}

window.addEventListener('resize', function () {
    repaintScrollbarVisible();
})

function repaintScrollbar(scrollbar) {
    let target = document.querySelector(scrollbar.getAttribute('target'));

    if (target == undefined) return console.warn(`${scrollbar.getAttribute('target')} is not exist`);

    let w = target.getBoundingClientRect().width;
    let scroll_w = target.scrollWidth;
    let ratio = w / scroll_w;
    if (scroll_w - w < 2) return scrollbar.classList.add('unused');
    scrollbar.classList.remove('unused');

    let offset = target.scrollLeft / scroll_w;

    let min = 0, max = (scroll_w - w) * ratio;

    scrollbar.style.width = Math.floor(w * ratio) + 'px';
    scrollbar.style.left = Math.floor(w * offset) + 'px';

    scrollbar.onmousedown = e_down => {
        e_down.preventDefault();
        let pos = (parseInt(scrollbar.getAttribute('pos')) || 0);
        let pos_down = e_down.screenX;
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        }
        window.onmousemove = e_move => {
            let pos_move = e_move.screenX;
            let pos_final = between(min, max, (pos_move - pos_down + pos));
            target.scrollLeft = pos_final / ratio;
            scrollbar.style.left = pos_final + 'px';
        }
    }
}

function repaintScrollbarVisible() {
    for (let scrollbar of document.querySelectorAll('.h-scrollbar')) repaintScrollbar(scrollbar);
}

function between(min, max, value) {
    return Math.max(Math.min(max, value), min);
}

const hangul = {
    q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
    a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
    z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ",
    Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ", Y: "ㅛ", U: "ㅕ", I: "ㅑ", O: "ㅒ", P: "ㅖ",
    A: "ㅁ", S: "ㄴ", D: "ㅇ", F: "ㄹ", G: "ㅎ", H: "ㅗ", J: "ㅓ", K: "ㅏ", L: "ㅣ",
    Z: "ㅋ", X: "ㅌ", C: "ㅊ", V: "ㅍ", B: "ㅠ", N: "ㅜ", M: "ㅡ",
};
const hangul_moeum = ["ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅗ", "ㅓ", "ㅏ", "ㅣ", "ㅠ", "ㅜ", "ㅡ"];
const hangul_moeum_combine = { 'ㅗ': { 'ㅏ': 'ㅘ', 'ㅐ': 'ㅙ', 'ㅣ': 'ㅚ' }, 'ㅜ': { 'ㅓ': 'ㅝ', 'ㅣ': 'ㅟ', 'ㅔ': 'ㅞ' }, 'ㅡ': { 'ㅣ': 'ㅢ' } };
const hangul_jaum_combine = { 'ㄱ': { 'ㅅ': 'ㄳ' }, 'ㄴ': { 'ㅈ': 'ㄵ', 'ㅎ': 'ㄶ' }, 'ㄹ': { 'ㄱ': 'ㄺ', 'ㅁ': 'ㄻ', 'ㅂ': 'ㄼ', 'ㅅ': 'ㄽ', 'ㅌ': 'ㄾ', 'ㅍ': 'ㄿ', 'ㅎ': 'ㅀ' }, 'ㅂ': { 'ㅅ': 'ㅄ' } };
let HangulMode = true;
let hangul_typing = [];
function isMoeum(char) {
    return hangul_moeum.indexOf(char) > -1;
}
function hangulCombine(원자들) {
    const 초성 = 원자들[0] || '';
    const 중성 = 원자들[1] || '';
    const 종성 = 원자들[2] || '';
    if (!중성) {
        return 초성;
    }
    const 중성_유니코드 = 중성.charCodeAt(0);
    const 초성_연결자 = {
        'ㄱ': 0, 'ㄲ': 1, 'ㄴ': 2, 'ㄷ': 3,
        'ㄸ': 4, 'ㄹ': 5, 'ㅁ': 6, 'ㅂ': 7,
        'ㅃ': 8, 'ㅅ': 9, 'ㅆ': 10, 'ㅇ': 11,
        'ㅈ': 12, 'ㅉ': 13, 'ㅊ': 14, 'ㅋ': 15,
        'ㅌ': 16, 'ㅍ': 17, 'ㅎ': 18,
    };
    const 종성_연결자 = {
        '': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄳ': 3,
        'ㄴ': 4, 'ㄵ': 5, 'ㄶ': 6, 'ㄷ': 7,
        'ㄹ': 8, 'ㄺ': 9, 'ㄻ': 10, 'ㄼ': 11,
        'ㄽ': 12, 'ㄾ': 13, 'ㄿ': 14, 'ㅀ': 15,
        'ㅁ': 16, 'ㅂ': 17, 'ㅄ': 18, 'ㅅ': 19,
        'ㅆ': 20, 'ㅇ': 21, 'ㅈ': 22, 'ㅊ': 23,
        'ㅋ': 24, 'ㅌ': 25, 'ㅍ': 26, 'ㅎ': 27,
    };
    const 자음_유니코드_시작점 = 12623;
    const 유니코드_한글_시작점 = 44032;
    const 초성_인덱스 = 초성_연결자[초성];
    const 중성_인덱스 = 중성_유니코드 - 자음_유니코드_시작점;
    const 종성_인덱스 = 종성_연결자[종성];
    return String.fromCharCode(
        유니코드_한글_시작점
        + 초성_인덱스 * 588
        + 중성_인덱스 * 28
        + 종성_인덱스
    );
}
function checkKeepHangul(c) {
    if (c.previousSibling && c.previousSibling.nodeType !== 3 && c.previousSibling.classList.contains('hangulCaret')) {
        c.previousSibling.replaceWith(document.createTextNode(c.previousSibling.innerText));
        hangul_typing = [];
    }
}
const editor = {
    get: function () { return document.querySelector('.subTab__contents'); },
    clear: function () {
        let contents = editor.get();
        while (contents.firstChild) contents.lastChild.remove();
    },
    save: () => {
        console.log('text save imsi');
    },
    getCaret: function () {
        return document.querySelector('.caret') || function () {
            let c = document.createElement('span');
            c.classList.add('caret');
            return c;
        }();
    },
    getHangulCaret: function () {
        let c = editor.getCaret();
        return c.previousSibling && c.previousSibling.nodeType != 3 ? c.previousSibling : (() => {
            let hangulCaret = document.createElement('span');
            hangulCaret.classList.add('hangulCaret');
            c.before(hangulCaret);
            return hangulCaret;
        })()
    },
    focus: function (new_target) {
        if (!new_target.classList.contains('line')) return;
        editor.focused_target = new_target;
        new_target.appendChild(editor.getCaret());
    },
    blur: function () {
        let hc = editor.getHangulCaret();
        if (hc.innerText.length > 0) hc.replaceWith(document.createTextNode(hc.innerText));
        else hc.remove();
        editor.getCaret().remove();
    },
    focused_target: undefined,
    newLine: function (bool = true) {
        let line_number = document.createElement('div');
        line_number.classList.add('line_number');
        if (bool) editor.get().append(line_number);
        else editor.focused_target.after(line_number);
        let line = document.createElement('div');
        line.classList.add('line');
        line_number.after(line);
        line.onclick = line_number.onclick = () => editor.focus(line);
        editor.focus(line);
        return line;
    },
    on: {
        keydown: function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
            if (ctrlKey || shiftKey || altKey || metaKey) {
                event.preventDefault();

                if (ctrlKey) {
                    switch (key.toLowerCase()) {
                        case 's':
                            editor.save();
                            break;
                        case 'f5':
                            location.reload();
                            break
                    }
                }

                return;
            }
            repaintScrollbar(document.querySelector('.h-scrollbar[target=".subTab__contents"]'));
            if (key.length < 2) {
                for(let sel_span of editor.get().querySelectorAll('span.sel'))sel_span.remove();
                let hanguel_i;
                let c = editor.getCaret();
                if (!HangulMode || (hanguel_i = hangul[key]) == undefined) {
                    checkKeepHangul(c);
                    c.before(document.createTextNode(key));
                } else {
                    if (hangul_typing[0] == undefined) {
                        hangul_typing[0] = hanguel_i;
                        editor.getHangulCaret().innerText = hanguel_i;
                    } else if (hangul_typing[1] == undefined) {
                        if (isMoeum(hanguel_i)) {
                            if (isMoeum(hangul_typing[0])) {
                                if (hangul_moeum_combine[hangul_typing[0]] && hangul_moeum_combine[hangul_typing[0]][hanguel_i]) {
                                    editor.getHangulCaret().replaceWith(document.createTextNode(hangul_moeum_combine[hangul_typing[0]][hanguel_i]));
                                    hangul_typing = [];
                                } else {
                                    editor.getHangulCaret().before(document.createTextNode(hangul_typing[0]))
                                    editor.getHangulCaret().innerText = hanguel_i;
                                    hangul_typing = [hanguel_i];
                                }
                            } else {
                                hangul_typing[1] = hanguel_i;
                                editor.getHangulCaret().innerText = hangulCombine(hangul_typing);
                            }
                        } else if (hangul_jaum_combine[hangul_typing[0]] && hangul_jaum_combine[hangul_typing[0]][hanguel_i]) {
                            editor.getHangulCaret().replaceWith(document.createTextNode(hangul_jaum_combine[hangul_typing[0]][hanguel_i]));
                            hangul_typing = [];
                        } else {
                            editor.getHangulCaret().before(document.createTextNode(hangul_typing[0]))
                            editor.getHangulCaret().innerText = hanguel_i;
                            hangul_typing = [hanguel_i];
                        }
                    } else if (hangul_typing[2] == undefined) {
                        if (isMoeum(hanguel_i)) {
                            if (hangul_moeum_combine[hangul_typing[1]] && hangul_moeum_combine[hangul_typing[1]][hanguel_i]) {
                                hangul_typing[1] = hangul_moeum_combine[hangul_typing[1]][hanguel_i];
                                editor.getHangulCaret().innerText = hangulCombine(hangul_typing);
                            } else {
                                editor.getHangulCaret().before(document.createTextNode(hangulCombine(hangul_typing)));
                                editor.getHangulCaret().innerText = hanguel_i;
                                hangul_typing = [hanguel_i];
                            }
                        } else {
                            hangul_typing[2] = hanguel_i;
                            editor.getHangulCaret().innerText = hangulCombine(hangul_typing);
                        }
                    } else {
                        if (isMoeum(hanguel_i)) {
                            let new_hangul_typing = [hangul_typing.pop(), hanguel_i];
                            editor.getHangulCaret().before(document.createTextNode(hangulCombine(hangul_typing)));
                            editor.getHangulCaret().innerText = hangulCombine(new_hangul_typing);
                            hangul_typing = new_hangul_typing;
                        } else if (hangul_jaum_combine[hangul_typing[2]] && hangul_jaum_combine[hangul_typing[2]][hanguel_i]) {
                            hangul_typing[2] = hangul_jaum_combine[hangul_typing[2]][hanguel_i];
                            editor.getHangulCaret().replaceWith(document.createTextNode(hangulCombine(hangul_typing)));
                            hangul_typing = [];
                        } else {
                            editor.getHangulCaret().before(document.createTextNode(hangulCombine(hangul_typing)));
                            editor.getHangulCaret().innerText = hanguel_i;
                            hangul_typing = [hanguel_i];
                        }
                    }
                }
            } else {
                let c = editor.getCaret();
                checkKeepHangul(c);
                switch (key) {
                    case "HangulMode":
                        HangulMode = !HangulMode;
                        break;
                    case "Down":
                    case "ArrowDown":
                        editor.focused_target.nextElementSibling && editor.focus(editor.focused_target.nextElementSibling.nextElementSibling);
                        break;
                    case "Up":
                    case "ArrowUp":
                        editor.focused_target.previousElementSibling && editor.focused_target.previousElementSibling.previousElementSibling && editor.focus(editor.focused_target.previousElementSibling.previousElementSibling);
                        break;
                    case "Left":
                    case "ArrowLeft":
                        c.previousSibling && c.previousSibling.before(c);
                        break;
                    case "Right":
                    case "ArrowRight":
                        c.nextSibling && c.nextSibling.after(c);
                        break;
                    case "Enter":
                        let ns = c.nextSibling;
                        let nl = editor.newLine(false);
                        let temp;
                        while (temp = ns) {
                            ns = ns.nextSibling;
                            nl.appendChild(temp);
                        }
                        break;
                    case "Backspace":
                        if (c.previousSibling) {
                            c.previousSibling.remove();
                        } else if (editor.get().children.length > 2) {
                            let t = editor.focused_target;
                            t.previousElementSibling.remove();
                            let last_char = t.previousElementSibling.lastChild;
                            for (let char of Array.from(t.childNodes)) t.previousElementSibling.appendChild(char);
                            editor.focus(t.previousElementSibling);
                            t.remove();
                            if (last_char) last_char.after(editor.getCaret());
                        }
                        for(let sel_span of editor.get().querySelectorAll('span.sel'))sel_span.remove();
                        break;
                }
            }

        },
        keyup: function ({ keyCode }) {

        },
        click: function (e) {
            console.log(1);
        },
        mouseup: function (e) {
            console.log(2);
        },
        mousedown: e_down => {
            console.log(3);
            let line = e_down.target;
            if (editor.get().children.length < 1) {
                editor.newLine();
            } else {
                editor.focus(e_down.target);

                getClickedTextNode(e_down.target, e_down, node => node.before(editor.getCaret()));
            }
            //e_down.preventDefault();
            let anchor_line = e_down.target, focus_line, anchor, focus;
            switch (anchor_line.classList[0]) {
                case 'subTab__contents':
                    return;
                    break;
                case 'line_number':
                    anchor_line = anchor_line.nextElementSibling;
                    break;
                case 'line':
                default:
                    break;
            }
            anchor = getClickedTextNode(anchor_line, e_down);
            editor.get().onmousemove = e_move => {
                editor.deselect();
                e_move.preventDefault();
                focus_line = e_move.target;
                switch (focus_line.classList[0]) {
                    case 'subTab__contents':
                        focus = editor.get().lastElementChild.lastChild || editor.get().lastElementChild;
                        break;
                    case 'line_number':
                        focus = focus_line.previousElementSibling.lastChild || focus_line.previousElementSibling;
                        break;
                    case 'line':
                        focus = getClickedTextNode(focus_line, e_move);
                    default:
                        break;
                }
                editor.select(anchor, focus);

            }
            window.onmouseup = e_up => {
                e_up.preventDefault();
                window.onmouseup = undefined;
                editor.get().onmousemove = undefined;
            }
        }
    },
    select: (anchor_node, focus_node) => {
        let anchor_index = getIndex(anchor_node);
        let focus_index = getIndex(focus_node);
        let temp;
        if (
            anchor_index.i2 > focus_index.i2 ||
            (anchor_index.i2 == focus_index.i2 && anchor_index.i1 > focus_index.i1)
        ) {
            temp = anchor_index;
            anchor_index = focus_index;
            focus_index = temp;
        }
        let lines = editor.get().childNodes;
        let i = anchor_index.i2;
        if(anchor_index.i2 == focus_index.i2){
            selLine(lines[i], anchor_index.i1, focus_index.i1);
        }else{
            selLine(lines[i], anchor_index.i1);
            while(i < focus_index.i2 - 1){
                i++;
                selLine(lines[i]);
            }
            selLine(lines[focus_index.i2], 0, focus_index.i1);
        }
        function selLine(line, s_index = 0, e_index = line.childNodes.length - 1){
            for(let node of Array.from(line.childNodes).slice(s_index, e_index + 1)){
                let span = document.createElement('span');
                span.classList.add('sel');
                span.innerText = node.nodeValue;
                node.replaceWith(span);
            }
        }
        function getIndex(node) {
            let i1, i2;
            if (node.nodeType === 3 || node.classList.contains('caret')) {
                i1 = Array.from(node.parentNode.childNodes).indexOf(node);
                i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(node.parentNode);
            } else {
                i1 = -1;
                i2 = Array.from(node.parentNode.childNodes).indexOf(node);
            }
            return {i1, i2};
        }
    },
    deselect: () => {
        for(let sel_span of editor.get().querySelectorAll('span.sel')){
            sel_span.replaceWith(document.createTextNode(sel_span.innerText));
        }
    }
}

function getClickedTextNode(element, event, callback = false) {
    let range = getClickedTextNode.range || (getClickedTextNode.range = document.createRange());
    for (let node of element.childNodes) {
        if (node.nodeType === 3 ? compare(node) : getClickedTextNode(node, event)) {
            if (callback !== false) callback(node);
            return node;
        }
    }

    function compare(node) {
        range.selectNodeContents(node);
        let { left, right } = range.getClientRects()[0];
        return event.pageX >= left && event.pageX <= right;
    }
}