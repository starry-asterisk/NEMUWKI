let app;
let files;
let scrollEventManager;
let editor;
let global_range;
let fileDB;

const suggestions = [
    '테스트 입니다',
    '테스트입니다',
    '스 트입 니다'
]

window.onload = () => {
    app = new Vue({
        el: ".bodyContainer",
        updated: () => {
            repaintScrollbarVisible();
        },
        data: {
            keyword: '',
            hide: {
                nav_menu: false,
                account: false,
                setting: false,
            },
            files,
            tabs: [],
            onTab: undefined,
            hangulMode: false
        },
        methods: {
            file_prop_factory: function (instance, padding) {
                return {
                    id: instance.id,
                    name: instance.name,
                    kind: instance.kind,
                    type: instance.type,
                    children: instance.children,
                    state: instance.state,
                    padding
                };
            },
            drag: function (e, id) {
                e.dataTransfer.setData("file", id);
                e.dataTransfer.setDragImage(e.target, e.offsetX, e.offsetY);
            },
            dragover: function (e) {
                e.preventDefault();
                e.target.closest('.aside_folder').classList.add('dragover');
            },
            dragleave: function (e) {
                e.target.closest('.aside_folder').classList.remove('dragover');
            },
            drop: function (e, id) {
                e.stopPropagation();
                e.target.closest('.aside_folder').classList.remove('dragover');
                let find_folder = this.files.find(id);
                let find_file = this.files.find(e.dataTransfer.getData("file"));
                if(invalidMovePath(find_file, find_folder)) return dev('warn','same directory');
                let scope = this.files;
                let target = find_file.path.pop();
                find_file.path.shift();
                for (let pathName of find_file.path) {
                    scope = scope.children.find(file => file.name == pathName);
                }
                scope.children = scope.children.filter(file => file.name != target);
                find_folder.node.children.push(find_file.node);
            },
            search: function (keyword) {
                return suggestions.filter(str => str.replaceAll(' ', '').indexOf(keyword) > -1);
            },
            addTab: function (TabClass) {
                let tab = new TabClass(this);
                this.tabs.push(tab);
            },
            changeTab: function (tab) {
                this.onTab = (tab == this.onTab) ? undefined : tab;
            },
            hideTab: function (tab, bool) {
                this.onTab = bool ? (tab == this.onTab ? undefined : this.onTab) : tab;
                tab._hide = bool;
            },
            changeSubTab: async function (subTab) {
                editor.clear();
                this.onTab._onSubTab = subTab;
                editor.loadFile(subTab.file);
            }
        },
    });
    app.addTab(TextEditorTab);
    app.addTab(FinderTab);
    app.addTab(GameTab);

    scrollEventManager = new ScrollEventManager();

    window.addEventListener("resize", function () {
        repaintScrollbarVisible();
    });

    editor = new Editor();

    fileDB = new FileDB();

    window.onkeydown = ({ ctrlKey, key }) => {
        if (ctrlKey) document.body.setAttribute('ctrlKey', ctrlKey);
        switch (key.toLowerCase()) {
            case 'b':
                if (ctrlKey) app.changeTab(undefined);
                break;
        }
    }

    window.onkeyup = ({ ctrlKey }) => {
        if (!ctrlKey) document.body.removeAttribute('ctrlKey');
    }

    document.addEventListener('contextmenu', contextMenuHandler);

    loadOverlay.remove();
};

