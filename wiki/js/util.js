HTMLElement.prototype.setStyles = function (obj) {
    for (let name in obj) this.style.setProperty(name, obj[name]);
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
    _colsize = [];
    _headers;
    _rows = [];
    _readonly = false;
    _fragment;
    get fragment() {
        return this._beforeInit ? this._fragment : this;
    }
    set fragment(frag) {
        this._fragment = frag;
    }
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
        let frag = this.fragment;
        if (newValue > frag.children.length - 1) while (newValue > frag.children.length - 1) {
            this._rows.push(this.addRow());
            for (let i = 0; i < this._colcount; i++) {
                this.addCell(frag.lastChild).style.width = this._headers.children[i].style.width;
            }
        } else if (newValue < frag.children.length - 1) {
            console.log(frag);
            for (; newValue < frag.children.length - 1;) frag.lastChild.remove();
            this._rows.length = newValue;
        }
    }
    get rowcount() {
        return this.fragment.children.length - 1;
    }
    set colcount(newValue) {
        if (newValue > this._colcount) {
            for (; newValue > this._headers.children.length;) this.addCell(this._headers, { header: true });
            for (let row of this._rows) {
                for (let i = this._colcount; i < newValue; i++) this.addCell(row);
            }
        } else if (newValue < this._colcount) {
            for (; newValue < this._headers.children.length;) this._headers.lastChild.remove();
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
        this.fragment = document.createDocumentFragment();
        this._headers = this.addRow();
    }
    static get observedAttributes() {
        return ['rowcount', 'colcount'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this[name.toLowerCase()] = newValue;
    }
    connectedCallback() {
        if (this._beforeInit) {
            this._beforeInit = false;
            this.append(this._fragment);
        }
    }
    addCell(row, option = {}) {
        let { header } = option;
        let index = row.children.length;
        if (header) this._colsize[index] = 20;
        let cell = createElement('div', {
            attrs: { class: 'editable-table__cell' },
            styles: { width: `${this._colsize[index]}rem`, 'min-width': `${this._colsize[index]}rem` }
        });
        cell.append(header ? createElement('input', {
            attrs: { type: 'number', min: 1, step: 1 },
            on: {
                input: e => {
                    let v = parseFloat(cell.lastChild.value);
                    this._colsize[index] = v;
                    for (let row of this.fragment.children) row.children[index].setStyles({ width: `${v}rem`, 'min-width': `${v}rem` });
                }
            },
            value: 20
        }) : createElement('div', {
            attrs: { contenteditable: this._readonly ? false : 'plaintext-only' }
        }));
        row.append(cell);
        return cell;
    }
    addRow() {
        this.fragment.append(createElement('div', { attrs: { class: 'editable-table__row' } }));
        return this.fragment.lastChild;
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

function goRandom() {
    firebase.post.random().then(id => location.href = `${ROOT_PATH}?post=${id}`);
}

function errorHandler(error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    switch (errorCode) {
        case 'permission-denied':
            alert('권한이 없거나 자동 로그아웃 처리되었습니다. 다시 로그인 해주세요.');
            location.href = ROOT_PATH;
            break;
        case 'admin-permission-denied':
            alert('접근 가능한 관리자가 아닌 계정으로 로그인 되어있습니다. 다시 로그인 해주세요.');
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

function board2Tree(arr) {
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

function board2Path(arr, type) {
    let striped_menu = [];
    let tree = board2Tree(arr);
    let stripe = type == 2 ? stripe_2 : stripe_1;

    for (let child of tree || []) stripe(child);

    function stripe_1(data, prefix = [], depth = 0) {
        prefix.push(data.name);
        striped_menu.push({ path: prefix.join(' > '), depth, name: data.name });
        for (let child of data.child || []) stripe(child, prefix.slice());
    }

    function stripe_2(data, prefix = []) {
        prefix.push(data.name);
        striped_menu[data.name] = prefix.join(' > ');
        for (let child of data.child || []) stripe(child, prefix.slice());
    }

    striped_menu.sort((v1, v2) => v1.path.localeCompare(v2.path));

    return striped_menu;
}

function fold(target) {
    target.classList.toggle('fold');
    if (target.classList.contains('fold')) target.nextElementSibling.style.display = 'none';
    else target.nextElementSibling.style.removeProperty('display');
}

const INPUT_STATE = {
    valid: 'valid',
    invalid: 'invalid'
}

function div_validate(input, input_2, type = 'text') {
    let state = INPUT_STATE.invalid;
    if (input.innerHTML != '' || !input.hasAttribute('required')) {
        if (input_2 == undefined || input.innerHTML == input_2.innerHTML) {
            switch (type) {
                case 'email':
                    if (/^\S+@\S+$/.test(input.innerHTML)) state = INPUT_STATE.valid;
                    break;
                case 'password':
                    if (input.innerHTML.length > 7) state = INPUT_STATE.valid;
                    break;
                default:
                    state = INPUT_STATE.valid;
                    break;
            }
        }
    }
    input.setAttribute('state', state);
    return state == INPUT_STATE.valid;
}

function validate(input, input_2, type = 'text') {
    input.setCustomValidity('not valid');
    if (input.value != undefined && input.value != '') {
        if (input_2 == undefined || input.value == input_2.value) {
            switch (type) {
                case 'email':
                    if (/^\S+@\S+$/.test(input.value)) input.setCustomValidity('');
                    break;
                case 'password':
                    if (input.value.length > 7) input.setCustomValidity('');
                    break;
                default:
                    input.setCustomValidity('');
                    break;
            }
        }
    }
    return input.checkValidity();
}

const DEVELOPER_MODE = false;
const ROOT_PATH = './';
const VISITED_MAX = 5;
let visited = localStorage.getItem('visited') ? localStorage.getItem('visited').split(',') : [];
let params = new URLSearchParams(document.location.search);
let firebase = {};

let post_id = params.get('post');

window.onload = function () {
    document.body.setAttribute('developerMode', DEVELOPER_MODE);
}
