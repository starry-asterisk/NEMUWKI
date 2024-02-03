HTMLElement.prototype.empty = function () {
    let removed = Array.from(this.childNodes)
    for (let c of removed) {
        c.remove();
    }
    return removed;
}
HTMLElement.prototype.setStyles = function (obj) {
    if (obj == undefined) console.error('Arguments 0 is undefined or null');
    else for (let name in obj) this.style.setProperty(name, obj[name]);
    return this;
}

class Editor2 {
    lines = [];
    focused;
    _caret;
    _hangulCaret;
    _container;
    _selected;
    _selectionContainer;
    get caret() {
        if (this._caret == undefined) {
            this._caret = document.createElement('span');
            this._caret.classList.add('caret');
            this.container.append(this._caret);
        }
        return this._caret;
    }
    get hangulCaret() {
        if (this._hangulCaret == undefined) {
            this._hangulCaret = document.createElement('span');
            this._hangulCaret.classList.add('hangulCaret');
            this.container.append(this._hangulCaret);
        }
        return this._hangulCaret;
    }
    get container() {
        return this._container || (this._container = document.querySelector(".subTab__contents"));
    }
    get containerRect() {
        return this.container.getBoundingClientRect();
    }
    get selected() {
        return this._selected || {
            startNode: undefined,
            endNode: undefined,
            startRect: undefined,
            endRect: undefined,
            startPos: undefined,
            endPos: undefined,
            direction: undefined
        };
    }
    set selected({ startNode, endNode, startRect, endRect, startPos, endPos, direction }) {
        this._selected = { startNode, endNode, startRect, endRect, startPos, endPos, direction };
        if(this._selected.startNode == undefined) return;
        if (this._selectionContainer == undefined) {
            this._selectionContainer = document.createElement('div');
            this._selectionContainer.classList.add('selectionContainer');
            this.container.append(this._selectionContainer);
        }
        this._selectionContainer.empty();

        let sline = startNode.parentNode.closest('.line');
        let eline = endNode.parentNode.closest('.line');
        let c_rect, range;

        const create = (x, y, w, h) => this._selectionContainer.append(
            document.createElement('span').setStyles({ top: `${y}px`, left: `${x}px`, height: `${h}px`, width: `${w}px` })
        );

        if (sline == eline) {
            create(startRect.x, startRect.y, endRect.x - startRect.x, startRect.height);
        } else {
            c_rect = this.containerRect;
            range = getRange();

            const create2 = (processor) => {
                range.setStart(sline, 0);
                range.setEnd(sline, sline.childNodes.length);
                processor(getRelativeRect(c_rect, range.getBoundingClientRect()));
                sline = sline.next('.line');
            }

            create2(l_rect => create(startRect.x, l_rect.y, l_rect.right - startRect.x, l_rect.height));

            while (sline != undefined && sline != eline) create2(l_rect => create(l_rect.x, l_rect.y, l_rect.width, l_rect.height));

            create2(l_rect => create(l_rect.x, l_rect.y, endRect.left - l_rect.x, l_rect.height));
        }
    }
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
    blur = function () {

    }

    deselect = function () {
        this.selected = {};
    };

    select = (start, end, merge = false) => {
        if (merge == false) this.deselect();
        let c_rect = this.containerRect;
        let s_rect = getRelativeRect(c_rect, start.relative.rect);
        let e_rect, compared;
        if (end == undefined) {
            e_rect = s_rect;
            end = start;
            compared = true;
        } else {
            e_rect = getRelativeRect(c_rect, end.relative.rect);
            compared = compareRectPos(e_rect, s_rect);
        }
        this.caret.setStyles({
            left: `${e_rect.left + this.container.scrollLeft}px`,
            top: `${e_rect.top + this.container.scrollTop}px`
        });
        this.selected = {
            startNode: compared ? start.relative.node : end.relative.node,
            startRect: compared ? s_rect : e_rect,
            startPos: compared ? start.relative.pos : end.relative.pos,
            endNode: compared ? end.relative.node : start.relative.node,
            endRect: compared ? e_rect : s_rect,
            endtPos: compared ? end.relative.pos : start.relative.pos,
            direction: compared
        };
    }

    addLine = function () {
        let line_number = document.createElement("span");
        line_number.classList.add("line_number");
        this.container.append(line_number);
        let line = document.createElement("div");
        line.classList.add("line");
        line_number.after(line);
        this.lines.push(line);
        let lastNode = document.createElement("span");
        lastNode.classList.add("lastNode");
        line.append(lastNode);
        return line;
    };
    delLine = function (v) {
        this.lines = this.lines.filter(line => line != v);
        v.prev('.line_number').remove();
        v.remove();
    };
    onkeydown = function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
        if (ctrlKey || altKey || metaKey) {
            //단축키 를 이용하는 경우
            event.preventDefault();

            if (ctrlKey) {
                switch (key.toLowerCase()) {
                    case "a":
                        break;
                    case "x":
                        break;
                    case "c":
                        break;
                    case "v":
                        break;
                    case "s":
                        break;
                    case "f5":
                        location.reload();
                        break;
                }
            }

            return;
        }
        if (key.length < 2) {
            //글자 입력인 경우
            inputText.call(this, key);
        } else {
            switch (key) {
                case "HangulMode":
                    app.hangulMode = !app.hangulMode;
                    break;
                case "PageDown":
                case "Down":
                case "ArrowDown":
                    break;
                case "PageUp":
                case "Up":
                case "ArrowUp":
                    break;
                case "Left":
                case "ArrowLeft":
                    break;
                case "Right":
                case "ArrowRight":
                    break;
                case "Home":
                    break;
                case "End":
                    break;
                case "Enter":
                    break;
                case "Delete":
                case "Backspace":
                    break;
            }
        }

