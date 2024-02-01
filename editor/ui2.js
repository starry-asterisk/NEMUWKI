HTMLElement.prototype.empty = function(){
    for(let c of this.childNodes){
        c.remove();
    }
}


class Editor2 {
    lines = [];
    focused;
    _selected = {
        _startNode: undefined,
        _endNode: undefined,
    }
    _selectionContainer;
    set selected({startNode, endNode, startRect, endRect}){
        if(this._selectionContainer == undefined) {
            console.log(this);
            this._selectionContainer = document.createElement('div');
            this._selectionContainer.classList.add('selectionContainer');
            this.container.append(this._selectionContainer);
        }
        this._selectionContainer.empty();

        let sline = startNode.parentNode.closest('.line');
        let eline = endNode.parentNode.closest('.line');
        if(sline == eline){
            create.call(this,startRect.x,startRect.y,endRect.x-startRect.x,endRect.height);
        }else{
            /*
        while(sline != eline){
            //create();
        }*/
        }
        function create(x,y,w,h){
            console.log(x,y,w,h);
            let sel = document.createElement('span');
            sel.style.top = y+'px';
            sel.style.left = x+'px';
            sel.style.height = h+'px';
            sel.style.width = w+'px';
            console.log(sel);
            this._selectionContainer.append(sel);
        }
    }
    get selected() {

    }
    _caret;
    get caret() {
        if (this._caret == undefined) {
            this._caret = document.createElement('span');
            this._caret.classList.add('caret');
            this.container.append(this._caret);
        }
        return this._caret;
    }
    get container() {
        return document.querySelector(".subTab__contents");
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
    };

    select = (start, end, merge = false) => {
        /*
        
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
        
        */
        if (merge == false) this.deselect();
        let c_rect = this.container.getBoundingClientRect();
        let s_rect = getRelativeRect(c_rect, start.relative.rect);
        if (end == undefined) {
            if (start.absolute.outDirection > 0) this.caret.style.left = s_rect.right + this.container.scrollLeft + 'px';
            else this.caret.style.left = s_rect.left + this.container.scrollLeft + 'px';
            this.caret.style.top = s_rect.top + this.container.scrollTop + 'px';
            return;
        }
        let e_rect = getRelativeRect(c_rect, end.relative.rect);
        if (end.absolute.outDirection > 0) {
            this.caret.style.left = e_rect.right + this.container.scrollLeft + 'px';
        } else if (e_rect.top > s_rect.top || (e_rect.top == s_rect.top && e_rect.left >= s_rect.left)) {
            this.caret.style.left = e_rect.left + this.container.scrollLeft + 'px';
        } else {
            this.caret.style.left = e_rect.right + this.container.scrollLeft + 'px';
        }
        this.caret.style.top = e_rect.top + this.container.scrollTop + 'px';

        if(compareRectPos(s_rect, e_rect)){
            this.selected = {
                startNode: start.relative.node,
                endNode: end.relative.node,
                startRect: s_rect,
                endRect: e_rect,
            };
        } else {
            this.selected = {
                startNode: end.relative.node,
                endNode: start.relative.node,
                startRect: e_rect,
                endRect: s_rect,
            };
        }

         //본래의 selection 생성방법
         /*
        let range =
        global_range ||
        (global_range = document.createRange());

        
        range.setStart(start.relative.node, start.relative.pos);
        range.setEnd(end.relative.node, end.relative.pos);

        getSelection().removeAllRanges();
        getSelection().addRange(range);*/
    }

    newLine = function () {
        let line_number = document.createElement("div");
        line_number.classList.add("line_number");
        this.container.append(line_number);
        let line = document.createElement("div");
        line.classList.add("line");
        line_number.after(line);
        this.lines.push(line);
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
        } else if (key.length < 2) {
            //글자 입력인 경우
        } else {
            switch (key) {
                case "HangulMode":
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

function getLetterPos(e, callback = false) {
    let r_v = 0;
    let r_v2 = -1;
    let r_n = undefined;
    let r_rect = undefined;
    let isEnd = false;
    let parent = e.target;
    let isOut = false;
    let outDirection = 0;// 0:left, 1: right;
    let l;
    while (!parent.classList.contains('line')) {
        if (parent.parentNode.nodeType !== 1) {
            isOut = true;
            for (let line of editor.lines) {
                let p_rect = line.getBoundingClientRect();
                if (p_rect.top <= e.pageY && p_rect.bottom >= e.pageY) {
                    parent = line;
                    break;
                }
            }
            if (!parent.classList.contains('line')) {
                let c_rect = editor.container.getBoundingClientRect();
                if (c_rect.top >= e.pageY) parent = editor.lines[0];
                else parent = editor.lines[editor.lines.length - 1];
                break;
            }
            if (parent == undefined) return false;
            break;
        } else parent = parent.parentNode;
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

function compareRectPos(rect1, rect2){
    if(rect1.top > rect2.top){
        return true;
    } else if(rect1.top == rect2.top){
        return rect1.left >= rect2.left;
    } else {
        return false;
    }
}

function covertEl2Pos(el, isLastPos){
    let namespace=isLastPos?"lastChild":"firstChild";
    let p = el;
    let r_v, outDirection;
    while(el.nodeType != 3) el = el[namespace];
    if(isLastPos){
        r_v = el.nodeValue.length;
        range.setStart(el, r_v - 1);
        range.setEnd(el, r_v);
        outDirection = 1;
    }else{
        r_v = 0;
        range.setStart(el, 0);
        range.setEnd(el, 1);
        outDirection = -1;
    }
    return {
        absolute: {
            pos: r_v,
            node: p,
            isOut: true,
            outDirection: outDirection
        },
        relative: {
            pos: r_v,
            node: el,
            rect: range.getBoundingClientRect()
        }
    }
}

function getRelativeRect(parent, child){
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