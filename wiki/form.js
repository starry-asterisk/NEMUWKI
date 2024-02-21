let main__contents;
function drop(e) {
    e.preventDefault();

    let type = e.dataTransfer.getData('component');
    if(type == undefined || type.startsWith('c_')) return;

    main__contents.append(createComponent(type));
}
function dragover(e) {
    e.preventDefault();
}
function dragstart(e) {
    e.dataTransfer.setData("component", e.target.getAttribute('type'));
}

function createComponent(type){

    let id = 'c_'+Math.floor(Math.random() * 1000000).toString(16);

    let spec = COMPONENT_SPEC[type];

    let component = document.createElement('div');
    component.setAttribute('id',id);
    component.setAttribute('draggable',true);
    component.classList.add('component',type);

    let title = document.createElement('p');
    title.innerHTML = spec.title;
    component.append(title);

    let component__remove_btn = document.createElement('button');
    component__remove_btn.classList.add('component__remove_btn','mdi','mdi-trash-can');
    component.append(component__remove_btn);
    
    component.append(spec.option());
    component.append(spec.input());

    component.ondragstart = (e) => {
        e.dataTransfer.setData("component", id);
        e.dataTransfer.setDragImage(component,e.offsetX, e.offsetY);
    }

    component.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let _id = e.dataTransfer.getData('component');
        let target;
        if(_id == undefined) return;
        if(_id.startsWith('c_')){
            target = document.getElementById(_id);
        }else {
            target = createComponent(_id);
        }
        if(component.getBoundingClientRect().height / 2 < e.offsetY) component.after(target);
        else component.before(target);
    }

    component__remove_btn.onclick = function(){
        component.remove();
    }

    return component;
}

const COMPONENT_SPEC = {
    textbox: {
        title: '텍스트 박스',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            let element = document.createElement('div');
            element.setAttribute('contenteditable', "plaintext-only");
            element.setAttribute('placeholder', "여기에 텍스트를 입력하세요");
            return element;
        }
    },
    image: {
        title: '이미지',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
    audio: {
        title: '음악',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
    video: {
        title: '영상',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
    table: {
        title: '도표',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
    title: {
        title: '소제목',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
    seperator: {
        title: '구분선',
        option: function(){
            return document.createDocumentFragment();
        },
        input: function(){
            return document.createDocumentFragment();
        }
    },
}

window.addEventListener('load',function(){
    main__contents = document.querySelector('.main__contents');
    main__contents.ondragover = dragover;
    main__contents.ondrop = drop;

    let component_list = document.querySelector('.component_list');
    for(let specname in COMPONENT_SPEC){
        let spec = COMPONENT_SPEC[specname];
        let li = document.createElement('li');
        li.setAttribute('type', specname);
        li.setAttribute('draggable', true);
        li.ondragstart = dragstart;
        li.innerHTML = spec.title;
        component_list.append(li);
    }
});

function addSuggest(data, input){
    let li = document.createElement('li');
    li.setAttribute('value',data.name);
    li.onmousedown = ()=>{
        li.parentNode.previousElementSibling.value = li.getAttribute('value');
    }
    input.querySelector('.input_suggest').append(li);
}