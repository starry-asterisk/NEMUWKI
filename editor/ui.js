if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}


if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;

        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

HTMLElement.prototype.prev = function (s) {
    var el = this.previousElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.previousElementSibling;
    }
    return null;
}

HTMLElement.prototype.next = function (s) {
    var el = this.nextElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.nextElementSibling;
    };
    return null;
}

let app;
let files = [
    { id: Math.random(), name: "files_1.txt" },
    { id: Math.random(), name: "index.css" },
    {
        id: Math.random(),
        name: "index",
        isFolder: true,
        children: [{ name: "index.html" }],
    },
    { id: Math.random(), name: "index.html" },
];
Vue.component("file", {
    props: {
        id: {},
        name: { default: "[no_named_file]" },
        isFolder: { default: false },
        children: { default: () => [] },
        state: { type: Number },
        onTab: {},
        padding: { default: 2.2 },
    },
    template: `
    <div class="aside_folder" v-if="isFolder">
        <div class="aside_line" onclick="this.parentElement.classList.toggle('open')" tabindex="0" :style="'padding-left:'+padding+'rem;'">{{ name }}</div>
        <file v-for="(child, index) in children" :key="index" v-bind="{...child,onTab,padding: padding + 2.2}"></file>
    </div>
    <div class="aside_line" v-else 
        v-on:click="onTab.addSubTab({id, name, isFolder, onTab}, true)"
        v-on:dblclick="onTab.addSubTab({id})"
        :type="name.split('.')[1]||'file'"
        :style="'padding-left:'+padding+'rem;'"
        tabindex="0">{{ name }}</div>
    `,
});
const TabState = {
    temp: 0,
    open: 1,
};

class Tab {
    constructor(_app) {
        this._uid = Math.random();
        this._app = _app;
        this._icon = "mdi-radiobox-blank";
        this._nam = "empty tab";
        this._subTabs = [];

        this._onSubTab = new SubTab();
    }

    addSubTab = ({ name = "file1.txt", id }, temp = false) => {
        if (
            this._subTabs.find(
                (subTab) => subTab._state != TabState.temp && subTab._uid == id
            )
        )
            return;
        let subTab = null,
            temp_index = this._subTabs.findIndex(
                (subTab) => subTab._state == TabState.temp
            );
        let state = temp ? TabState.temp : TabState.open;

        if (temp_index < 0) {
            //editor.clear();
            if (
                (temp_index =
                    this._subTabs.findIndex((subTab) => subTab._uid == id) > -1)
            )
                return;
            this._app.onTab._onSubTab = subTab = create();
            this._subTabs.push(subTab);
        } else if (this._subTabs[temp_index]._uid === id) {
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
            subTab.set("state", state);
        } else {
            editor.clear();
            this._app.$set(this._app.onTab._subTabs, temp_index, create());
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
        }

        function create() {
            return new SubTab(this, { uid: id, name, state });
        }

        return subTab;
    };
}

class GameTab extends Tab {
    constructor(_app) {
        super(_app);
        this._nam = "game develop";
        this._icon = "mdi-gamepad-square";
    }
}

class SubTab {
    constructor(tab, props = {}) {
        this._uid = Math.random();
        this._tab = tab;
        for (let propName in props) this["_" + propName] = props[propName];
    }

    set = (p, v) => (this["_" + p] = v);
}

window.onload = () => {
    app = new Vue({
        el: ".bodyContainer",
        updated: () => {
            repaintScrollbarVisible();
        },
        data: {
            files,
            tabs: [],
            onTab: new Tab(),
            hangulMode: false,
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
                this.onTab._onSubTab = subTab;
            },
            closeSubTab: function ({ _uid }) {
                editor.clear();
                this.onTab._subTabs = this.onTab._subTabs.filter(
                    (sub) => sub._uid != _uid
                );
            },
        },
    });
    app.addTab();
    app.addTab();
    app.addTab();
    app.onTab._app = app;

    let aside = document.querySelector("section");
    let resizer = document.querySelector(".resizer");

    resizer.onmousedown = (e_down) => {
        aside = document.querySelector("section");
        let pos = e_down.screenX;
        let width = aside.getBoundingClientRect().width;
        window.onmousemove = (e_move) =>
            (aside.style.width = `${width - e_move.screenX + pos}px`);
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        };
    };
};