class Editor {
    lines = [];
    _caret;
    _container;
    _selected;
    _selectionContainer;
    _mime;
    _mime_sub;
    get mimeType() {
        return `${this._mime}/${this._mime_sub}`;
    }
    set mimeType(v) {
        [this._mime, this._mime_sub] = v.split('/');
        this.container.setAttribute('mime', this._mime);
        this.container.setAttribute('mime-sub', this._mime_sub);
    }
    get hangulMode() {
        return app.hangulMode;
    }
    set hangulMode(v) {
        app.hangulMode = v;
    }
    get caret() {
        if (this._caret == undefined) {
            this._caret = document.createElement('span');
            this._caret.classList.add('caret');
            this.container.append(this._caret);
        }
        return this._caret;
    }
    set caret(val) {
        if (this._caret) this._caret.remove();
        this._caret = val;
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
        if (this._selectionContainer == undefined) {
            this._selectionContainer = document.createElement('div');
            this._selectionContainer.classList.add('selectionContainer');
            this.container.append(this._selectionContainer);
        }
        this._selectionContainer.empty();
        if (this._selected.startNode == undefined) {
            this.caret = undefined;
            return;
        }

        this.container.style.setProperty('--scrollTop', `${this.container.scrollTop}px`);
        this.container.style.setProperty('--scrollLeft', `${this.container.scrollLeft}px`);

        let c_rect = this.containerRect;
        if (startRect == undefined) this._selected.startRect = startRect = getRelativeRect(c_rect, getLetterRect(startNode, startPos));
        if (endRect == undefined) this._selected.endRect = endRect = getRelativeRect(c_rect, getLetterRect(endNode, endPos));

        (rect => this.caret.setStyles({
            left: `${rect.left + this.container.scrollLeft}px`,
            top: `${rect.top + this.container.scrollTop}px`
        }))(direction ? endRect : startRect);

        let sline = startNode.parentNode.closest('.line');
        let eline = endNode.parentNode.closest('.line');

        let old_caret_on_line = this.container.querySelector('.line_number.focused');
        if (old_caret_on_line) old_caret_on_line.classList.remove('focused');
        (direction ? eline : sline).prev('.line_number').classList.add('focused');

        this.caret.scrollIntoViewIfNeeded();

        const fragment = document.createDocumentFragment();

        const create = (x, y, w, h) => fragment.append(
            document.createElement('span').setStyles({ top: `${y}px`, left: `${x}px`, height: `${h}px`, width: `${w}px` })
        );
        if (sline == eline) {
            create(startRect.x, startRect.y, endRect.x - startRect.x, startRect.height);
        } else {
            const create2 = (processor) => {
                processor(getRelativeRect(c_rect, getLetterRect(sline, 0, sline.childNodes.length)));
                sline = sline.next('.line');
            }

            create2(l_rect => create(startRect.x, l_rect.y, l_rect.right - startRect.x, l_rect.height));

            while (sline != undefined && sline != eline) create2(l_rect => create(l_rect.x, l_rect.y, l_rect.width, l_rect.height));

            create2(l_rect => create(l_rect.x, l_rect.y, endRect.left - l_rect.x, l_rect.height));
        }

        this._selectionContainer.append(fragment);
    }
    clear = function () {
        let container = this.container;
        while (container.firstChild) container.lastChild.remove();
        this.lines = [];
        this.deselect();
        this._selectionContainer = undefined;
    };
    save = () => {
        console.log("text save imsi");
    };
    blur = function () {
        this.deselect();
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

        this.selected = {
            startNode: compared ? start.relative.node : end.relative.node,
            startRect: compared ? s_rect : e_rect,
            startPos: compared ? start.relative.pos : end.relative.pos,
            endNode: compared ? end.relative.node : start.relative.node,
            endRect: compared ? e_rect : s_rect,
            endPos: compared ? end.relative.pos : start.relative.pos,
            direction: compared
        };
    }

    addLine = function (target) {
        let line_number = document.createElement("span");
        line_number.classList.add("line_number");
        if (target) target.after(line_number);
        else this.container.append(line_number);
        let line = document.createElement("div");
        line.classList.add("line");
        line_number.after(line);
        if (target) this.lines.splice(this.lines.indexOf(target) + 1, 0, line);
        else this.lines.push(line);
        line.append(document.createTextNode("\n"));//텍스트 복사할때 줄 바꿈 반영을 위해서 추가함
        return line;
    };
    delLine = function (v) {
        this.lines = this.lines.filter(line => line != v);
        v.prev('.line_number').remove();
        v.remove();
    };
    delLineByIndex = function (sindex, eindex) {
        let deleted = this.lines.splice(sindex, eindex - sindex);
        let text_arr = [];
        for (let l of deleted) {
            text_arr.push(l.textContent);
            l.prev('.line_number').remove();
            l.remove();
        }
        return text_arr.join('\n')
    }
    delSelect = function (v) {
        let { startNode, endNode, startPos, endPos } = v || this.selected;

        let sline = startNode.parentNode.closest('.line');
        let eline = endNode.parentNode.closest('.line');

        let text = '';

        let final = {
            node: endNode,
            pos: 0,
        }

        if (sline == eline) text += deleteText(startNode, startPos, endNode, endPos);
        else {
            let tline_index = this.lines.indexOf(sline.next('.line'));
            let eline_index = this.lines.indexOf(eline);
            text += deleteText(startNode, startPos, sline.lastChild, 1);
            text += '\n' + this.delLineByIndex(tline_index, eline_index);
            text += '\n' + deleteText(eline.firstChild, 0, endNode, endPos);
            for (let node of Array.from(eline.childNodes)) sline.append(node);
            this.delLine(eline);
        }
        if (endNode == startNode) {
            final.node = startNode;
            final.pos = startPos;
        }

        this.selected = {
            startNode: final.node,
            startPos: final.pos,
            endNode: final.node,
            endPos: final.pos
        };

        return text;
    };

