let app;
let files = [
    { name: 'files_1.txt' },
    { name: 'index.css' },
    { name: 'index', isFolder: true, children: [{ name: 'index.html' }] },
    { name: 'index.html' }
]
Vue.component('file', {
    props: {
        'name': { default: '[no_named_file]' },
        'isFolder': { default: false },
        'children': { default: () => [] },
        'onTab': {}
    },
    template: `
    <div class="aside_folder" v-if="isFolder">
        <div class="aside_line mdi mdi-folder" onclick="this.parentElement.classList.toggle('open')" tabindex="0"> {{ name }}</div>
        <file v-for="child in children" v-bind="{...child,onTab}"></file>
    </div>
    <div class="aside_line" v-else v-on:click="onTab.newSubTab({name, isFolder, onTab})" tabindex="0">{{ name }}</div>
    `
})

class Tab {
    constructor(app) {
        this._uid = Math.random();
        this._app = app;
        this._icon = 'mdi-radiobox-blank';
        this._nam = 'empty tab';
        this._subTabs = [];

        this._onSubTab = new SubTab();
    }

    newSubTab = ({
        name = 'file1.txt'
    }) => {
        let subTab = new SubTab(this, { name });
        this._subTabs.push(subTab);
        return subTab;
    }
}

class GameTab extends Tab {
    constructor(app) {
        super(app);
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
}

window.onload = () => {
    app = new Vue({
        el: '.bodyContainer',
        data: {
            files,
            tabs: [],
            onTab: new Tab(),
        },
        methods: {
        }
    });
    app.tabs.push(new Tab(app));
    app.tabs.push(new Tab(app));
    app.tabs.push(new Tab(app));
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
    console.log(1);

    for (let scrollbar of document.querySelectorAll('.h-scrollbar')) {
        console.log(scrollbar);
        let target = document.querySelector(scrollbar.getAttribute('target'));

        let w = target.getBoundingClientRect().width;
        let scroll_w = target.scrollWidth;
        let scroll_l = target.scrollLeft;
        let offset = w / scroll_w;
        let scroll_size_w = w * offset;
        
        console.log(offset, scroll_w, w);
        scrollbar.style.width = Math.floor(scroll_size_w) + 'px';
        scrollbar.style.left = Math.floor((w - scroll_size_w) * offset * (scroll_l - scroll_w) / scroll_l) + 'px';

        scrollbar.onmousedown = ()=>{
            
        }
    }
})