window.addEventListener("resize", function () {
    repaintScrollbarVisible();
});
class ScrollEventManager {
    ListenerList = {};
    addEventListener = (target, _id, eventName, callback) => {
        if (typeof target == 'string') target = document.querySelector(target);
        if (this.ListenerList[_id]) target.removeEventListener(eventName, this.ListenerList[_id]);
        target.addEventListener(eventName, callback);
        this.ListenerList[_id] = callback;
    }
}
const scrollEventManager = new ScrollEventManager();

function repaintScrollbar(scrollbar, isHorizontal = true) {
    let targetName = scrollbar.getAttribute("target");
    let target = document.querySelector(targetName);

    if (target == undefined)
        return console.warn(`${targetName} is not exist`);

    let namespace = isHorizontal ? {
        size: 'width',
        pos: 'left',
        scrollSize: 'scrollWidth',
        scrollPos: 'scrollLeft',
        screen: 'screenX',
    } : {
        size: 'height',
        pos: 'top',
        scrollSize: 'scrollHeight',
        scrollPos: 'scrollTop',
        screen: 'screenY',
    };

    let s = target.getBoundingClientRect()[namespace.size];
    let scroll_s = target[namespace.scrollSize];
    let ratio = s / scroll_s;
    if (scroll_s - s < 2) return scrollbar.classList.add("unused");
    scrollbar.classList.remove("unused");

    let offset = target[namespace.scrollPos] / scroll_s;

    let min = 0,
        max = (scroll_s - s) * ratio;

    scrollbar.style[namespace.size] = Math.floor(s * ratio) + "px";
    scrollbar.style[namespace.pos] = Math.floor(s * offset) + "px";

    scrollbar.onmousedown = (e_down) => {
        e_down.preventDefault();
        let pos_final, pos = parseInt(scrollbar.getAttribute("pos")) || 0;
        let pos_down = e_down[namespace.screen];
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
            scrollbar.setAttribute("pos", pos_final);
        };
        window.onmousemove = (e_move) => {
            let pos_move = e_move[namespace.screen];
            pos_final = between(min, max, pos_move - pos_down + pos);
            target[namespace.scrollPos] = pos_final / ratio;
            scrollbar.style[namespace.pos] = pos_final + "px";
        };
    };

    scrollEventManager.addEventListener(target, targetName + '_onwheel_' + isHorizontal, 'wheel', (e_wheel) => {
        if (e_wheel.shiftKey != isHorizontal) return;
        let direction, pos = parseInt(scrollbar.getAttribute("pos")) || 0;
        if (e_wheel.wheelDelta > 0 || e_wheel.detail < 0) direction = -1;
        else direction = 1;
        pos += direction * 19;
        pos = between(min, max, pos);
        console.log(pos);
        scrollbar.setAttribute("pos", pos);
        target[namespace.scrollPos] = pos / ratio;
        scrollbar.style[namespace.pos] = pos + "px";
    });
}

function repaintScrollbarVisible() {
    for (let scrollbar of document.querySelectorAll(".h-scrollbar"))
        repaintScrollbar(scrollbar);
    for (let scrollbar of document.querySelectorAll(".v-scrollbar"))
        repaintScrollbar(scrollbar, false);
}

function between(min, max, value) {
    return Math.max(Math.min(max, value), min);
}


class Editor {
    _caret;
    _hangulCaret;
    _focused_line;
    _lines = [];
    _selected = [];
    _selected_lines = [];
    _lastKey = undefined;

    get focused_line() {
        return this._focused_line;
    };
    set focused_line(val) {
        if (this._focused_line && this._focused_line.previousElementSibling) this._focused_line.previousElementSibling.classList.remove('focused');
        if (val && val.previousElementSibling) val.previousElementSibling.classList.add('focused');
        this._focused_line = val;
    };

