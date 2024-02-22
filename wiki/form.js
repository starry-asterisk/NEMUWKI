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
                main__contents.append(createComponent(type, {file}));
                break;
            default:
                console.warn('no support type :',type);
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
        }
    },
    image: {
        title: '이미지',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = new Image();
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    audio: {
        title: '음악',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = document.createElement('audio');
                el.setAttribute('controls',true);
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    video: {
        title: '영상',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = document.createElement('video');
                el.setAttribute('controls',true);
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    table: {
        title: '도표',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
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
        }
    },
    seperator: {
        title: '구분선',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
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

function test(){
    let input = input_menu.querySelector('input');
    input.focus();
    input.dispatchEvent(new Event("invalid"));
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(new Event("change"));
    input.setCustomValidity('ha-ha');
    input.reportValidity();
}

customElements.define('editable-table', class extends HTMLElement {
    _rowcount = 1;
    _colcount = 1;
    _rows = [];
    set rowcount(newValue){
        if(newValue > this._rowcount){
            while(newValue > this._rowcount){
                let row = this._rows[this._rowcount] = this.getRow();
                for(let i = 0;i<this._colcount;i++) row.append(this.getCell());
            }
        }else if(newValue < this._rowcount){
            for(let i = newValue;i < this._rowcount;i++){
                this._rows[i].remove();
            }
            this._rows.splice(newValue, this._rowcount - newValue);
        }
        this._rowcount = newValue;
    }
    get rowcount(){
        return _rowcount;
    }
    set colcount(newValue){
        if(newValue > this._colcount){
            for(let row of this._rows){
                for(let i = this._colcount;i < newValue;i++){
                    row.append(this.getCell());
                }
            }
        }else if(newValue < this._colcount){
            for(let row of this._rows){
                for(let i = newValue;i < this._colcount;i++){
                    row.lastChild.remove();
                }
            }
        }
        this._rowcount = newValue;
    }
    get colcount(){
        return _colcount;
    }
    constructor() {
        super();
    }
    attributeChangedCallback(name, oldValue, newValue){
        this[name.toLowerCase()] = newValue;
    }
    connectedCallback() {

    }
    adjustRowCount(){

    }
    adjustColCount(){
        
    }
    getCell(){
        let cell = document.createElement('div');
        cell.classList.add('editable-table__cell');
        let cellInput = document.createElement('input');
        cellInput.setAttribute('type','text');
        cell.append(cellInput);
        return cell;
    }
    getRow(){
        let row = document.createElement('div');
        row.classList.add('editable-table__row');

        let rowSize = document.createElement('div');
        rowSize.classList.add('editable-table__cell');

        let rowSizeInput = document.createElement('input');
        rowSizeInput.setAttribute('type','number');
        rowSizeInput.setAttribute('min', 0);
        rowSizeInput.setAttribute('step',0.1);
        rowSize.append(rowSizeInput);

        row.append(rowSize);
        return row;
    }
});