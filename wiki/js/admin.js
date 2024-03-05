async function firebaseLoadCallback() {
    try {
        firebase.auth.checkAdmin((isAdmin, user) => {
            if (isAdmin) {
                loadAdmin(user);
            } else if (user != undefined) {
                document.body.setAttribute('state', 'none-auth');
                throw { code: 'admin-permission-denied' };
            }
        });
    } catch (e) {
        errorHandler(e);
    }
}

window.addEventListener('load', () => {
    email.oninput = e => div_validate(email);
    password.oninput = e => div_validate(password);
    email.onkeydown = e => divInputHandler(e);
    password.onkeydown = e => divInputHandler(e, login);
});

function divInputHandler(e, submit = () => { }) {
    if (e.key == 'Enter') {
        e.preventDefault();
        submit();
        return false;
    }
}

function login() {
    if (!div_validate(email, undefined, 'email')) return email.focus();
    if (!div_validate(password, undefined, 'password')) return password.focus();
    firebase.auth.login(email.innerHTML, password.innerHTML)
        .then(user => {
            if (user == undefined) throw { code: 'auth/invalid-credential' };
        })
        .catch(errorHandler);
}

function loadAdmin(args) {
    document.body.setAttribute('state', 'auth');
    testInit();
}

function goAdmin(e) {
    if (e) e.preventDefault();
    location.href = `${ROOT_PATH}admin${SUFFIX}`;
}

const logger = {
    ...console
}