    clear = function () {
        let container = this.get();
        while (container.firstChild) container.lastChild.remove();
    };
    save = () => {
        console.log("text save imsi");
    };
    get = function () {
        return document.querySelector(".subTab__contents");
    };
    getCaret = function () {
        return (
            this._caret ||
            (() => {
                let c = (this._caret = document.createElement("span"));
                c.classList.add("caret");
                return c;
            })()
        );
    };
    getHangulCaret = function () {
        return (
            this._hangulCaret ||
            (() => {
                let c = this.getCaret();
                let hc = (this._hangulCaret = document.createElement("span"));
                hc.classList.add("hangulCaret");
                c.before(hc);
                return hc;
            })()
        );
    };
    removeCaret = function () {
        if (this._caret == undefined) return;
        this._caret.remove();
        this._caret = undefined;
    };
    removeHanguleCaret = function (removeText = false) {
        if (this._hangulCaret == undefined) return;
        if (!removeText && this._hangulCaret.childNodes.length > 0) {
            this._hangulCaret.before(this._hangulCaret.lastChild);
        }
        this._hangulCaret.remove();
        this._hangulCaret = undefined;
        hangul_typing = [];
    };
    removeSelected = function (c = this.getCaret()) {
        for (let l of this._selected) {
            for (let char of l) {
                char.remove();
            }
        }
        let s_line = this._selected_lines.shift();
        let e_line = this._selected_lines.pop();
        if (s_line != e_line && s_line) {
            this.focus(s_line);
            if (e_line) {
                for (let node of e_line.childNodes) s_line.append(node);
                for (let l of this._selected_lines) {
                    l.previousElementSibling.remove();
                    l.remove();
                }
                e_line.previousElementSibling.remove();
                e_line.remove();
            }
        }
        this._selected = [];
        this._selected_lines = [];
    }
    focus = function (new_target) {
        if (new_target == undefined) return;
        if (new_target.classList.contains("line")) {
            this.focused_line = new_target;
            new_target.appendChild(this.getCaret());
        } else if (new_target.classList.contains("caret")) {
            console.log(new_target.parentNode);
            this.focused_line = new_target.parentNode;
        }
    };
    blur = function () {
        this.removeHanguleCaret();
        this.removeCaret();
        this.focused_line = undefined;
        this.deselect();
    };

