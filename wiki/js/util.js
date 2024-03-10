HTMLElement.prototype.setStyles = function (obj) {
    for (let name in obj) this.style.setProperty(name, obj[name]);
    return this;
}

HTMLElement.prototype.switchClass = function (oldClass, newClass, replace = false) {
    let old_index = Array.prototype.indexOf.call(this.classList, oldClass);
    let new_index = Array.prototype.indexOf.call(this.classList, newClass);
    if (replace) this.classList.remove(old_index);
    this.classList.remove(newClass);
    if (old_index >= new_index) {
        this.classList.add(newClass);
    }
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

function createElement(tagName = 'div', option) {
    let {
        styles = {},
        attrs = {},
        on = {},
        value,
        innerHTML
    } = option || {};
    let el = document.createElement(tagName);

    for (let namespace in styles) el.style.setProperty(namespace, styles[namespace]);
    for (let namespace in attrs) el.setAttribute(namespace, attrs[namespace]);
    for (let namespace in on) el[`on${namespace}`] = on[namespace];

    if (innerHTML) el.innerHTML = innerHTML;
    if (value) el.value = value;

    return el;
}

function createNotice(data) {
    let link = createElement('a', { attrs: { class: "main__notice" } });
    let title = createElement('span', { innerHTML: data.title });
    let timestamp = createElement('span', { attrs: { class: "main__notice__timestamp" }, innerHTML: new Date(data.timestamp.seconds * 1000).toLocaleDateString() });
    let content = createElement('span', { attrs: { class: "main__notice__content" }, innerHTML: data.content });
    link.append(title);
    link.append(timestamp);
    link.append(content);

    link.onclick = () => {
        link.classList.toggle('open');
    }
    content.onclick = e => e.stopPropagation();

    document.querySelector('main').firstElementChild.after(link);
}

function addSuggest(data, input) {
    let li = createElement('li', { attrs: { value: data.path || data.name } });
    li.onmousedown = () => {
        li.parentNode.previousElementSibling.value = data.path || data.name;
    }
    input.querySelector('.input_suggest').append(li);
}

function goHome() { location.href = ROOT_PATH }

function goRandom() { firebase.post.random().then(id => location.href = `${ROOT_PATH}?post=${id}`) }

function goShare(destination, url = location.href) {
    if (destination == undefined && typeof navigator.share == 'function') {
        navigator.share({
            title: document.title,
            text: document.title,
            url: url,
        });
    } else {
        let searchParams = new URLSearchParams();
        switch (destination) {
            case 'twitter':
                searchParams.set("url", url);
                searchParams.set("text", `${document.title}\n`);
                window.open(`https://twitter.com/intent/post?${searchParams.toString()}`, '_blank').focus();
                break;
        }
    }
}

function board2Tree(arr) {
    for (let menu of arr) {
        if (menu.parent == '') continue;
        let parent = arr.find(parent => parent.name == menu.parent);
        if (parent?.child?.length) {
            parent.child.push(menu);
        } else if (parent) {
            parent.child = [menu];
        } else {
            menu.parent = '';
        }
    }

    arr = arr.filter(menu => menu.parent == '');
    return arr;
}

function board2Path(arr_original, type) {
    let arr = JSON.parse(JSON.stringify(arr_original));
    let striped_menu = [];
    let tree = board2Tree(arr);
    let stripe = type == 2 ? stripe_2 : stripe_1;

    for (let child of tree || []) stripe(child);

    function stripe_1(data, prefix = []) {
        prefix.push(data.name);
        striped_menu.push({ path: prefix.join(' > '), name: data.name, path_arr: prefix.slice() });
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

async function uploadByImgur(file) {
    var bodyData = new FormData();
    bodyData.append("image", file);
    const response = await fetch('https://api.imgur.com/3/image', {
        method: "POST",
        headers: {
            Authorization: 'Client-ID cfb9241edbf292e',
            Accept: 'application/json',
        },
        body: bodyData,
    });

    return response.json();
}

function firebaseErrorHandler(error) {
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
        case 'auth/email-already-in-use':
            alert('이미 사용중인 이메일입니다.');
            break;
        case 'auth/weak-password':
            alert('취약한 비밀번호 입니다.');
            break;
        default:
            alert(`오류가 발생했습니다::${errorCode}:`);
            dev.error(errorCode, errorMessage);
            break;
    }
}

function NetErrorHandler(code) {
    document.body.classList.add('error');
    document.body.append(createElement('error', {
        attrs: {
            'state-code': code,
        }, innerHTML: code
    }));
    document.title = '404 NOT FOUND PAGE';
    return dev.warn('404 NOT FOUND PAGE');
}

//이메일 인증 모달
function modal(mode = 'emailPrompt') {
    let container = createElement('dialog');
    let form = createElement('form', { attrs: { method: 'dialog' } });
    let button_cancel = createElement('button', { value: 'cancel', attrs: { class: 'danger' } });
    document.body.append(container);
    container.append(form);
    form.append(MODAL_TEMPLATE[mode](container));
    form.append(button_cancel);
    container.showModal();
}

const MODAL_TEMPLATE = {
    emailPrompt: container => {
        let frag = document.createDocumentFragment();
        let sub_title = createElement('div', { attrs: { class: 'modal__sub_title' }, innerHTML: '재설정을 위해 이메일을 입력해주세요.' });
        let text_input_container = createElement('div', { attrs: { class: 'input_container no-validity' } });
        let text_input = createElement('input', { attrs: { type: 'text', placeholder: '이메일' } });
        let button_confirm = createElement('button', { value: 'default', attrs: { class: 'normal' } });
        frag.append(sub_title);
        frag.append(text_input_container);
        frag.append(button_confirm);
        text_input_container.append(text_input);
        button_confirm.onclick = e => {
            e.preventDefault();
            if (validate(text_input, undefined, 'email'))
                firebase.auth.sendPasswordResetEmail(text_input.value)
                    .then(result => {
                        if (result) dev.log(result);
                        alert('메일이 전송되었습니다.');
                        container.close();
                    })
                    .catch(firebaseErrorHandler);
        }
        return frag;
    },
    emailConfirm: container => {
        let frag = document.createDocumentFragment();
        let sub_title = createElement('div', { attrs: { class: 'modal__sub_title' }, innerHTML: '버튼을 누르면 인증 메일이 발송됩니다.' });
        let button_confirm = createElement('button', { value: 'default', attrs: { class: 'normal' } });
        frag.append(sub_title);
        frag.append(button_confirm);
        button_confirm.onclick = e => {
            e.preventDefault();
            (async () => await firebase.auth.sendEmailVerification())()
                .then(result => {
                    if (result) dev.log(result);
                    alert('메일이 전송되었습니다.');
                    container.close();
                })
                .catch(firebaseErrorHandler);
        }
        return frag;
    },
    addCategory: container => {
        let frag = document.createDocumentFragment();
        let sub_title = createElement('div', { attrs: { class: 'modal__sub_title' }, innerHTML: '새로운 카테고리에 대한 정보를 입력해 주세요.' });

        let text_input_container = createElement('div', { attrs: { class: 'input_container no-validity' } });
        let text_input = createElement('input', { attrs: { type: 'text', placeholder: '새로운 카테고리' } });

        let button_confirm = createElement('button', { value: 'default', attrs: { class: 'normal' } });
        frag.append(sub_title);
        frag.append(text_input_container);
        frag.append(button_confirm);
        text_input_container.append(text_input);
        button_confirm.onclick = e => {
            e.preventDefault();
            if (text_input.value) {
                if (confirm('카테고리를 생성하시겠습니까? \n ※삭제는 관리자에게 문의해주세요.')) {
                    firebase.categories.insertOne({ name: text_input.value })
                        .then(() => {
                            alert('카테고리가 추가되었습니다.');
                            SuggestList['category'].push({ name: text_input.value });
                            loadCategorySuggest();
                            container.close();
                        })
                        .catch(firebaseErrorHandler);
                }
            } else {
                alert('카테고리 명칭을 입력해 주세요.')
            }
        }
        return frag;
    },
    addMenu: container => {
        let frag = document.createDocumentFragment();
        let sub_title = createElement('div', { attrs: { class: 'modal__sub_title' }, innerHTML: '새로운 메뉴에 대한 정보를 입력해 주세요.' });
        let button_confirm = createElement('button', { value: 'default', attrs: { class: 'normal' } });


        let parent_input_container = createElement('div', { attrs: { class: 'input_container no-validity' } });
        let parent_input = createElement('input', { attrs: { type: 'text', placeholder: '상위 메뉴' } });
        let parent_suggest = createElement('ul', { attrs: { class: 'input_suggest' } });
        let text_input_container = createElement('div', { attrs: { class: 'input_container no-validity' } });
        let text_input = createElement('input', { attrs: { type: 'text', placeholder: '새로운 메뉴' } });

        frag.append(sub_title);
        frag.append(parent_input_container);
        frag.append(text_input_container);
        frag.append(button_confirm);
        parent_input_container.append(parent_input);
        parent_input_container.append(parent_suggest);
        text_input_container.append(text_input);

        if (typeof SuggestList != 'undefined') {
            for (let data of board2Path(SuggestList['board'] || [])) addSuggest(data, parent_input_container);
        }

        button_confirm.onclick = e => {
            e.preventDefault();
            if (text_input.value) {
                if (confirm('메뉴를 생성하시겠습니까? \n ※삭제는 관리자에게 문의해주세요.')) {
                    firebase.board.insertOne({ name: text_input.value, parent: parent_input.value })
                        .then(() => {
                            alert('메뉴가 추가되었습니다.');
                            SuggestList['board'].push({ name: text_input.value, parent: parent_input.value });
                            loadBoardSuggest();
                            container.close();
                        })
                        .catch(firebaseErrorHandler);
                }
            } else {
                alert('메뉴 명칭을 입력해 주세요.')
            }
        }
        return frag;
    }
};

const Notify = {
    alert, confirm, prompt
}
const dev = console;
const DEVELOPER_MODE = false;
const ROOT_PATH = './';
const SUFFIX = location.hostname.endsWith('nemuwiki.com') ? '' : '.html';
const VISITED_MAX = 5;
const FILE_UPLOAD_METHOD = 0; // 0 is imgur, 1 is firestorage
const PAGE_PREFIX = '네무위키 :: ';
let visited = localStorage.getItem('visited') ? localStorage.getItem('visited').split(',') : [];
let params = new URLSearchParams(document.location.search);
let firebase = {};
let SuggestList = {
    category: [],
    board: [],
    board2Path_1: [],
    board2Path_2: [],
};

let post_id = params.get('post');

window.onload = async  function () {
    document.body.setAttribute('developerMode', DEVELOPER_MODE);

    const module = await import('./firebase.js');
    firebase = module.default;
    
    //초기화 callback
    if (typeof firebaseLoadCallback == 'function') {
        firebaseLoadCallback();
    }
}