const TabList = [];
const TAB_SPEC = {
    user: {
        alias: '사용자 관리',
        search: 'email',
        get cursor() {
            return firebase.auth.users();
        },
        createItem: (option, isHeader = false, hidden = false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__photo = createElement('span', { attrs: { class: 'list__item__photo' }, innerHTML: isHeader ? 'IMAGE' : '' });

            let item__uid = createElement('span', { attrs: { class: 'list__item__uid' }, innerHTML: isHeader ? 'ID' : option.id });
            let item__email = createElement('span', { attrs: { class: 'list__item__email always flexible' }, innerHTML: isHeader ? '이메일' : data.email });
            let item__level = createElement('span', { attrs: { class: 'list__item__level always' }, innerHTML: isHeader ? '권한' : `${data.level}` });

            item.append(item__photo);
            item.append(item__uid);
            item.append(item__email);
            item.append(item__level);
            if (hidden) item.setStyles({display: 'none'});
            if (isHeader) {
                item.classList.add('header');
            } else {
                let item__photo_img = createElement('img');
                item__photo.append(item__photo_img);
                if (data.photo_url) item__photo_img.src = data.photo_url;
                item__level.onclick = () => {
                    if (confirm('권한 레벨을 변경하시겠습니까?')) {
                        let level = parseInt(prompt('새로운 권한 레벨 [0-5]'));
                        if (data.level == level || level === NaN) return;
                        firebase.auth.updateUser(option.id, { level })
                            .then(e => {
                                item__level.innerHTML = data.level = level;
                            })
                            .catch(errorHandler);
                    }
                };
            }
            return item;
        }
    },
    notice: {
        alias: '공지사항 관리',
        search: 'title',
        get cursor() {
            return firebase.notice.list();
        },
        createItem: (option, isHeader = false, hidden= false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__title = createElement('span', { attrs: { class: 'list__item__title always flexible' }, innerHTML: isHeader ? '제목' : data.title });
            let item__timestamp = createElement('span', { attrs: { class: 'list__item__timestamp' }, innerHTML: isHeader ? '작성일' : new Date(data.timestamp.seconds * 1000).toLocaleString() });
            let item__use = createElement('span', { attrs: { class: 'list__item__use' }, innerHTML: isHeader ? '사용' : data.use });

            item.append(item__title);
            item.append(item__timestamp);
            item.append(item__use);
            
            let item__edit = createElement('div', { attrs: { class: 'list__item__edit' } });
            let item__edit__textarea = createElement('textarea', { value: data.content });
            let item__edit__button = createElement('button', { innerHTML: '저장' });

            item__edit.append(item__edit__textarea);
            item__edit.append(item__edit__button);
            item.append(item__edit);

            if (hidden) item.setStyles({display: 'none'});
            if (isHeader) {
                item.classList.add('header');
            } else {
                item__title.onclick = ()=>{
                    item.classList.toggle('expand');
                    item__edit__textarea.value = data.content;
                }
                item__edit__button.onclick = ()=>{
                    firebase.notice.updateOne(option.id, {
                        content: item__edit__textarea.value
                    }).then(()=>{
                        data.content = item__edit__textarea.value;
                        item.classList.toggle('expand');
                    }).catch(errorHandler);
                }
            }
            return item;
        }
    },
    post: {
        alias: '게시글 목록 관리',
        search: 'title',
        get cursor() {
            return firebase.post.list();
        },
        createItem: (option, isHeader = false, hidden = false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__title = createElement('span', { attrs: { class: 'list__item__title always flexible'+(isHeader?'':' icon link') }, innerHTML: isHeader ? '제목' : data.title });
            let item__timestamp = createElement('span', { attrs: { class: 'list__item__timestamp' }, innerHTML: isHeader ? '작성일' : new Date(data.timestamp.seconds * 1000).toLocaleString() });
            let item__board_name = createElement('span', { attrs: { class: 'list__item__board_name'+(isHeader?'':' icon link') }, innerHTML: isHeader ? '분류' : data.board_name });
            let item__category = createElement('span', { attrs: { class: 'list__item__category'+(isHeader?'':' icon link') }, innerHTML: isHeader ? '카테고리' : data.category });
            let item__author_id = createElement('span', { attrs: { class: 'list__item__author_id'+(isHeader?'':' icon link') }, innerHTML: isHeader ? '작성자' : '작성글 더 보기' });

            item.append(item__author_id);
            item.append(item__title);
            item.append(item__board_name);
            item.append(item__category);
            item.append(item__timestamp);
            
            if (hidden) item.setStyles({display: 'none'});
            if (isHeader) {
                item.classList.add('header');
            } else {
                item__title.onclick = () => {
                    window.open(`${ROOT_PATH}?post=${option.id}`);
                }
                item__category.onclick = () => {
                    window.open(`${ROOT_PATH}?keyword=${data.category}&field=category&operator=equal`);
                }
                item__board_name.onclick = () => {
                    window.open(`${ROOT_PATH}?keyword=${data.board_name}&field=board_name_arr&operator=array-contains`);
                }
                item__author_id.onclick = () => {
                    window.open(`${ROOT_PATH}?field=author&keyword=${data.author}`);
                }
            }
            return item;
        }
    },
    template: {
        alias: '템플릿 목록 관리',
        search: 'title',
        get cursor() {
            return firebase.post.list({board_name: 'template'},true, 'equal');
        },
        createItem: (option, isHeader, hidden) => TAB_SPEC.post.createItem(option, isHeader, hidden)
    },
    board: {
        alias: '분류 관리',
        search: 'name',
        get cursor() {
            return firebase.board.list_paginator();
        },
        createItem: (option, isHeader = false, hidden = false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__name = createElement('span', { attrs: { class: 'list__item__name always flexible' }, innerHTML: isHeader ? '메뉴' : data.name });
            let item__parent = createElement('span', { attrs: { class: 'list__item__parent always flexible' }, innerHTML: isHeader ? '상위메뉴' : data.parent });
            let item__delete = createElement('span', { attrs: { class: 'list__item__delete always'+(isHeader?'':' icon delete') }, innerHTML: isHeader ? '삭제' : '' });
           
            item.append(item__name);
            item.append(item__parent);
            item.append(item__delete);
            
            if (hidden) item.setStyles({display: 'none'});
            if (isHeader) {
                item.classList.add('header');
            } else {
                item__delete.onclick = () => {
                    if(confirm('정말 이 메뉴를 삭제 하시겠습니까?')){
                        firebase.board.deleteOne(option.id).then(()=>{
                            alert('카테고리를 삭제하였습니다.');
                            item.remove();
                        }).catch(errorHandler);
                    }
                }
            }
            return item;
        }
    },
    category: {
        alias: '카테고리 관리',
        search: 'name',
        get cursor() {
            return firebase.categories.list_paginator();
        },
        createItem: (option, isHeader = false, hidden = false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__name = createElement('span', { attrs: { class: 'list__item__name always flexible' }, innerHTML: isHeader ? '명칭' : data.name });
            let item__delete = createElement('span', { attrs: { class: 'list__item__delete always'+(isHeader?'':' icon delete') }, innerHTML: isHeader ? '삭제' : '' });
           
            item.append(item__name);
            item.append(item__delete);
            
            if (hidden) item.setStyles({display: 'none'});
            if (isHeader) {
                item.classList.add('header');
            } else {
                item__delete.onclick = () => {
                    if(confirm('정말 이 카태고리를 삭제 하시겠습니까?')){
                        firebase.categories.deleteOne(option.id).then(()=>{
                            alert('카테고리를 삭제하였습니다.');
                            item.remove();
                        }).catch(errorHandler);
                    }
                }
            }
            return item;
        }
    },
};
const TAB_DEFAULT_SPEC = {
    alias: '[ Default Tab ]',
    replication: true,
    cursor: {
        next: async () => [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
    createItem: option => {
        return createElement('div', { attrs: { class: 'list__item' } });
    }
}

function createTab(type) {

    if (TAB_SPEC[type] == undefined) return logger.warn(`the tab type '${type}' is NOT exist.`);
    let { replication, createItem, cursor, alias, search } = { ...TAB_DEFAULT_SPEC, ...TAB_SPEC[type] };
    if (!replication && TabList.find(tab => tab.type == type)) return logger.warn(`warnning!! '${type}' cant't have deuplicated Tabs`);

    let id = `tab_${Math.floor(Math.random() * 1000000).toString(16)}`;
    let tab = createElement('tab', { attrs: { id, class: type } });
    let tab__top_menu = createElement('div', { attrs: { class: 'tab__top_menu' } });
    let tab__top_menu__title = createElement('span', { attrs: { class: 'tab__title' }, innerHTML: alias || type });
    let tab__top_menu__minimize = createElement('button', { attrs: { class: 'tab__minimize icon' }, on: { click: () => tab.switchClass('maximize', 'minimize') } });
    let tab__top_menu__maximize = createElement('button', { attrs: { class: 'tab__maximize icon' }, on: { click: () => tab.switchClass('minimize', 'maximize') } });
    let tab__top_menu__close = createElement('button', { attrs: { class: 'tab__close icon' }, on: { click: () => undefined } });
    let tab__search = createElement('div', { attrs: { class: 'tab__search input search', title: type } });
    let tab__search__input = createElement('div', { attrs: { contenteditable: 'plaintext-only' } });
    let tab__search__button_go = createElement('button', { attrs: { class: 'input__go' } });
    let tab__search__button_clear = createElement('button', { attrs: { class: 'input__clear' } });
    let tab__list = createElement('div', { attrs: { class: 'tab__list list' } });
    let tab__list__button = createElement('button', { attrs: { class: 'list__more icon' }, on: { click: load } });

    tab.append(tab__top_menu);
    tab.append(tab__search);
    tab.append(tab__list);

    tab__top_menu.append(tab__top_menu__title);
    tab__top_menu.append(tab__top_menu__minimize);
    tab__top_menu.append(tab__top_menu__maximize);
    tab__top_menu.append(tab__top_menu__close);

    tab__search.append(tab__search__input);
    tab__search.append(tab__search__button_go);
    tab__search.append(tab__search__button_clear);

    tab__list.append(tab__list__button);
    tab__list.prepend(createItem({}, true));

    load();

    let FullList = [];

    tab__search__input.oninput = ()=>{
        let keyword = tab__search__input.innerText;
        for (let index in FullList) {
            console.log(index + 1, tab__list.children[index + 1]);
            if(FullList[index].data()[search].includes(keyword)){
                tab__list.children[parseInt(index) + 1].setStyles({display: 'flex'});
            }else{
                tab__list.children[parseInt(index) + 1].setStyles({display: 'none'});
            }
        }
    }

    function load() {
        let keyword = tab__search__input.innerText;
        cursor.next().then(list => {
            if (list.length < 1) tab__list__button.remove();
            FullList = [...FullList, ...list];
            for (let option of list) {
                tab__list__button.before(createItem(option, false, !option.data()[search].includes(keyword)));
            }
        });
    }

    let data = {
        id,
        type,
        el: {
            tab, tab__search__input, tab__list
        }
    };

    TabList.push(data);

    return data;
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

function testInit() {
    for (let spec_name of Object.keys(TAB_SPEC)) {
        workspace.append(createTab(spec_name).el.tab);
    }

}