    newLine = function (bool = this.get().childNodes.length < 2) {
        let line_number = document.createElement("div");
        line_number.classList.add("line_number");
        if (bool || this.focused_line == undefined) this.get().append(line_number);
        else this.focused_line.after(line_number);
        let line = document.createElement("div");
        line.classList.add("line");
        line_number.after(line);
        this.focus(line);
        return line;
    };
    copy = function () {
        if (this._selected.length < 1) return;
        let txt2 = "";
        let last_l = this._selected.pop();
        for (let l of this._selected) {
            for (let c of l) txt2 += c.innerText;
            txt2 += '\n';
        }
        for (let c of last_l) txt2 += c.innerText;
        navigator.clipboard
            .writeText(txt2);
    };
    cut = function (c = this.getCaret()) {
        if (this._selected.length < 1) return;
        let txt = "";
        let last_l = this._selected.pop();
        for (let l of this._selected) {
            for (let c of l) {
                txt += c.innerText;
                c.remove();
            }
            txt += '\n';
        }
        for (let c of last_l) {
            txt += c.innerText;
            c.remove();
        }
        let s_line = this._selected_lines.shift();
        let e_line = this._selected_lines.pop();
        if (s_line != e_line && s_line) {
            s_line.append(c);
            if (e_line) {
                for (let node of e_line.childNodes) s_line.append(node);
                for (let l of this._selected_lines) {
                    l.previousElementSibling.remove();
                    l.remove();
                }
                e_line.previousElementSibling.remove();
                e_line.remove();
            }
        }
        this._selected = [];
        this._selected_lines = [];
        navigator.clipboard
            .writeText(txt);
    };
    backspace = function (c = this.getCaret()) {
        if (this._selected.length > 0) this.removeSelected(c);
        else {
            if (c.previousSibling) {
                c.previousSibling.remove();
            } else if (this.get().children.length > 2) {
                this.focused_line.previousElementSibling.remove();
                let last_char = this.focused_line.previousElementSibling.lastChild;
                for (let char of Array.from(this.focused_line.childNodes))
                    this.focused_line.previousElementSibling.appendChild(char);
                this.focus(this.focused_line.previousElementSibling);
                this.focused_line.remove();
                if (last_char) last_char.after(c);
            }
        }
    };
    paste = function (c = this.getCaret()) {
        if (this._selected.length > 0) this.removeSelected(c);
        let pos = c.previousSibling || c.parentNode;
        let _this = this;
        navigator.clipboard
            .readText()
            .then(
                (clipText) => {
                    c = _this.getCaret();
                    pos.nodeType == 3 || !pos.classList.contains('line') ? pos.after(c) : pos.prepend(c);
                    _this.focus(c);
                    _this.get().focus();
                    _this.loadText(clipText, c);
                },
            )
            .catch(console.log)
            .finally(console.log);

    };
    loadText = (text, c) => {
        let lines = text.split('\n');
        let last_line = lines.pop();
        for (let line_num in lines) {
            for (let char of lines[line_num].split('')) this._caret.before(document.createTextNode(char));
            this.newLine(c == undefined);
        }
        for (let char of last_line.split('')) this._caret.before(document.createTextNode(char));
    }
    onkeydown = function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
        if (ctrlKey || altKey || metaKey) {
            //단축키 를 이용하는 경우
            event.preventDefault();

            let c = this.getCaret();

            if (ctrlKey) {
                switch (key.toLowerCase()) {
                    case "a":
                        this.deselect();
                        let lines = Array.from(this.get().querySelectorAll('.line'));
                        let first_line = lines.shift();
                        let last_line = lines.pop() || first_line;
                        if (first_line) this.select(first_line.firstChild || first_line, last_line.lastChild || last_line);
                        break;
                    case "x":
                        this.cut(c);
                        break;
                    case "c":
                        this.copy();
                        break;
                    case "v":
                        this.paste();
                        break;
                    case "s":
                        this.save();
                        break;
                    case "f5":
                        location.reload();
                        break;
                }
            }
        } else if (key.length < 2) {
            //글자 입력인 경우
            let c = this.getCaret();
            this.removeSelected(c);
            let hanguel_i;
            if (!app.hangulMode || (hanguel_i = hangul[key]) == undefined) {
                this.removeHanguleCaret();
                c.before(document.createTextNode(key));
            } else {
                if (hangul_typing[0] == undefined) {
                    hangul_typing[0] = hanguel_i;
                    this.getHangulCaret().innerText = hanguel_i;
                } else if (hangul_typing[1] == undefined) {
                    if (isMoeum(hanguel_i)) {
                        if (isMoeum(hangul_typing[0])) {
                            if (
                                hangul_moeum_combine[hangul_typing[0]] &&
                                hangul_moeum_combine[hangul_typing[0]][hanguel_i]
                            ) {
                                this.getHangulCaret().before(
                                    document.createTextNode(
                                        hangul_moeum_combine[hangul_typing[0]][hanguel_i]
                                    )
                                );
                                this.removeHanguleCaret(true);
                                hangul_typing = [];
                            } else {
                                this.getHangulCaret().before(
                                    document.createTextNode(hangul_typing[0])
                                );
                                this.getHangulCaret().innerText = hanguel_i;
                                hangul_typing = [hanguel_i];
                            }
                        } else {
                            hangul_typing[1] = hanguel_i;
                            this.getHangulCaret().innerText = hangulCombine(hangul_typing);
                        }
                    } else if (
                        hangul_jaum_combine[hangul_typing[0]] &&
                        hangul_jaum_combine[hangul_typing[0]][hanguel_i]
                    ) {
                        this
                            .getHangulCaret()
                            .before(
                                document.createTextNode(
                                    hangul_jaum_combine[hangul_typing[0]][hanguel_i]
                                )
                            );
                        this.removeHanguleCaret(true);
                        hangul_typing = [];
                    } else {
                        this
                            .getHangulCaret()
                            .before(document.createTextNode(hangul_typing[0]));
                        this.getHangulCaret().innerText = hanguel_i;
                        hangul_typing = [hanguel_i];
                    }
                } else if (hangul_typing[2] == undefined) {
                    if (isMoeum(hanguel_i)) {
                        if (
                            hangul_moeum_combine[hangul_typing[1]] &&
                            hangul_moeum_combine[hangul_typing[1]][hanguel_i]
                        ) {
                            hangul_typing[1] =
                                hangul_moeum_combine[hangul_typing[1]][hanguel_i];
                            this.getHangulCaret().innerText = hangulCombine(hangul_typing);
                        } else {
                            this
                                .getHangulCaret()
                                .before(document.createTextNode(hangulCombine(hangul_typing)));
                            this.getHangulCaret().innerText = hanguel_i;
                            hangul_typing = [hanguel_i];
                        }
                    } else {
                        hangul_typing[2] = hanguel_i;
                        this.getHangulCaret().innerText = hangulCombine(hangul_typing);
                    }
                } else {
                    if (isMoeum(hanguel_i)) {
                        let new_hangul_typing = [hangul_typing.pop(), hanguel_i];
                        this
                            .getHangulCaret()
                            .before(document.createTextNode(hangulCombine(hangul_typing)));
                        this.getHangulCaret().innerText = hangulCombine(new_hangul_typing);
                        hangul_typing = new_hangul_typing;
                    } else if (
                        hangul_jaum_combine[hangul_typing[2]] &&
                        hangul_jaum_combine[hangul_typing[2]][hanguel_i]
                    ) {
                        hangul_typing[2] = hangul_jaum_combine[hangul_typing[2]][hanguel_i];
                        this
                            .getHangulCaret()
                            .before(
                                document.createTextNode(hangulCombine(hangul_typing))
                            );
                        this.removeHanguleCaret(true);
                        hangul_typing = [];
                    } else {
                        this
                            .getHangulCaret()
                            .before(document.createTextNode(hangulCombine(hangul_typing)));
                        this.getHangulCaret().innerText = hanguel_i;
                        hangul_typing = [hanguel_i];
                    }
                }
            }
        } else {
            let c = this.getCaret();
            this.removeHanguleCaret();
            let focus_letter, focus_line;
            switch (key) {
                case "HangulMode":
                    app.hangulMode = !app.hangulMode;
                    break;
                case "PageDown":
                case "Down":
                case "ArrowDown":
                    if (!shiftKey || this._lastKey != key) this.deselect();
                    focus_line = this.focused_line.next('.line');
                    if (focus_line == undefined && c.nextSibling == undefined) break;
                    if (focus_line) {
                        if (focus_line.lastChild) focus_letter = focus_line.childNodes[getNodeIndex(c).i1] || focus_line.firstChild;
                    } else focus_line = this.focused_line;

                    let pos1 = c.nextSibling || focus_line.firstChild || focus_line;
                    focus_letter ? focus_letter.after(c) : focus_line.append(c);
                    let pos2 = c.previousSibling || this.focused_line.lastChild || this.focused_line;
                    this.focus(c);

                    if (shiftKey) this.select(pos1, pos2);
                    break;
                case "PageUp":
                case "Up":
                case "ArrowUp":
                    if (!shiftKey || this._lastKey != key) this.deselect();
                    focus_line = this.focused_line.prev('.line');
                    if (focus_line == undefined && c.previousSibling == undefined) break;
                    if (focus_line) {
                        if (focus_line.firstChild) focus_letter = focus_line.childNodes[getNodeIndex(c).i1 + 1];
                    } else {
                        focus_line = this.focused_line;
                        focus_letter = focused_line.firstChild;
                    }

                    let pos3 = c.previousSibling || focus_line.lastChild || focus_line;
                    focus_letter ? focus_letter.before(c) : focus_line.append(c);
                    let pos4 = c.nextSibling || this.focused_line.firstChild || this.focused_line;
                    this.focus(c);

                    if (shiftKey) this.select(pos3, pos4);
                    break;
                case "Left":
                case "ArrowLeft":
                    if (!shiftKey || this._lastKey != key) this.deselect();
                    if (c.previousSibling) {
                        if (shiftKey) this.select(c.previousSibling, c.previousSibling);
                        c.previousSibling.before(c);
                    }
                    break;
                case "Right":
                case "ArrowRight":
                    if (!shiftKey || this._lastKey != key) this.deselect();
                    if (c.nextSibling) {
                        if (shiftKey) this.select(c.nextSibling, c.nextSibling);
                        c.nextSibling.after(c);
                    }
                    break;
                case "Home":
                    this.deselect();
                    if (this.focused_line && this.focused_line.firstChild != c) {
                        if (shiftKey) this.select(this.focused_line.firstChild, c);
                        this.focused_line.firstChild.before(c);
                    }
                    break;
                case "End":
                    this.deselect();
                    if (this.focused_line && this.focused_line.lastChild != c) {
                        if (shiftKey) this.select(this.focused_line.lastChild, c.nextSibling);
                        this.focused_line.lastChild.after(c);
                    }
                    break;
                case "Enter":
                    let ns = c.nextSibling;
                    let nl = this.newLine(false);
                    let temp;
                    this.removeSelected(c);
                    this.focus(nl);
                    while ((temp = ns)) {
                        ns = ns.nextSibling;
                        nl.appendChild(temp);
                    }
                    break;
                case "Delete":
                case "Backspace":
                    this.backspace(c);
                    break;
            }
        }

