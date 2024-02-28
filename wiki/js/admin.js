async function firebaseLoadCallback() {
    firebase.auth.checkAdmin((isAdmin, user) => {
        if(isAdmin){
            document.body.setAttribute('state','auth');
        } else {
            document.body.setAttribute('state','not-auth');
        }
    })
}

function login(){
    if (email.innerHTML == '') return;
    if (password.innerHTML == '') return;
    firebase.auth.login(email.innerHTML, password.innerHTML)
        .then(e => location.reload())
        .catch(errorHandler);
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
    replication: false,
    createItem: option => {

    },
    cursor: ()=>{
        return {
            next: ()=>[{},{},{},{},{},{},{},{},{},{}]
        }
    }
}

function createTab({type}){

    if(TAB_SPEC[type] == undefined) return logger.warn(`the tab type '${type}' is NOT exist.`);
    let {replication, createItem, cursor} = {...TAB_DEFAULT_SPEC, ...TAB_SPEC[type]};
    if(!replication && TabList.find(tab => tab.type == type)) return logger.warn(`warnning!! '${type}' cant't have deuplicated Tabs`);

    let tab = createElement('tab');
    let tab__top_menu = createElement('div',{attrs:{class:'tab__top_menu'}});
    let tab__search = createElement('div',{attrs:{class:'tab__search input search'}});
    let tab__search__input = createElement('div',{attrs:{contenteditable:'plaintext-only'}});
    let tab__search__button_go = createElement('button',{attrs:{class:'input__go'}});
    let tab__search__button_clear = createElement('button',{attrs:{class:'input__clear'}});
    let tab__list = createElement('div',{attrs:{class:'tab__list list'}});
    let tab__list__button = createElement('button',{attrs:{class:'list__more'}});

    tab.append(tab__top_menu);
    tab.append(tab__search);
    tab.append(tab__list);

    tab__search.append(tab__search__input);
    tab__search.append(tab__search__button_go);
    tab__search.append(tab__search__button_clear);

    tab__list.append(tab__list__button);

    cursor.next().then(list => {
        for(let item_data of list){
            tab__list__button.before(createItem(item_data));
        }
    });

    TabList.push({
        type,
        el: {
            tab, tab__search__input, tab__list
        }
    });

    return TabList[TabList.length - 1];
}

