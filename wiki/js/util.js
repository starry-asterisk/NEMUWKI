HTMLElement.prototype.setStyles = function (obj) {
    if (obj == undefined) console.error('Arguments 0 is undefined or null');
    else for (let name in obj) this.style.setProperty(name, obj[name]);
    return this;
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

    if (innerHTML) el.innerHTML = innerHTML;
    if (value) el.value = value;

    return el;
}


customElements.define('editable-table', class extends HTMLElement {
    _beforeInit = true;
    _rowcount = 0;
    _colcount = 0;
    _headers;
    _rows = [];
    _readonly = false;
    get headers() {
        return this._headers;
    }
    set readonly(bool) {
        this._readonly = bool;
        this._headers.style.display = bool ? 'none' : 'block';
        for (let row of this._rows) {
            for (let cell of row.children) {
                cell.firstChild.setAttribute('contenteditable', bool ? false : 'plaintext-only');
            }
        }
    }
    get readonly() {
        return this._readonly;
    }
    set rowcount(newValue) {
        if (this._beforeInit) {
            this._beforeInit = false;
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
                this.headers.children[idx].setStyles({ width: `${v}rem`, 'min-width': `${v}rem` });
                for (let row of this._rows) row.children[idx].setStyles({ width: `${v}rem`, 'min-width': `${v}rem` });
            }
        } else {
            cellInput = createElement('div', { attrs: { contenteditable: this._readonly ? false : 'plaintext-only' } });
        }
        cell.append(cellInput);
        return cell;
    }
    getRow() {
        return createElement('div', { attrs: { class: 'editable-table__row' } });
    }
    loadData(arr) {
        for (let row of this._rows) {
            for (let cell of row.children) {
                cell.firstChild.innerHTML = arr.shift();
            }
        }
    }
});

function addSuggest(data, input) {
    let li = createElement('li', { attrs: { value: data.path || data.name } });
    li.onmousedown = () => {
        li.parentNode.previousElementSibling.value = data.path || data.name;
    }
    input.querySelector('.input_suggest').append(li);
}

function goHome() { location.href = ROOT_PATH }

function errorHandler(error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    switch (errorCode) {
        case 'permission-denied':
            alert('권한이 없거나 자동 로그아웃 처리되었습니다. 다시 로그인 해주세요.');
            location.href = ROOT_PATH;
            break;
        case 'auth/invalid-email':
            alert('옳바르지 않거나 존재하지 않는 이메일 입니다.');
            break;
        case 'auth/missing-password':
            alert('패스워드를 입력해주세요.');
            break;
        case 'auth/invalid-credential':
            alert('로그인 인증에 실패했습니다. 패스워드 또는 아이디를 확인해 주세요.');
            break;
        default:
            alert(`오류가 발생했습니다::${errorCode}:`);
            console.error(errorCode, errorMessage);
            break;
    }
}

function getTreeFromBoardList(arr) {
    let depth_sorted = {};
    let tree = [];
    let max_depth;
    for (let child of arr) {
        if (depth_sorted[child.depth] == undefined) depth_sorted[child.depth] = [];
        depth_sorted[child.depth].push(child);
    }
    max_depth = Math.max.apply(undefined, Object.keys(depth_sorted));

    for (let d = max_depth; d > 0; d--) {
        let parent_arr = depth_sorted[d - 1] || [];
        let child_arr = depth_sorted[d] || [];
        if (parent_arr.length < 1) {
            for (let child of child_arr) tree.unshift(child);
        } else {
            for (let child of child_arr) {
                let parent = parent_arr.find(parent => parent.name == child.parent);
                if (parent == undefined) tree.unshift(child);
                else {
                    if (parent.child == undefined) parent.child = []
                    parent.child.push(child);
                }
            }
        }
    }

    return tree;
}

function fold(target) {
    target.classList.toggle('fold');
    if (target.classList.contains('fold')) target.nextElementSibling.style.display = 'none';
    else target.nextElementSibling.style.removeProperty('display');
}

const DEVELOPER_MODE = false;
const ROOT_PATH = './';
const VISITED_MAX = 5;
let visited = localStorage.getItem('visited')?localStorage.getItem('visited').split(','):[];
let params = new URLSearchParams(document.location.search);
let firebase = {};
let main__contents;

let post_id = params.get('post');

window.onload = function () {
    document.body.setAttribute('developerMode', DEVELOPER_MODE);
}