        if (key != 'Shift') this._lastKey = key;

        repaintScrollbar(document.querySelector('.h-scrollbar[target=".subTab__contents"]'));
        repaintScrollbar(document.querySelector('.v-scrollbar[target=".subTab__contents"]'), false);
    };
    onkeyup = function ({ keyCode }) { };
    onmouseup = function (e) {
        this.get().focus();
    };
    onmousedown = function (e_down) {
        e_down.preventDefault();
        if (this.get().children.length < 1) return this.newLine(true);

        this.blur();

        let anchor_first,
            anchor_last,
            focus,
            focusIsFirst,
            container = this.get();
        anchor_first = getTargetLetter(e_down, true);
        anchor_last = getTargetLetter(e_down);

        container.onmousemove = (e_move) => {
            e_move.preventDefault();
            focusIsFirst =
                Math.abs(e_down.screenY - e_move.screenY) < 22
                    ? e_down.screenX > e_move.screenX
                    : e_down.screenY > e_move.screenY;

            focus = getTargetLetter(e_move, focusIsFirst);

            this.deselect();
            this.select(focusIsFirst ? anchor_last : anchor_first, focus);
        };

        window.onmouseup = (e_up) => {
            e_up.preventDefault();
            let sel = Array.from(document.querySelectorAll(".sel"));
            window.onmouseup = undefined;
            container.onmousemove = undefined;
            let c = this.getCaret();
            if (sel.length < 1) {
                focus = focus || anchor_first || anchor_last || this.get().lastChild;
                if (focus.nodeType == 3 || focus.classList.contains('sel')) {
                    focus.before(c);
                } else (focus.closest('.line') || this.get().lastChild).append(c);
            } else {
                if (focusIsFirst) sel.shift().before(c);
                else sel.pop().after(c);
            }
            this.focus(c);
        };

        function getTargetLetter(e, isFirst = false) {
            let line = e.target;
            switch (line.classList[0]) {
                case "subTab__contents":
                    line =
                        container.lastElementChild.lastChild || container.lastElementChild;
                    break;
                case "line_number":
                    line = isFirst
                        ? line.nextElementSibling
                        : line.previousElementSibling;
                    break;
            }
            let result = getClickedTextNode(line, e) || line.lastChild || line;
            return result.nodeType != 3 && result.classList.contains("sel")
                ? result.lastChild
                : result;
        }
    };

    select = function (anchor_node, focus_node) {
        let anchor_index = getNodeIndex(anchor_node);
        let focus_index = getNodeIndex(focus_node);
        let temp;
        let focusFirst = false;
        if (
            anchor_index.i2 > focus_index.i2 ||
            (anchor_index.i2 == focus_index.i2 && anchor_index.i1 > focus_index.i1)
        ) {
            temp = anchor_index;
            anchor_index = focus_index;
            focus_index = temp;
            focusFirst = true;
        }
        let lines = this.get().childNodes;
        let i = anchor_index.i2;
        if (anchor_index.i2 == focus_index.i2) {
            selLine(this, lines[i], anchor_index.i1, focus_index.i1);
        } else {
            selLine(this, lines[i], anchor_index.i1);
            while (i < focus_index.i2 - 1) {
                i++;
                selLine(this, lines[i]);
            }
            selLine(this, lines[focus_index.i2], 0, focus_index.i1);
        }
        return focusFirst;


        function selLine(_this, line, s_index = 0, e_index = line.childNodes.length - 1) {
            if (line.classList.contains('line_number')) return;
            let line_data = [];
            for (let node of Array.from(line.childNodes).slice(
                s_index,
                e_index + 1
            )) {
                let span = document.createElement("span");
                span.classList.add("sel");
                node.before(span);
                span.append(node);

                if (node.nodeValue === ' ') span.classList.add('empty');
                line_data.push(span);
            }
            _this._selected_lines.push(line);
            _this._selected.push(line_data);
        }
    };

    deselect = function () {
        for (let sel_line of this._selected) {
            for (let sel_span of sel_line) {
                if (sel_span.lastChild) sel_span.before(sel_span.lastChild);
                sel_span.remove();
            }
        }
        this._selected = [];
        this._selected_lines = [];
    };
}

