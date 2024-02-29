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
    email.oninput = () => div_validate(email);
    password.oninput = () => div_validate(password);
});

function login() {
    if (!div_validate(email, undefined, 'email')) return;
    if (!div_validate(password, undefined, 'password')) return;
    firebase.auth.login(email.innerHTML, password.innerHTML)
        .then(user => {
            if (user == undefined) throw { code: 'auth/invalid-credential' };
            firebase.auth.checkAdmin((isAdmin, user) => {
                if (isAdmin) {
                    loadAdmin(user);
                } else {
                    document.body.setAttribute('state', 'none-auth');
                    throw { code: 'admin-permission-denied' };
                }
            })
        })
        .catch(errorHandler);
}

function loadAdmin() {
    document.body.setAttribute('state', 'auth');
    testInit();
}

const logger = {
    ...console
}

const TabList = [];
const TAB_SPEC = {
    user: {
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
        return createElement('div',{attrs:{class:'list__item'}});
    }
}

function createTab(type) {

    if (TAB_SPEC[type] == undefined) return logger.warn(`the tab type '${type}' is NOT exist.`);
    let { replication, createItem, cursor, alias } = { ...TAB_DEFAULT_SPEC, ...TAB_SPEC[type] };
    if (!replication && TabList.find(tab => tab.type == type)) return logger.warn(`warnning!! '${type}' cant't have deuplicated Tabs`);

    let tab = createElement('tab');
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

    load();

    function load(){
        cursor.next().then(list => {
            for (let item_data of list) {
                tab__list__button.before(createItem(item_data));
            }
        });
    }

    let data = {
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
    console.log(name);
    for(let spec_name of Object.keys(TAB_SPEC)){
        workspace.append(createTab(spec_name).el.tab);
    }

}

window.addEventListener('input', e => {
    console.log(e.target);
})