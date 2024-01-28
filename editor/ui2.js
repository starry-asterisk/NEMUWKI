
class Editor2 {

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

    newLine = function () {
        let line_number = document.createElement("div");
        line_number.classList.add("line_number");
        this.get().append(line_number);
        let line = document.createElement("div");
        line.classList.add("line");
        line_number.after(line);
        return line;
    };
    onkeydown = function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
        if (ctrlKey || altKey || metaKey) {
            //단축키 를 이용하는 경우
            event.preventDefault();

            let c = this.getCaret();

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
        this.get().focus();
    };
    onmousedown = function (e_down) {
        e_down.preventDefault();
        let {
            relative,
            absolute
        } = getLetterPos(e_down);

        console.log('relative : ',relative,'abolute : ',absolute);
    };

    select = function () {
    };

    deselect = function () {
    };
}

editor = new Editor2();


function getLetterPos(e, callback = false) {
    let r_v = 0;
    let r_v2 = 0;
    let r_n = undefined;
    let r_rect = {};
    let isEnd = false;
    let parent = e.target;
    let l;
    while (!parent.classList.contains('line')) {
        parent = parent.parentNode;
        if (parent == undefined) return console.warn('no parent!');
    }
    let range =
        getClickedTextNode.range ||
        (getClickedTextNode.range = document.createRange());

    r_v = compare(parent, 0);

    return {
        absolute: {
            pos: r_v,
            node: parent,
        },
        relative: {
            pos: r_v2,
            node: r_n,
            rect: r_rect
        }
    }

    function compare(node, depth) {
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
        } else for (let child of node.childNodes) v += compare(child, depth + 1);
        return v;
    }
}