let editor = new Editor();

function getClickedTextNode(element, event, callback = false) {
    let result;
    let range =
        getClickedTextNode.range ||
        (getClickedTextNode.range = document.createRange());
    for (let node of element.childNodes) {
        if (
            (result =
                node.nodeType === 3 ? compare(node) : getClickedTextNode(node, event))
        ) {
            if (callback !== false) callback(result);
            return result;
        }
    }

    function compare(node) {
        range.selectNodeContents(node);
        let { left, right } = range.getBoundingClientRect();
        return event.pageX >= left && event.pageX <= right ? node : undefined;
    }
}

function getNodeIndex(node) {
    let i1, i2;
    if (node.nodeType === 3) {
        i1 = Array.from(node.parentNode.childNodes).indexOf(node);
        i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
            node.parentNode
        );
    } else if (node.classList.contains("caret")) {
        if (node.previousSibling) {
            node = node.previousSibling;
            i1 = Array.from(node.parentNode.childNodes).indexOf(node);
            i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
                node.parentNode
            );
        } else {
            i1 = -1;
            i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
                node.parentNode
            );
        }
    } else {
        i1 = -1;
        i2 = Array.from(node.parentNode.childNodes).indexOf(node);
    }
    return { i1, i2 };
}

async function loadSample() {
    const response = await fetch("/editor/ui.js");
    return await response.text();
}

