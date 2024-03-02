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

const logger = {
    ...console
}

const TabList = [];
const TAB_SPEC = {
    user: {
        alias: '사용자 관리',
        get cursor() {
            return firebase.auth.users();
        },
        createItem: (option, isHeader = false) => {
            let data = isHeader || option.data();
            let item = createElement('div', { attrs: { class: 'list__item' } });
            let item__photo = createElement('span', { attrs: { class: 'list__item__photo' }, innerHTML: isHeader?'IMAGE':'' });
    
            let item__uid = createElement('span', { attrs: { class: 'list__item__uid' }, innerHTML: isHeader?'ID':option.id });
            let item__email = createElement('span', { attrs: { class: 'list__item__email always' }, innerHTML: isHeader?'EMAIL':data.email });
            let item__level = createElement('span', { attrs: { class: 'list__item__level always' }, innerHTML: isHeader?'':`${data.level}` });

            item.append(item__photo);
            item.append(item__uid);
            item.append(item__email);
            item.append(item__level);

            if(isHeader) {
                item.classList.add('header');
            }else {
                let item__photo_img = createElement('img');
                item__photo.append(item__photo_img);
                if(data.photo_url)item__photo_img.src = data.photo_url;
                item__level.onclick = () => {
                    if (confirm('권한 레벨을 변경하시겠습니까?')) {
                        let level = parseInt(prompt('새로운 권한 레벨 [0-5]'));
                        if(data.level == level || level === NaN) return;
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
    post: {

    },
    board: {

    },
    category: {

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
    let { replication, createItem, cursor, alias } = { ...TAB_DEFAULT_SPEC, ...TAB_SPEC[type] };
    if (!replication && TabList.find(tab => tab.type == type)) return logger.warn(`warnning!! '${type}' cant't have deuplicated Tabs`);

    let id = `tab_${Math.floor(Math.random() * 1000000).toString(16)}`;
    let tab = createElement('tab', { attrs: { id } });
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
    tab__list.prepend(createItem({},true));

    load();

    function load() {
        cursor.next().then(list => {
            if (list.length < 1) tab__list__button.remove();
            for (let option of list) {
                tab__list__button.before(createItem(option));
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