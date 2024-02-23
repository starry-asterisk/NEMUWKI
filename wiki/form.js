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

    let component = document.createElement('div');
    component.setAttribute('id', id);
    component.setAttribute('draggable', true);
    component.classList.add('component', type);

    let title = document.createElement('p');
    title.innerHTML = spec.title;
    component.append(title);

    let component__remove_btn = document.createElement('button');
    component__remove_btn.classList.add('component__remove_btn', 'mdi', 'mdi-trash-can');
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

const COMPONENT_SPEC = {
    textbox: {
        title: '텍스트 박스',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            let element = document.createElement('div');
            element.setAttribute('contenteditable', "plaintext-only");
            element.setAttribute('placeholder', "여기에 텍스트를 입력하세요");
            return element;
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
    image: {
        title: '이미지',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({ file }) {
            let fragment = document.createDocumentFragment();
            let input = document.createElement('input');
            input.setAttribute('type','file');
            input.setAttribute('accept','image/*');
            fragment.append(input);
            let img;
            if (file) {
                let dataTranster = new DataTransfer();
                dataTranster.items.add(file);
                input.files = dataTranster.files;
                img = new Image();
                img.src = URL.createObjectURL(file);
                fragment.append(img);
            }
            input.oninput = () => {
                if (input.files && input.files[0]) {
                    if(img) img.remove();
                    img = new Image();
                    img.src = URL.createObjectURL(input.files[0]);
                    input.after(img);
                }
            }
            return fragment;
        },
        getData: id => {
            let file = document.querySelector(`#${id} input[type="file"]`).files[0];
            if(file) {
                firebase.storage.upload(`${id}/${file.name}`, file);
                return `${id}/${file.name}`;
            }
            else return 'undefined';
        }
    },
    audio: {
        title: '음악',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({ file }) {
            let fragment = document.createDocumentFragment();
            let input = document.createElement('input');
            input.setAttribute('type','file');
            input.setAttribute('accept','audio/*');
            fragment.append(input);
            let audio;
            if (file) {
                let dataTranster = new DataTransfer();
                dataTranster.items.add(file);
                input.files = dataTranster.files;
                audio = document.createElement('audio');
                audio.setAttribute('controls', true);
                audio.src = URL.createObjectURL(file);
                fragment.append(audio);
            }
            input.oninput = () => {
                if (input.files && input.files[0]) {
                    if(file) img.remove();
                    audio = document.createElement('audio');
                    audio.setAttribute('controls', true);
                    audio.src = URL.createObjectURL(input.files[0]);
                    input.after(audio);
                }
            }
            return fragment;
        },
        getData: id => {
            let file = document.querySelector(`#${id} input[type="file"]`).files[0];
            if(file) {
                firebase.storage.upload(`${id}/${file.name}`, file);
                return `${id}/${file.name}`;
            }
            else return 'undefined';
        }
    },
    video: {
        title: '영상',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({ file }) {
            let fragment = document.createDocumentFragment();
            let input = document.createElement('input');
            input.setAttribute('type','file');
            input.setAttribute('accept','video/*');
            fragment.append(input);
            let audio;
            if (file) {
                let dataTranster = new DataTransfer();
                dataTranster.items.add(file);
                input.files = dataTranster.files;
                audio = document.createElement('video');
                audio.setAttribute('controls', true);
                audio.src = URL.createObjectURL(file);
                fragment.append(audio);
            }
            input.oninput = () => {
                if (input.files && input.files[0]) {
                    if(file) img.remove();
                    audio = document.createElement('video');
                    audio.setAttribute('controls', true);
                    audio.src = URL.createObjectURL(input.files[0]);
                    input.after(audio);
                }
            }
            return fragment;
        },
        getData: id => {
            let file = document.querySelector(`#${id} input[type="file"]`).files[0];
            if(file) {
                firebase.storage.upload(`${id}/${file.name}`, file);
                return `${id}/${file.name}`;
            }
            else return 'undefined';
        }
    },
    table: {
        title: '도표',
        option: function ({ id }) {
            let div = document.createElement('div');

            let colcountInput = document.createElement('input');
            colcountInput.setAttribute('type', 'number');
            colcountInput.setAttribute('min', '1');
            colcountInput.value = 3;
            colcountInput.oninput = () => {
                if (colcountInput.value < 1) colcountInput.value = 1;
                document.querySelector(`#${id} editable-table`).colcount = colcountInput.value;
            }

            let colContainer = document.createElement('div');
            colContainer.append(colcountInput);
            colContainer.classList.add('component__option__input');

            let rowcountInput = document.createElement('input');
            rowcountInput.setAttribute('type', 'number');
            rowcountInput.setAttribute('min', '1');
            rowcountInput.value = 3;
            rowcountInput.oninput = () => {
                if (rowcountInput.value < 1) rowcountInput.value = 1;
                document.querySelector(`#${id} editable-table`).rowcount = rowcountInput.value;
            }

            let rowContainer = document.createElement('div');
            rowContainer.append(rowcountInput);
            rowContainer.classList.add('component__option__input');

            div.append(colContainer);
            div.append(document.createTextNode('x'));
            div.append(rowContainer);

            div.style.marginTop = '2rem';
            return div;
        },
        input: function () {
            let el = document.createElement('editable-table');
            el.style.marginTop = '2rem';
            return el;
        },
        getData: id => {
            return {
                rowclount: document.querySelectorAll(`#${id} .component__option__input input`)[1].value,
                header: Array.prototype.map.call(document.querySelectorAll(`#${id} editable-table input`),cell => cell.value),
                cells: Array.prototype.map.call(document.querySelectorAll(`#${id} editable-table [contenteditable]`),cell => cell.innerHTML)
            };
        }
    },
    title: {
        title: '소제목',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            let element = document.createElement('div');
            element.setAttribute('contenteditable', "plaintext-only");
            element.setAttribute('placeholder', "여기에 텍스트를 입력하세요");
            return element;
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
    seperator: {
        title: '구분선',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        },
        getData: id => {
            return '';
        }
    },
    summury: {
        title: '개요',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        },
        getData: id => {
            return '';
        }
    },
    caption: {
        title: '캡션',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        },
        getData: id => {
            return '';
        }
    },
    인용: {
        title: '인용',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            let element = document.createElement('div');
            element.setAttribute('contenteditable', "plaintext-only");
            element.setAttribute('placeholder', "여기에 텍스트를 입력하세요");
            return element;
        },
        getData: id => {
            return document.querySelector(`#${id} [contenteditable]`).innerHTML;
        }
    },
}