String.prototype.indexOfDefault = function (search, falseValue = -1, fromIndex = 0) {
    let i = this.indexOf(search, fromIndex);
    return i > -1 ? i + search.length : falseValue;
}
String.prototype.searchDefault = function (search, falseValue = -1, fromIndex = 0) {
    let i = this.search(search, fromIndex);
    return i > -1 ? i : falseValue;
}

async function sample() {
    let text = await loadSample();
    let result = document.createElement('code');
    let line = editor.newLine();
    let temp;
    try {

        while (text != null && text.length > 0) {
            if (text.startsWith('/*')) {
                temp = text.indexOfDefault('*/', text.length);
                String2html(text.substring(0, temp), 'c_0');
                text = text.substring(temp);
            } else if (text.startsWith('//')) {
                temp = text.indexOfDefault('\n', text.length);
                String2html(text.substring(0, temp), 'c_1');
                text = text.substring(temp);
            } else if (text[0] == "\"") {
                temp = text.searchDefault(/[^\\](\\{2})*\"/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_0');
                text = text.substring(temp);
            } else if (text[0] == "\'") {
                temp = text.searchDefault(/[^\\](\\{2})*\'/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_1');
                text = text.substring(temp);
            } else if (text[0] == "\`") {
                temp = text.searchDefault(/[^\\](\\{2})*\`/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_2');
                text = text.substring(temp);
            } else if (/\s/.test(text[0])) {
                temp = text.search(/\S/);//index 0 : 버림칸, 1 : 공백문자열
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp));
                text = text.substring(temp);
            } else if (/[\[\{\(\)\}\]]/.test(text[0])) {
                String2html(text[0], 'b_0');
                text = text.substring(1);
            } else if (/[.,;:]/.test(text[0])) {
                String2html(text[0], 'e_0');
                text = text.substring(1);
            } else if (/[0-9]/.test(text[0])) {
                temp = text.search(/[^0-9]/);
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp), 'd_0');
                text = text.substring(temp);
            } else if(/[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/.test(text[0])) {
                temp = text.search(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/);
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp), 't_0');
                text = text.substring(temp);
            } else {
                String2html(text[0], 'etc');
                text = text.substring(1);
            }
        }
    } catch {
        console.log(text);
    }
    function String2html(string, className = false) {
        for (let char of string) {
            switch (char) {
                case '\n':
                    line = editor.newLine();
                    break;
                case '\r':
                    break;
                default:
                    if (className === false) {
                        line.append(document.createTextNode(char));
                    } else {
                        line.append(document.createElement('span'));
                        line.lastChild.classList.add(className);
                        line.lastChild.innerText = char;
                    }
                    break;
            }
        }
    }
}
