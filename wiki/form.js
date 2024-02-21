let main__contents;
function drop(e) {
    e.preventDefault();
    let files = e.dataTransfer.files || e.dataTransfer.items;
    if (files.length > 0) return dropfile(files);
    let type = e.dataTransfer.getData('component');
    if (type == undefined || type.startsWith('c_')) return;

    main__contents.append(createComponent(type));
}

function dropfile(files) {
    [...files].forEach((file) => {
        let type = file.type.split('/')[0];
        switch (type) {
            case 'image':
            case 'video':
            case 'audio':
                main__contents.append(createComponent(type, {file}));
                break;
            default:
                console.warn('no support type :',type);
                alert('지원하지 않는 파일형식 이거나 폴더 입니다');
                break;
        }
    });

    /*
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile();
                console.log(`… file[${i}].name = ${file.name}`);
            }
        });
    }*/
}
function dragover(e) {
    e.preventDefault();
}
function dragstart(e) {
    e.dataTransfer.setData("component", e.target.getAttribute('type'));
}

function createComponent(type, option = {}) {

    let id = 'c_' + Math.floor(Math.random() * 1000000).toString(16);
    option.id = id;

    let spec = COMPONENT_SPEC[type];

    let component = document.createElement('div');
    component.setAttribute('id', id);
    component.setAttribute('draggable', true);
    component.classList.add('component', type);

    let title = document.createElement('p');
    title.innerHTML = spec.title;
    component.append(title);

    let component__remove_btn = document.createElement('button');
    component__remove_btn.classList.add('component__remove_btn', 'mdi', 'mdi-trash-can');
    component.append(component__remove_btn);

    component.append(spec.option(option));
    component.append(spec.input(option));

    component.ondragstart = (e) => {
        e.dataTransfer.setData("component", id);
        e.dataTransfer.setDragImage(component, e.offsetX, e.offsetY);
    }

    component.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let _id = e.dataTransfer.getData('component');
        let target;
        let files = e.dataTransfer.files || e.dataTransfer.items;
        if (files.length > 0) return dropfile(files);
        if (_id == undefined) return;
        if (_id.startsWith('c_')) {
            target = document.getElementById(_id);
        } else {
            target = createComponent(_id);
        }
        if (component.getBoundingClientRect().height / 2 < e.offsetY) component.after(target);
        else component.before(target);
    }

    component__remove_btn.onclick = function () {
        component.remove();
    }

    return component;
}

const COMPONENT_SPEC = {
    textbox: {
        title: '텍스트 박스',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            let element = document.createElement('div');
            element.setAttribute('contenteditable', "plaintext-only");
            element.setAttribute('placeholder', "여기에 텍스트를 입력하세요");
            return element;
        }
    },
    image: {
        title: '이미지',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = new Image();
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    audio: {
        title: '음악',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = document.createElement('audio');
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    video: {
        title: '영상',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function ({file}) {
            if(file){
                let el = document.createElement('video');
                el.src = URL.createObjectURL(file);
                return el;
            }
            return document.createDocumentFragment();
        }
    },
    table: {
        title: '도표',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        }
    },
    title: {
        title: '소제목',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        }
    },
    seperator: {
        title: '구분선',
        option: function () {
            return document.createDocumentFragment();
        },
        input: function () {
            return document.createDocumentFragment();
        }
    },
}

window.addEventListener('load', function () {
    main__contents = document.querySelector('.main__contents');
    main__contents.ondragover = dragover;
    main__contents.ondrop = drop;

    let component_list = document.querySelector('.component_list');
    for (let specname in COMPONENT_SPEC) {
        let spec = COMPONENT_SPEC[specname];
        let li = document.createElement('li');
        li.setAttribute('type', specname);
        li.setAttribute('draggable', true);
        li.ondragstart = dragstart;
        li.innerHTML = spec.title;
        component_list.append(li);
    }
});

function addSuggest(data, input) {
    let li = document.createElement('li');
    li.setAttribute('value', data.name);
    li.onmousedown = () => {
        li.parentNode.previousElementSibling.value = li.getAttribute('value');
    }
    input.querySelector('.input_suggest').append(li);
}