window.addEventListener('load', function () {
    main__contents = document.querySelector('.main__contents');
    main__contents.ondragover = dragover;
    main__contents.ondrop = drop;

    let component_list = document.querySelector('.component_list');
    for (let specname in COMPONENT_SPEC) {
        let spec = COMPONENT_SPEC[specname];
        let li = document.createElement('li');
        li.setAttribute('type', specname);
        li.setAttribute('draggable', true);
        li.ondragstart = dragstart;
        li.innerHTML = spec.title;
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
    let li = document.createElement('li');
    li.setAttribute('value', data.name);
    li.onmousedown = () => {
        li.parentNode.previousElementSibling.value = li.getAttribute('value');
    }
    input.querySelector('.input_suggest').append(li);
}

function test() {
    let input = main__header__title.querySelector('input');
    input.focus();
    input.dispatchEvent(new Event("invalid"));
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(new Event("change"));
    input.setCustomValidity('ha-ha');
    input.reportValidity();
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
        let cell = document.createElement('div');
        cell.classList.add('editable-table__cell');
        let cellInput;
        if (header) {
            cellInput = document.createElement('input');
            cellInput.setAttribute('type', 'number');
            cellInput.setAttribute('min', 1);
            cellInput.setAttribute('step', 1);
            cellInput.oninput = () => {
                let v = parseFloat(cellInput.value);
                let idx = Array.prototype.findIndex.call(cell.parentNode.children, node => node == cell);
                cell.style.width = `${v}rem`;
                for (let row of this._rows) row.children[idx].style.width = `${v}rem`;
            }
            cellInput.value = 20;
        } else {
            cellInput = document.createElement('div');
            cellInput.setAttribute('contenteditable', 'plaintext-only');
        }
        cell.append(cellInput);
        return cell;
    }
    getRow() {
        let row = document.createElement('div');
        row.classList.add('editable-table__row');
        return row;
    }
});

function submit(){
    firebase.post.insertOne({
        board_name: main__header__title.value,
        category: post_categories.value,
        title: post_menu.value,
        contents: Array.from(document.getElementsByClassName('component')).map(c => {return {
            type: c.classList[1],
            value: COMPONENT_SPEC[c.classList[1]].getData(c.getAttribute('id'))
        };}),
        hidden: false,
        use: true,
        timestamp: new Date(upload_datetime.value)
    })
    .then(console.log)
    .error(console.error);
}