        repaintScrollbar(document.querySelector('.h-scrollbar[target=".subTab__contents"]'));
        repaintScrollbar(document.querySelector('.v-scrollbar[target=".subTab__contents"]'), false);
    };
    onkeyup = function ({ keyCode }) { };
    onmouseup = function (e) {
        this.container.focus();
    };
    onmousedown = function (e_down) {
        e_down.preventDefault();
        this.lines = document.querySelectorAll('.line');//임시 나중에 제거할 것
        let ePos, sPos = getLetterPos(e_down);

        this.select(sPos);

        window.onmousemove = e_move => {
            ePos = getLetterPos(e_move);
            this.select(sPos, ePos);
        }
        window.onmouseup = () => {
            window.onmousemove = window.onmouseup = undefined;
        }
    };
}
let global_range;
editor = new Editor2();

function getLetterPos(e) {
    let r_v = 0;
    let r_v2 = -1;
    let r_n = undefined;
    let r_rect = undefined;
    let isEnd = false;
    let parent = e.target.closest('.line');
    let isOut = false;
    let outDirection = 0;// 0:left, 1: right;
    let l;
    if (parent == undefined) {
        isOut = true;
        for (let line of editor.lines) {
            let p_rect = line.getBoundingClientRect();
            if (p_rect.top <= e.pageY && p_rect.bottom >= e.pageY) {
                parent = line;
                break;
            }
        }
        if (parent == undefined) {
            let c_rect = editor.container.getBoundingClientRect();
            if (c_rect.top >= e.pageY) parent = editor.lines[0];
            else parent = editor.lines[editor.lines.length - 1];
        }
        if (parent == undefined) return false;
    }
    let range =
        global_range ||
        (global_range = document.createRange());
    r_v = compare(parent);
    if (r_v2 < 0) {
        if (isOut && e.pageX <= parent.getBoundingClientRect().left) {
            r_v = r_v2 = 0;
            outDirection = -1;
            r_n = parent.firstChild;
            while (r_n.nodeType !== 3) r_n = r_n.firstChild;
            range.setStart(r_n, 0);
            range.setEnd(r_n, 1);
        }

        if (r_n == undefined) {
            r_v2 = r_v;
            outDirection = 1;
            isOut = true;
            r_n = parent.lastChild;
            while (r_n.nodeType !== 3) r_n = r_n.lastChild;
            range.setStart(r_n, r_n.nodeValue.length - 1);
            range.setEnd(r_n, r_n.nodeValue.length);
        }
        if (r_rect == undefined) {
            r_rect = range.getBoundingClientRect();
        }
    }

    return {
        absolute: {
            pos: r_v,
            node: parent,
            isOut: isOut,
            outDirection: outDirection
        },
        relative: {
            pos: r_v2,
            node: r_n,
            rect: r_rect
        }
    }

    function compare(node) {
        v = 0;
        if (isEnd) return v;
        if (node.nodeType === 3) {
            l = node.nodeValue.length;
            for (let i = 0; i < l; i++) {
                range.setStart(node, i);
                range.setEnd(node, i + 1);
                let rect = range.getBoundingClientRect();
                if (e.pageX >= rect.left && e.pageX <= rect.right) {
                    isEnd = true;
                    r_n = node;
                    r_v2 = i;
                    r_rect = rect;
                    return i;
                }
            }
            return l;
        } else for (let child of node.childNodes) v += compare(child);
        return v;
    }
}

function compareRectPos(rect1, rect2) {
    if (rect1.top > rect2.top) {
        return true;
    } else if (rect1.top == rect2.top) {
        return rect1.left >= rect2.left;
    } else {
        return false;
    }
}

function getRelativeRect(parent, child) {
    return {
        x: child.x - parent.x,
        y: child.y - parent.y,
        top: child.top - parent.top,
        left: child.left - parent.left,
        bottom: child.bottom - parent.top,
        right: child.right - parent.left,
        height: child.height,
        width: child.width
    };
}

function getRange() {
    return global_range ||
        (global_range = document.createRange());
}

function inputText(key) {
    let c = this.caret;
    let hanguel_i;
    let node = editor.selected.startNode;
    if (!app.hangulMode || (hanguel_i = hangul[key]) == undefined) {
        //c.before(document.createTextNode(key));
        node.nodeValue.substring()
    } else {
        inputHangul.call(this, hanguel_i);
    }
}