class contextMenuOpt {
    static get global() {
        return contextMunuGlobal;
    }
    static get editor() {
        return contextMunuEditor;
    }
    static get nav_menu() {
        return contextMunuNav;
    }
    static get nav_tab() {
        let target = event.target;
        let itemList = [];
        let title = target.getAttribute('title');
        if (title) {
            add(`'${title}' 숨기기`, title);
            itemList.push({});
        }
        add('메뉴','메뉴',app.hide.nav_menu);
        itemList.push({});
        for (let tab of app.tabs) add(tab._alias, tab._alias, tab._hide);
        itemList.push({});
        add('계정','계정',app.hide.account);
        add('설정','설정',app.hide.setting);
        function add(name, title, icon = true){
            itemList.push({
                icon: icon?undefined:'check',
                name: `${name}`,
                disabled: false,
                callback: () => document.querySelector(`[title="${title || name}"]`).dispatchEvent(new Event('hide'))
            });
        }
        return itemList;
    }
    static get account() {
        return contextMunuAccount;
    }
    static get setting() {
        return contextMunuSetting;
    }
}

let contextMunuGlobal = [
    {
        name: 'open',
        disabled: false,
        callback: function () { }
    },
    {

    },
    {
        name: 'cut',
        disabled: true,
        callback: function () { }
    },
    {
        name: 'copy',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'paste',
        disabled: false,
        callback: function () { }
    }
];

let contextMunuEditor = [
    {
        name: '전체 선택',
        shortcut: 'Ctrl + A',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'a' })
    },
    {
        name: '찾기...',
        shortcut: 'Ctrl + F',
        disabled: false,
        callback: function () {alert('기능 구현중...')}
    },
    {

    },
    {
        name: '붙여넣기',
        shortcut: 'Ctrl + V',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'v' })
    },
    {
        name: '잘라내기',
        shortcut: 'Ctrl + X',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'x' })
    },
    {
        name: '복사하기',
        shortcut: 'Ctrl + C',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'c' })
    },
    {
        name: '삭제',
        shortcut: 'Ctrl + D',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: false, key: 'Delete' })
    },
    {

    },
    {
        name: '새로고침',
        shortcut: 'Ctrl + F5',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'f5' })
    }
];

let contextMunuNav = [
    {
        name: 'File',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'Finder',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'Game',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'Account',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'Setting',
        disabled: false,
        callback: function () { }
    },
];

let contextMunuAccount = [
    {
        name: 'starry-asterisk',
        disabled: false,
        callback: function () { }
    },
    {
    },
    {
        name: 'ho profile',
        disabled: false,
        callback: function () { }
    },
    {
    },
    {
        name: 'logout',
        disabled: false,
        callback: function () { }
    },
];


let contextMunuSetting = [
    {
        name: 'setting 1',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'setting 2',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'setting 3',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'setting 4',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'setting 5',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'setting 6',
        disabled: false,
        callback: function () { }
    },
];