    loadFile = async file => {
        this.clear();
        this.mimeType = file.type || 'text/etc';
        switch (this._mime) {
            default:
            case 'text':
            case 'md':
            case 'file':
                this.loadText(await file.text());
                break;
            case 'image':
                if (this._mime_sub == 'svg+xml') {
                    this.loadText(await file.text());
                    break;
                }
                this.loadImage(file);
                break;
            case 'video':
                this.loadVideo(file);
                break;
            case 'audio':
                this.loadAudio(file);
                break;
        }
        this.redrawScroll();
    }

    loadText = (text, line = this.addLine(), tailText = '') => {
        let node, lines = text.replaceAll('\r', '').split('\n');
        line.lastChild.before(node = document.createTextNode(lines.shift()));
        for (let lineText of lines) {
            line = this.addLine(line);
            line.lastChild.before(node = document.createTextNode(lineText));
        }
        let pos = node.nodeValue.length;
        node.nodeValue += tailText;
        return shiftLetterPos(node, 0, pos);
    }

    loadVideo = (blob) => {
        var url = URL.createObjectURL(blob);
        const vid = document.createElement('video');
        vid.src = url;
        vid.setAttribute('controls', '');
        this.container.append(vid);
        vid.play();
    }

    loadAudio = (blob) => {
        var url = URL.createObjectURL(blob);
        const audio = document.createElement('audio');
        audio.src = url;
        audio.setAttribute('controls', '');
        this.container.append(audio);
    }

