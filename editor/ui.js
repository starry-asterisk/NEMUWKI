let app;
let files = [
    { id: Math.random(), name: 'files_1.txt' },
    { id: Math.random(), name: 'index.css' },
    { id: Math.random(), name: 'index', isFolder: true, children: [{ name: 'index.html' }] },
    { id: Math.random(), name: 'index.html' }
]
Vue.component('file', {
    props: {
        'id': {},
        'name': { default: '[no_named_file]' },
        'isFolder': { default: false },
        'children': { default: () => [] },
        'state': { type: Number },
        'onTab': {},
        'padding': { default: 2.2 }
    },
    template: `
    <div class="aside_folder" v-if="isFolder" :style="'padding-left:'+padding+'rem;'">
        <div class="aside_line" onclick="this.parentElement.classList.toggle('open')" tabindex="0">{{ name }}</div>
        <file v-for="child in children" v-bind="{...child,onTab,padding: padding + 2.2}"></file>
    </div>
    <div class="aside_line" v-else 
        v-on:click="onTab.addSubTab({id, name, isFolder, onTab}, true)"
        v-on:dblclick="onTab.addSubTab({id})"
        :type="name.split('.')[1]||'file'"
        :style="'padding-left:'+padding+'rem;margin-left:'+(padding - 2.2)+'rem;'"
        tabindex="0">{{ name }}</div>
    `
})
const TabState = {
    temp: 0,
    open: 1
}

class Tab {
    constructor(_app) {
        this._uid = Math.random();
        this._app = _app;
        this._icon = 'mdi-radiobox-blank';
        this._nam = 'empty tab';
        this._subTabs = [];

        this._onSubTab = new SubTab();
    }

    addSubTab = ({
        name = 'file1.txt',
        id
    }, temp = false) => {
        let subTab = null, temp_index = this._subTabs.findIndex(subTab => subTab._state == TabState.temp);
        let state = temp ? TabState.temp : TabState.open;

        if (temp_index < 0) {
            if (temp_index = this._subTabs.findIndex(subTab => subTab._uid == id) > -1) return;
            this._app.onTab._onSubTab = subTab = create();
            this._subTabs.push(subTab);
        } else if (this._subTabs[temp_index]._uid === id) {
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
            subTab.set('state', state);
        } else {
            this._app.$set(this._app.onTab._subTabs, temp_index, create());
            this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
        }

        function create() {
            return new SubTab(this, { uid: id, name, state });
        }

        return subTab;
    }
}

class GameTab extends Tab {
    constructor(_app) {
        super(_app);
        this._nam = 'game develop';
        this._icon = 'mdi-gamepad-square';
    }
}

class SubTab {
    constructor(tab, props = {}) {
        this._uid = Math.random();
        this._tab = tab;
        for (let propName in props) this['_' + propName] = props[propName];
    }

    set = (p, v) => this['_' + p] = v;
}

window.onload = () => {
    app = new Vue({
        el: '.bodyContainer',
        updated: () => {
            repaintScrollbarVisible();
        },
        data: {
            files,
            tabs: [],
            onTab: new Tab(),
        },
        methods: {
            addTab: function () {
                let tab = new Tab(this);
                this.tabs.push(tab);
            },
            changeTab: function (tab) {
                this.onTab = tab;
            }
        }
    });
    app.addTab();
    app.addTab();
    app.addTab();
    app.onTab._app = app;

    let aside = document.querySelector('section');
    let resizer = document.querySelector('.resizer');

    resizer.onmousedown = e_down => {
        aside = document.querySelector('section');
        let pos = e_down.screenX;
        let width = aside.getBoundingClientRect().width;
        window.onmousemove = e_move => aside.style.width = `${width - e_move.screenX + pos}px`;
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        }
    }

}

window.addEventListener('resize', function () {
    repaintScrollbarVisible();
})

function repaintScrollbar(scrollbar) {
    let target = document.querySelector(scrollbar.getAttribute('target'));

    let w = target.getBoundingClientRect().width;
    let scroll_w = target.scrollWidth;
    let ratio = w / scroll_w;
    if (scroll_w - w < 2) return scrollbar.classList.add('unused');
    scrollbar.classList.remove('unused');

    let offset = target.scrollLeft / scroll_w;

    let min = 0, max = (scroll_w - w) * ratio;

    scrollbar.style.width = Math.floor(w * ratio) + 'px';
    scrollbar.style.left = Math.floor(w * offset) + 'px';

    scrollbar.onmousedown = e_down => {
        e_down.preventDefault();
        let pos = (parseInt(scrollbar.getAttribute('pos')) || 0);
        let pos_down = e_down.screenX;
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        }
        window.onmousemove = e_move => {
            let pos_move = e_move.screenX;
            let pos_final = between(min, max, (pos_move - pos_down + pos));
            target.scrollLeft = pos_final / ratio;
            scrollbar.style.left = pos_final + 'px';
        }
    }
}

function repaintScrollbarVisible() {
    for (let scrollbar of document.querySelectorAll('.h-scrollbar')) repaintScrollbar(scrollbar);
}

function between(min, max, value) {
    return Math.max(Math.min(max, value), min);
}


const editor = {
    focus: undefined,
    newLine: () => {
        editor.cnt.total++;
        let line_number = document.createElement('div');
        line_number.classList.add('line_number');
        line_number.innerHTML = editor.cnt.total;
        document.querySelector('.subTab__contents').append(line_number);
        let line = document.createElement('div');
        line.classList.add('line');
        document.querySelector('.subTab__contents').append(line);
        line.onclick = line_number.onclick = () => editor.focus = line;
        line.onclick();
    },
    cnt: {
        total: 0,
    },
    on: {
        keydown: ({ keyCode, key }) => {
            console.log(keyCode, key);
            if (keyCode > 64 && keyCode < 91) {
                editor.focus.append(document.createTextNode(key));
            } else {
                switch (keyCode) {
                    case 8:
                        editor.focus.innerHTML = '';
                        break;
                    case 13:
                        editor.newLine();
                        break;
                }
            }

        },
        keyup: ({ keyCode }) => {

        },
        click: () => {
            const sel = getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                const targetedNode = range.startContainer;
                const clickedLetter = targetedNode.textContent.substr(range.startOffset, 1);
                console.log(clickedLetter);
            }
        }
    }
}