let main__contents;
function drop(e) {
    e.preventDefault();
    let files = e.dataTransfer.files || e.dataTransfer.items;
    if (files.length > 0) return dropfile(files);
    let type = e.dataTransfer.getData('component');
    if (type == undefined || type.startsWith('c_')) return;

    main__contents.append(createComponent(type));
}

function dropfile(files) {
    [...files].forEach((file) => {
        let type = file.type.split('/')[0];
        switch (type) {
            case 'image':
            case 'video':
            case 'audio':
                main__contents.append(createComponent(type, { file }));
                break;
            default:
                console.warn('no support type :', type);
                alert('지원하지 않는 파일형식 이거나 폴더 입니다');
                break;
        }
    });

    /*
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile();
                console.log(`… file[${i}].name = ${file.name}`);
            }
        });
    }*/
}
function dragover(e) {
    e.preventDefault();
}
function dragstart(e) {
    e.dataTransfer.setData("component", e.target.getAttribute('type'));
}

function createComponent(type, option = {}) {

    let id = 'c_' + Math.floor(Math.random() * 1000000).toString(16);
    option.id = id;

    let spec = COMPONENT_SPEC[type];

    let component = createElement('div', { attrs: { class: `component ${type}`, draggable: true, id } });

    let title = createElement('p', { innerHTML: spec.title });
    component.append(title);

    let component__remove_btn = createElement('button', { attrs: { class: 'component__remove_btn mdi mdi-trash-can' } });
    component.append(component__remove_btn);

    component.append(spec.option(option));
    component.append(spec.input(option));

    component.ondragstart = (e) => {
        e.dataTransfer.setData("component", id);
        e.dataTransfer.setDragImage(component, e.offsetX, e.offsetY);
    }

    component.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let _id = e.dataTransfer.getData('component');
        let target;
        let files = e.dataTransfer.files || e.dataTransfer.items;
        if (files.length > 0) return dropfile(files);
        if (_id == undefined) return;
        if (_id.startsWith('c_')) {
            target = document.getElementById(_id);
        } else {
            target = createComponent(_id);
        }
        if (component.getBoundingClientRect().height / 2 < e.offsetY) component.after(target);
        else component.before(target);
    }

    component__remove_btn.onclick = function () {
        component.remove();
    }

    return component;
}

let lastSelection;