    loadImage = (blob) => {
        var url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            URL.revokeObjectURL(this.src);

            let { height, width } = img;

            let rect = this.containerRect;
            let w_ratio = rect.width / width,
                h_ratio = rect.height / height;
            let ratio = Math.min(w_ratio, h_ratio, 2);

            img.width = width * ratio;

            img.onmousedown = e => {
                e.preventDefault();
                if (e.button > 0) return;
                ratio = ratio + (e.ctrlKey ? (-0.1) : 0.1);
                let rect = this.containerRect;
                let { scrollHeight, scrollWidth, scrollTop, scrollLeft } = this.container;
                img.width = width * ratio;
                img.setStyles({
                    'min-width': `${width * ratio}px`,
                    'max-width': `${width * ratio}px`
                });
                this.redrawScroll();
                if (rect.height >= scrollHeight) this.container.scrollTop = (this.container.scrollHeight - rect.height) / 2;
                else this.container.scrollTop = scrollTop / (scrollHeight - rect.height) * (this.container.scrollHeight - rect.height);
                if (rect.width >= scrollWidth) this.container.scrollTop = (this.container.scrollWidth - rect.width) / 2;
                else this.container.scrollLeft = scrollLeft / (scrollWidth - rect.width) * (this.container.scrollWidth - rect.width);
            }
        }
        this.container.append(img);
    }

    redrawScroll = () => {
        repaintScrollbar(document.querySelector('.h-scrollbar[target=".subTab__contents"]'));
        repaintScrollbar(document.querySelector('.v-scrollbar[target=".subTab__contents"]'), false);
    }

    onkeydown = function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
        if (this._mime != 'text') return;
        let selection = this.selected, line, new_selection, temp;
        if (ctrlKey || altKey || metaKey) {
            //단축키 를 이용하는 경우
            event.preventDefault();

            if (ctrlKey) {
                switch (key.toLowerCase()) {
                    case "a":
                        let s = getNodeByAbsPos(this.lines[0], 0);
                        let e = getNodeByAbsPos(this.lines[this.lines.length - 1], this.lines[this.lines.length - 1].innerText.length - 1);
                        this.selected = {
                            startNode: s.node,
                            startPos: s.pos,
                            endNode: e.node,
                            endPos: s.pos,
                            direction: true
                        }
                        this.redrawScroll();
                        break;
                    case "x":
                        navigator.clipboard.writeText(this.delSelect());
                        this.redrawScroll();
                        break;
                    case "c":
                        temp = getRange();
                        temp.setStart(this.selected.startNode, this.selected.startPos);
                        temp.setEnd(this.selected.endNode, this.selected.endPos);
                        navigator.clipboard.writeText(temp.toString());
                        this.redrawScroll();
                        break;
                    case "v":
                        this.delSelect();
                        navigator.clipboard
                            .readText()
                            .then((clipText) => {
                                line = this.selected.startNode.parentNode.closest('.line');

                                let posInfo = this.loadText(clipText, line, this.delSelect({
                                    startNode: this.selected.startNode,
                                    startPos: this.selected.startPos,
                                    endNode: line.lastChild,
                                    endPos: 0
                                }));

                                this.selected = {
                                    startNode: posInfo.node,
                                    startPos: posInfo.pos,
                                    endNode: posInfo.node,
                                    endPos: posInfo.pos
                                };

                                this.redrawScroll();
                            });
                        break;
                    case "f":
                        //finder 로직
                        if (shiftKey) {
                            //global finder
                        } else {

                        }
                        break;
                    case "s":
                        this.save();
                        this.redrawScroll();
                        break;
                    case "f5":
                        location.reload();
                        this.redrawScroll();
                        break;
                }
            }
            return;
        }
        if (key.length < 2) {
            //글자 입력인 경우
            this.delSelect();
            inputText.call(this, key, this.hangulMode);
        } else {
            switch (key) {
                case "Tab":
                    event.preventDefault();
                    inputText.call(this, '     ', this.hangulMode);
                    break;
                case "HangulMode":
                    this.hangulMode = !this.hangulMode;
                    break;
                case "PageDown":
                case "Down":
                case "ArrowDown":
                    line = this.selected.endNode.parentNode.closest('.line');
                    move(getNodeByAbsPos(line.next('.line'), getAbsolutePos(this.selected.endNode, this.selected.endPos)), 1);
                    break;
                case "PageUp":
                case "Up":
                case "ArrowUp":
                    line = this.selected.startNode.parentNode.closest('.line');
                    move(getNodeByAbsPos(line.prev('.line'), getAbsolutePos(this.selected.startNode, this.selected.startPos)), -1);
                    break;
                case "Left":
                case "ArrowLeft":
                    move(shiftLetterPos(this.selected.startNode, this.selected.startPos, -1), -1);
                    break;
                case "Right":
                case "ArrowRight":
                    move(shiftLetterPos(this.selected.endNode, this.selected.endPos, 1), 1);
                    break;
                case "Home":
                    line = this.selected.startNode.parentNode.closest('.line');
                    move(getNodeByAbsPos(line, 0), -1);
                    break;
                case "End":
                    line = this.selected.startNode.parentNode.closest('.line');
                    move(getNodeByAbsPos(line, line.innerText.length - 1), 1);
                    break;
                case "Enter":
                    this.delSelect();
                    line = this.selected.startNode.parentNode.closest('.line');
                    let text = this.delSelect({
                        startNode: this.selected.startNode,
                        startPos: this.selected.startPos,
                        endNode: line.lastChild,
                        endPos: 0
                    })
                    let new_line = this.addLine(line);
                    if (text == '') move({ node: new_line.lastChild, pos: 0 });
                    else {
                        let new_node = document.createTextNode(text);
                        new_line.prepend(new_node);
                        move({ node: new_node, pos: 0 });
                    }
                    break;
                case "Delete":
                case "Backspace":
                    if (this.selected.startNode == this.selected.endNode && this.selected.startPos == this.selected.endPos) {
                        let d = shiftLetterPos(this.selected.startNode, this.selected.startPos, -1);
                        if (d == undefined) break;
                        this.delSelect({
                            ...this.selected,
                            startNode: d.node,
                            startPos: d.pos
                        });
                    }
                    else this.delSelect();
                    break;
            }

            function move(posInfo, expandDirection = 0) {
                if (posInfo == undefined) return;
                new_selection = {
                    startNode: posInfo.node,
                    startPos: posInfo.pos,
                    endNode: posInfo.node,
                    endPos: posInfo.pos
                };
                if (shiftKey) {
                    if (expandDirection > 0) {
                        if (true == selection.direction) {
                            new_selection.startNode = selection.startNode;
                            new_selection.startPos = selection.startPos;
                        } else {
                            new_selection.startNode = selection.endNode;
                            new_selection.startPos = selection.endPos;
                        }
                        new_selection.direction = true;
                    }
                    else if (expandDirection < 0) {
                        if (false == selection.direction) {
                            new_selection.endNode = selection.endNode;
                            new_selection.endPos = selection.endPos;
                        } else {
                            new_selection.endNode = selection.startNode;
                            new_selection.endPos = selection.startPos;
                        }
                        new_selection.direction = false;
                    }
                }
            }

            if (new_selection != undefined) this.selected = new_selection;
        }

        this.redrawScroll();
    };
    onkeyup = function ({ keyCode }) { };
    onmouseup = function (e) {
        this.container.focus();
    };
    onmousedown = function (e_down) {
        if (this._mime != 'text') return;
        e_down.preventDefault();
        if (e_down.which != 1) return;
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
    ondblclick = function ({ target }) {
        if (target.matches('div.line')) {
            let startNode = target.firstChild;
            while (startNode.nodeType != 3 && startNode != undefined) startNode = startNode.firstChild;
            this.selected = {
                startNode: startNode,
                startPos: 0,
                endNode: target.lastChild,
                endPos: 0
            };
        }
    }
}