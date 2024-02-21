const TabState = {
    temp: 0,
    open: 1,
};

class Tab {
    constructor(_app) {
        this._uid = Math.random();
        this._app = _app;
        this._icon = "mdi-radiobox-blank";
        this._name = "empty";
        this._alias = "빈 탭";
        this._hide = false;
        this._subTabs = [];

        this._onSubTab = new SubTab();
    }
    closeSubTab(_uid) {
        editor.clear();
        this._app.onTab._subTabs = this._app.onTab._subTabs.filter(
            (sub) => sub._uid != _uid
        );
    }
    async addSubTab({ name, id }, temp = false) {
        let subTab_index = this._subTabs.findIndex(tab => tab._uid == id);
        let subTab =
            this._subTabs[subTab_index] ||
            new SubTab(this, { uid: id, name, state: TabState.temp });

        let temp_index = this._subTabs.findIndex(tab => tab._state == TabState.temp);

        if (subTab_index < 0) {
            if (temp_index < 0) {
                this._subTabs.push(subTab);
            } else {
                this._app.$set(this._app.onTab._subTabs, temp_index, subTab);
            }
        } else if (subTab._state == TabState.temp && !temp) subTab.set("state", TabState.open);

        if (
            this._app.onTab._onSubTab == undefined ||
            this._app.onTab._onSubTab._uid != id
        ) {
            this._app.onTab._onSubTab = subTab;
            editor.loadFile(subTab.file);
        }
    }
}

class SubTab {
    constructor(tab, props = {}) {
        this._uid = Math.random();
        this._tab = tab;
        for (let propName in props) this["_" + propName] = props[propName];
    }

    set = (p, v) => (this["_" + p] = v);

    get file (){
        return this._tab._app.files.find(this._uid).node.file;
    }
}

class GameTab extends Tab {
    constructor(_app) {
        super(_app);
        this._name = "game";
        this._alias = "게임";
        this._icon = "mdi-gamepad-square";
    }
}

class TextEditorTab extends Tab {
    constructor(_app) {
        super(_app);
        this._name = "text";
        this._alias = "문자열 편집기";
        this._icon = "mdi-file-multiple-outline";
    }
}

class FinderTab extends Tab {
    constructor(_app) {
        super(_app);
        this._name = "finder";
        this._alias = "검색";
        this._icon = "mdi-magnify";
    }

    get _onSubTab() {
        return this._app.tabs.find(tab => tab instanceof TextEditorTab)._onSubTab;
    }

    set _onSubTab(val) {
        this._app.tabs.find(tab => tab instanceof TextEditorTab)._onSubTab = val;
    }

    get _subTabs() {
        return this._app.tabs.find(tab => tab instanceof TextEditorTab)._subTabs;
    }

    set _subTabs(val) {
        this._app.tabs.find(tab => tab instanceof TextEditorTab)._subTabs = val;
    }
}

class ScrollEventManager {
    ListenerList = {};
    addEventListener = (target, _id, eventName, callback) => {
        if (typeof target == 'string') target = document.querySelector(target);
        if (this.ListenerList[_id]) target.removeEventListener(eventName, this.ListenerList[_id]);
        target.addEventListener(eventName, callback, { passive: true });
        this.ListenerList[_id] = callback;
    }
}

class CFile {
    constructor(fileHandle, file) {
        this.id = Math.random();
        if (fileHandle == null) return;
        this.name = fileHandle.name;
        this.kind = fileHandle.kind;
        this.type = file.type;
        this.children = [];
        this.handle = fileHandle;
        this.file = file;
    }

    write = async function (blob) {
        // Write the blob to the file.
        const writable = await this.handle.createWritable();
        await writable.write(blob);
        await writable.close();
    }

    find = (id, path = []) => {
        return this.id == id ? {node: this, path: [...path, this.name]} : undefined;
    }
}

class CDirectory {
    constructor(fileHandle) {
        this.id = Math.random();
        if (fileHandle == null) return;
        this.name = fileHandle.name;
        this.kind = fileHandle.kind;
        this.children = [];
        this.handle = fileHandle;
    }

    find = (id, path = []) => {
        const findChild = (id, _path = []) => {
            for(let child of this.children) {
                let result = child.find(id, _path);
                if(result) return result;
            }
        };
        return this.id == id ? {node: this, path: [...path, this.name]} : findChild(id, [...path, this.name]);
    }
}

async function getFolder() {
    navigator.userActivation.isActive = true;
    // Open file picker and destructure the result the first handle
    fileDB.get('workingDirectory', async ({ directoryHandle }) => {
        if (directoryHandle == undefined) {
            directoryHandle = await window.showDirectoryPicker({
                id: 'some_id',
                mode: 'read' || 'readWrite',
                startIn: 'desktop' || 'documents' || 'downloads' || 'music' || 'pictures' || 'videos'
            });
            fileDB.insertOne({ use: 'workingDirectory', directoryHandle });
        }

        const options = { mode: 'readwrite' };

        if (
            (await directoryHandle.queryPermission(options)) !== 'granted' &&
            (await directoryHandle.requestPermission(options)) !== 'granted'
        ) {
            return console.error('permission not allowed!!');
        } else app.files = await FileFactory(directoryHandle);
    });
}
async function FileFactory(entry) {
    if (entry.kind === "file") {
        return new CFile(entry, await entry.getFile());
    } else if (entry.kind === "directory") {
        let directory = new CDirectory(entry);
        for await (const handle of entry.values()) {
            directory.children.push(await FileFactory(handle));
        }
        return directory;
    }
}

Vue.component("file", {
    props: {
        id: {},
        name: { default: "[no_named_file]" },
        kind: { default: "file" },
        type: {},
        children: { default: () => [] },
        state: { type: Number },
        padding: { default: 2.2 }
    },
    methods: {
        drag(e, id){this.$parent.drag(e, id)},
        drop(e, id){this.$parent.drop(e, id)},
        dragover(e){this.$parent.dragover(e)},
        dragleave(e){this.$parent.dragleave(e)},
        file_prop_factory(instance, padding){ return this.$parent.file_prop_factory(instance, padding);},
        getOnTab(){return app.onTab;}
    },
    template: `
    <div class="aside_folder" v-if="kind == 'directory'"  v-on:dragover="dragover" v-on:drop="drop($event, id)" v-on:dragleave="dragleave">
        <div class="aside_line" onclick="openFolder.call(this)" tabindex="0" :style="'padding-left:'+padding+'rem;'" draggable="true" v-on:dragstart="drag($event, id)">{{ name }}</div>
        <file v-for="(child, index) in children" :key="index" v-bind="file_prop_factory(child, padding + 1.1)"></file>
    </div>
    <div class="aside_line" v-else 
        v-on:click="getOnTab().addSubTab({id, name}, true)"
        v-on:dblclick="getOnTab().addSubTab({id})"
        :type="type||name.split('.')[1]||'file'"
        :style="'padding-left:'+padding+'rem;'"
        tabindex="0" draggable="true" v-on:dragstart="drag($event, id, name)">{{ name }}</div>
    `,
});

function openFolder() {
    this.parentElement.classList.toggle('open');
    repaintScrollbar(document.querySelector('.v-scrollbar[target=".root.aside_folder"]'), false);
}