const COMPONENT_SPEC = {
    textbox: {
        title: '텍스트 박스',
        option: () => {
            let div = createElement('div', { attrs: { class: 'component__execList' } });
            div.append(textEditorButtonsFrag());
            return div;
        },
        input: () => {
            return createElement('div', {
                attrs: { contenteditable: true, placeholder: '여기에 텍스트를 입력하세요' },
                on: {
                    ondragstart: e => {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    blur: () => {
                        let s = window.getSelection();
                        lastSelection = {
                            anchorNode: s.anchorNode,
                            anchorOffset: s.anchorOffset,
                            focusNode: s.focusNode,
                            focusOffset: s.focusOffset,
                        };
                    },
                    paste: e => {
                        e.preventDefault();
                        document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
                    }
                }
            });
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
    image: {
        title: '이미지',
        option: option => COMPONENT_SPEC.default.option(option),
        input: ({ file }, mediaTytpe = 'image') => {
            let tagName = mediaTytpe == 'image' ? 'img' : mediaTytpe;
            let media, fragment = document.createDocumentFragment();
            let input = createElement('input', { attrs: { type: 'file', accept: `${mediaTytpe}/*` } });
            input.oninput = () => {
                console.log(mediaTytpe, input.files, file);
                if (input.files && input.files[0]) {
                    if (media) media.remove();
                    media = createElement(tagName, { attrs: { controls: mediaTytpe != 'image', src: URL.createObjectURL(input.files[0]) } });
                    input.after(media);
                }
            }
            fragment.append(input);
            if (file) {
                let dataTranster = new DataTransfer();
                dataTranster.items.add(file);
                input.files = dataTranster.files;
                input.oninput();
            }
            return fragment;
        },
        getData: id => {
            let file = document.querySelector(`#${id} input[type="file"]`).files[0];
            if (file) {
                firebase.storage.upload(`${id}/${file.name}`, file);
                return `${id}/${file.name}`;
            }
            else return 'undefined';
        }
    },
    audio: {
        title: '음악',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.image.input(option, 'audio'),
        getData: id => COMPONENT_SPEC.image.getData(id)
    },
    video: {
        title: '영상',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.image.input(option, 'video'),
        getData: id => COMPONENT_SPEC.image.getData(id)
    },
    table: {
        title: '도표',
        option: ({ id }) => {
            let div = createElement('div', { styles: { 'margin-top': '2rem' } });
            let colContainer = createElement('div', { attrs: { class: 'component__option__input col' } });
            let rowContainer = createElement('div', { attrs: { class: 'component__option__input row' } });
            let colcountInput = createElement('input', { attrs: { type: 'number', min: 1 }, value: 3 });
            let rowcountInput = createElement('input', { attrs: { type: 'number', min: 1 }, value: 3 });

            colContainer.append(colcountInput);
            rowContainer.append(rowcountInput);

            div.append(colContainer);
            div.append(document.createTextNode('x'));
            div.append(rowContainer);

            colcountInput.oninput = () => {
                if (colcountInput.value < 1) colcountInput.value = 1;
                document.querySelector(`#${id} editable-table`).colcount = colcountInput.value;
            }

            rowcountInput.oninput = () => {
                if (rowcountInput.value < 1) rowcountInput.value = 1;
                document.querySelector(`#${id} editable-table`).rowcount = rowcountInput.value;
            }

            return div;
        },
        input: () => {
            return createElement('editable-table', { styles: { 'margin-top': '2rem' } });
        },
        getData: id => {
            return {
                rowclount: document.querySelector(`#${id} .component__option__input.row input`).value,
                header: Array.prototype.map.call(document.querySelectorAll(`#${id} editable-table input`), cell => cell.value),
                cells: Array.prototype.map.call(document.querySelectorAll(`#${id} editable-table [contenteditable]`), cell => cell.innerHTML)
            };
        }
    },
    title: {
        title: '소제목',
        option: option => COMPONENT_SPEC.default.option(option),
        input: () => {
            return createElement('div', { attrs: { contenteditable: 'plaintext-only', placeholder: '여기에 텍스트를 입력하세요' } });
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
    seperator: {
        title: '구분선',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: id => COMPONENT_SPEC.default.getData(id)
    },
    summury: {
        title: '개요',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: id => COMPONENT_SPEC.default.getData(id)
    },
    caption: {
        title: '캡션',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: id => COMPONENT_SPEC.default.getData(id)
    },
    quotation: {
        title: '인용',
        option: option => COMPONENT_SPEC.default.option(option),
        input: () => {
            return createElement('div', { attrs: { contenteditable: 'plaintext-only', placeholder: '여기에 텍스트를 입력하세요' } });
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
    default: {
        option: () => {
            return document.createDocumentFragment();
        },
        input: () => {
            return document.createDocumentFragment();
        },
        getData: id => {
            return '';
        }
    }
}

window.addEventListener('load', function () {
    main__contents = document.querySelector('.main__contents');
    main__contents.ondragover = dragover;
    main__contents.ondrop = drop;

    let component_list = document.querySelector('.component_list');
    for (let specname in COMPONENT_SPEC) {
        let spec = COMPONENT_SPEC[specname];
        let li = createElement('li', {
            attrs: {
                type: specname,
                draggable: true
            },
            innerHTML: spec.title
        });
        li.ondragstart = dragstart;
        component_list.append(li);
    }
    let aside_firstChild = document.querySelector('aside > :first-child');
    let html = document.getElementsByTagName('html')[0];
    window.addEventListener('scroll', () => aside_firstChild.style.marginTop = `${html.scrollTop}px`);

    let date = new Date();
    date.setHours(date.getHours() - (date.getTimezoneOffset() / 60));
    upload_datetime.value = date.toISOString().split('.')[0];
});

function addSuggest(data, input) {
    let li = createElement('li', { attrs: { value: data.name } });
    li.onmousedown = () => {
        li.parentNode.previousElementSibling.value = data.name;
    }
    input.querySelector('.input_suggest').append(li);
}

customElements.define('editable-table', class extends HTMLElement {
    _beforeInit = true;
    _rowcount = 0;
    _colcount = 0;
    _headers;
    _rows = [];
    set rowcount(newValue) {
        if (this._beforeInit) {
            let _headers = this._headers = this.getRow();
            for (let i = 0; i < this._colcount; i++) _headers.append(this.getCell({ header: true }));
            this.append(_headers);
        }
        if (newValue > this._rowcount) {
            while (newValue > this._rowcount) {
                let row = this._rows[this._rowcount] = this.getRow();
                for (let i = 0; i < this._colcount; i++) {
                    let cell = this.getCell();
                    cell.style.width = this._headers.children[i].style.width;
                    row.append(cell);
                }
                this.append(row);
                this._rowcount++;
            }
        } else if (newValue < this._rowcount) {
            for (let i = newValue; i < this._rowcount; i++) this._rows[i].remove();
            this._rows.splice(newValue, this._rowcount - newValue);
        }
        this._rowcount = newValue;
    }
    get rowcount() {
        return this._rowcount;
    }
    set colcount(newValue) {
        if (newValue > this._colcount) {
            for (let i = this._colcount; i < newValue; i++) this._headers.append(this.getCell({ header: true }));
            for (let row of this._rows) {
                for (let i = this._colcount; i < newValue; i++) row.append(this.getCell());
            }
        } else if (newValue < this._colcount) {
            for (let i = newValue; i < this._colcount; i++) this._headers.lastChild.remove();
            for (let row of this._rows) {
                for (let i = newValue; i < this._colcount; i++) row.lastChild.remove();
            }
        }
        this._colcount = newValue;
    }
    get colcount() {
        return this._colcount;
    }
    constructor() {
        super();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(
            `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
        );
        this[name.toLowerCase()] = newValue;
    }
    connectedCallback() {
        if (this._beforeInit) {
            this.rowcount = 3;
            this.colcount = 3;
            this._beforeInit = false;
        }
    }
    getCell(option = {}) {
        let { header } = option;
        let cell = createElement('div', { attrs: { class: 'editable-table__cell' } });
        let cellInput;
        if (header) {
            cellInput = createElement('input', {
                attrs: { type: 'number', min: 1, step: 1 },
                value: 20
            });
            cellInput.oninput = () => {
                let v = parseFloat(cellInput.value);
                let idx = Array.prototype.findIndex.call(cell.parentNode.children, node => node == cell);
                cell.style.width = `${v}rem`;
                for (let row of this._rows) row.children[idx].style.width = `${v}rem`;
            }
        } else {
            cellInput = createElement('div', { attrs: { contenteditable: 'plaintext-only' } });
        }
        cell.append(cellInput);
        return cell;
    }
    getRow() {
        return createElement('div', { attrs: { class: 'editable-table__row' } });
    }
});

function submit() {
    if (!validate(main__header__title)) return;
    if (!validate(post_categories)) return;
    if (!validate(post_menu)) return;
    firebase.post.insertOne({
        board_name: main__header__title.value,
        category: post_categories.value,
        title: post_menu.value,
        contents: Array.from(document.getElementsByClassName('component')).map(c => {
            return {
                type: c.classList[1],
                value: COMPONENT_SPEC[c.classList[1]].getData(c.getAttribute('id'))
            };
        }),
        hidden: false,
        use: true,
        timestamp: new Date(upload_datetime.value)
    })
        .then(console.log)
        .error(console.error);
}

function validate(input) {
    if (input.value == undefined || input.value == null || input.value == NaN || input.value == '') input.setCustomValidity('텍스트를 입력해주세요');
    else input.setCustomValidity('');
    return input.checkValidity();
}

function createElement(tagName, option) {
    return createElementPrototype(tagName || 'div', option || {});
}

function createElementPrototype(tagName, {
    styles = {},
    attrs = {},
    on = {},
    value,
    innerHTML
}) {
    let el = document.createElement(tagName);

    for (let namespace in styles) el.style.setProperty(namespace, styles[namespace]);
    for (let namespace in attrs) el.setAttribute(namespace, attrs[namespace]);
    for (let namespace in on) el[`on${namespace}`] = on[namespace];
    console.log(on);
    if (innerHTML) el.innerHTML = innerHTML;
    if (value) el.value = value;

    return el;
}



var commands = [{
    cmd: "backColor",
    icon: "format-color-highlight",
    val: "#00ffff",
    input: "color",
    desc: "글씨에 형광펜 효과를 줍니다."
},
{},
{
    cmd: "bold",
    icon: "format-bold",
    desc: "굵은 글씨 효과"
},
{
    cmd: "italic",
    icon: "format-italic",
    desc: "기울임 꼴"
},
{
    cmd: "strikeThrough",
    icon: "format-strikethrough",
    desc: "취소선 효과"
},
{
    cmd: "underline",
    icon: "format-underline",
    desc: "밑줄 효과"
},
{},
{
    cmd: "fontSize",
    val: "20",
    input: "number",
    desc: "폰트 사이즈를 지정합니다. 기본값은 20px입니다."
},
{},
{
    cmd: "justifyLeft",
    icon: "format-align-left",
    desc: "좌측 정렬"
},
{
    cmd: "justifyCenter",
    icon: "format-align-center",
    desc: "가운데 정렬"
},
{
    cmd: "justifyRight",
    icon: "format-align-right",
    desc: "우측 정렬"
},
{},
{
    cmd: "formatBlock",
    icon: "format-quote-close",
    val: "<blockquote>",
    desc: "인용 하기"
},
{
    cmd: "createLink",
    val: "https://twitter.com/netsi1964",
    icon: "link-variant",
    desc: "링크 생성"
},
{
    cmd: "unlink",
    icon: "link-variant-off",
    desc: "링크 삭제"
},
{
    cmd: "removeFormat",
    icon: "format-clear",
    desc: "서식 지우기"
},
{
    cmd: "selectAll",
    icon: "select-all",
    desc: "전체 선택하기"
},
{
    cmd: "undo",
    icon: "undo",
    desc: "되돌리기"
},
{
    cmd: "redo",
    icon: "redo",
    desc: "다시하기"
}];


function supported(cmd) {
    var css = !!document.queryCommandSupported(cmd.cmd) ? "btn-succes" : "btn-error";
    return css;
};

function icon(cmd) {
    return typeof cmd.icon !== "undefined" ? "fa fa-" + cmd.icon : "";
};

function textEditorButtonsFrag() {
    let frag = document.createDocumentFragment();

    for (let command of commands) {
        let input;
        if (typeof command.cmd == "undefined") frag.append(createElement('span', { attrs: { class: 'separator' } }))
        if (!document.queryCommandSupported(command.cmd)) continue;
        if (typeof command.input !== "undefined") {
            switch (command.input) {
                case 'number':
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'number',
                            min: 12,
                            step: 1
                        },
                        on: {
                            change: e => {
                                if (e != undefined) {
                                    let selection = window.getSelection();
                                    let { anchorNode, anchorOffset, focusNode, focusOffset } = lastSelection;
                                    var range = document.createRange();
                                    range.setStart(anchorNode, anchorOffset);
                                    range.setEnd(focusNode, focusOffset);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, "7");
                                for (let font of document.querySelectorAll('[style*="xxx-large"]')) {
                                    font.style.fontSize = `${input.value / 10}rem` || "2rem";
                                }
                            }
                        },
                        value: 20
                    });
                    let plusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-plus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) + 1;
                                input.onchange();
                            }
                        }
                    });
                    let minusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-minus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) - 1;
                                input.dispatchEvent(new Event('change'));
                            }
                        }
                    });
                    frag.append(plusButton);
                    frag.append(input);
                    frag.append(minusButton);
                    break;
                case 'color':
                    let label = createElement('label', { attrs: { class: 'mdi mdi-format-color-highlight input_color' } });
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'color'
                        },
                        on: {
                            input: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            },
                            focus: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            }
                        },
                        value: command.val
                    });
                    label.append(input);
                    frag.append(label);
                    break;
            }
        } else {
            frag.append(createElement('button', {
                attrs: {
                    title: command.desc,
                    class: `mdi mdi-${command.icon}`
                },
                on: {
                    click: () => {
                        val = typeof command.val !== "undefined" ? command.val : "";
                        console.log(command);
                        document.execCommand("styleWithCSS", 0, true);
                        document.execCommand(command.cmd, false, val || "");
                    }
                }
            }));
        }
    }

    return frag;
}