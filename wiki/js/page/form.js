let author_uid;
let old_data = {}
let isOwner = false;

window.addEventListener('load', function () {
    init_componentList();
    init_timestamp();
});

function init_timestamp() {
    let date = new Date();
    date.setHours(date.getHours() - (date.getTimezoneOffset() / 60));
    main__header__timestamp.value = date.toISOString().split('.')[0];
}

function init_componentList() {
    let component_list = document.querySelector('.component_list');
    for (let specname in COMPONENT_SPEC) {
        let spec = COMPONENT_SPEC[specname];
        if (spec.hidden) continue;
        if (spec.title == undefined) continue;
        let li = createElement('li', {
            attrs: {
                type: specname,
                draggable: true
            },
            innerHTML: spec.title
        });

        let add_btn = createElement('button', {
            attrs: {
                class: 'mdi mdi-plus'
            }, on: {
                click: () => {
                    main__contents.append(createComponent(specname));
                }
            }
        });
        li.ondragstart = dragstart;
        li.append(add_btn);
        component_list.append(li);
    }
}

async function loadBoardSuggest() {
    if (typeof input_menu != 'undefined') {
        input_menu.querySelector('.input_suggest').innerHTML = '';
        if (SuggestList['board'] == undefined || SuggestList['board'].length < 1) SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
        for (let data of board2Path(SuggestList['board'])) addSuggest(data, input_menu);

        let li = createElement('li', { innerHTML: '+ 새로운 메뉴 추가', styles: { background: 'var(--clr-primary-46)', cursor: 'pointer' } });
        li.onmousedown = () => modal('addMenu');
        input_menu.querySelector('.input_suggest').append(li);
    }
}

async function loadCategorySuggest() {
    if (typeof input_categories != 'undefined') {
        input_categories.querySelector('.input_suggest').innerHTML = '';
        if (SuggestList['category'] == undefined || SuggestList['category'].length < 1) SuggestList['category'] = (await firebase.categories.list()).docs.map(doc => doc.data());
        for (let data of SuggestList['category']) addSuggest(data, input_categories);

        let li = createElement('li', { innerHTML: '+ 새로운 카테고리 추가', styles: { background: 'var(--clr-primary-46)', cursor: 'pointer' } });
        li.onmousedown = () => modal('addCategory');
        input_categories.querySelector('.input_suggest').append(li);
    }
}

async function firebaseLoadCallback() {
    firebase.auth.check(user => {
        document.body.classList.remove('non-auth');
        author_uid = author_uid || user.uid;
    }, () => {
        document.body.classList.add('non-auth');
        alert('비 정상적 접근입니다. 로그인을 먼저 진행해 주세요.');
        location.href = ROOT_PATH;
        return;
    });

    loading(0);
    await loadBoardSuggest();
    loading(0.15);
    await loadCategorySuggest();
    loading(0.3);

    if (post_id) {
        document.querySelector('aside').append(createElement('button', {
            attrs: { class: 'danger' },
            on: { click: e => { remove(e.target) } },
            innerHTML: '삭제하기'
        }));

        let data = (await firebase.post.selectOne(post_id)).data();
        loading(0.6);

        if (data == undefined) return NetErrorHandler(404);

        document.title = `${PAGE_PREFIX}문서 수정 - ${data.title}`;

        old_data = data;
        buildForm(data);
        loading(0.75);
    }
    document.body.classList.remove('loading');

    let { next } = firebase.post.list({ board_name: 'template' }, true);
    next().then(docs => {
        for (let doc of docs) {
            let data = doc.data();
            let li = createElement('li', { attrs: { value: data.title } });
            li.onmousedown = () => {
                li.parentNode.previousElementSibling.value = data.title;
                buildForm(data);
                post_menu.value = '';
            }
            input_template.querySelector('.input_suggest').append(li);
        }
        loading(1);
    }).catch(firebaseErrorHandler);
}
function buildForm(data) {
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        contents,
        author
    } = data;

    isOwner = author == author_uid;
    author_uid = author || author_uid;

    main__header__title.value = title;
    main__header__timestamp.value = new Date(1000 * timestamp.seconds + (1000 * 60 * 60 * 9)).toISOString().split('.')[0];
    post_categories.value = category;
    post_menu.value = board_name_arr ? board_name_arr.join(' > ') : board_name;

    for (let content of contents) {
        if (typeof content.value == 'string') {
            content.value = { value: content.value };
        }
        main__contents.append(createComponent(content.type, content.value));
    }
}

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
                main__contents.append(createComponent(type, { file }));
                break;
            default:
                dev.warn('no support type :', type);
                alert('지원하지 않는 파일형식 이거나 폴더 입니다');
                break;
        }
    });
}
function dragover(e) {
    e.preventDefault();
}
function dragstart(e) {
    let type = e.target.getAttribute('type');
    let df = e.dataTransfer;
    df.setDragImage(getDragImage(type), e.offsetX, e.offsetY);
    df.setData("component", type);
}

getDragImage = (() => {
    let images = []
    return function (type) {
        if (images[type]) return images[type];
        var canvas = document.createElement("canvas");
        canvas.height = 50;
        canvas.width = 150;
        var ctx = canvas.getContext("2d");
        ctx.rect(0, 0, 150, 50);
        ctx.fillStyle = '#f7f9f9';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = `20px "Yeongdeok Sea"`;
        ctx.fillText(COMPONENT_SPEC[type].title, 48, 31);
        ctx.beginPath();
        ctx.arc(25, 25, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#1d9bf0aa';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('+', 20, 33);
        dataUrl = canvas.toDataURL();
        let image = document.createElement('img');
        image.src = dataUrl;
        images[type] = image;
        return image;
    }
})();

function createComponent(type, option = {}) {

    let id = 'c_' + Math.floor(Math.random() * 1000000).toString(16);
    option.id = id;

    let spec = COMPONENT_SPEC[type];

    let component = createElement('div', { attrs: { class: `component ${type}`, draggable: true, id } });

    let title = createElement('p', { innerHTML: spec.title });
    component.append(title);

    let component__remove_btn = createElement('button', { attrs: { class: 'component__remove_btn mdi mdi-trash-can' } });
    let component__move_btn_up = createElement('button', { attrs: { class: 'component__move_btn up' } });
    let component__move_btn_down = createElement('button', { attrs: { class: 'component__move_btn down' } });
    component.append(component__remove_btn);
    component.append(component__move_btn_up);
    component.append(component__move_btn_down);

    if (spec.more_option) title.append(spec.more_option(option));
    component.append(spec.option(option));
    component.append(spec.input(option));

    component.ondragstart = (e) => {
        e.dataTransfer.setData("component", id);
        e.dataTransfer.setDragImage(getDragImage(type), 100, 25);
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
    component__move_btn_up.onclick = function () {
        if (component.previousElementSibling) component.previousElementSibling.before(component);
        component.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    component__move_btn_down.onclick = function () {
        if (component.nextElementSibling) component.nextElementSibling.after(component);
        component.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    return component;
}

function createOption(arr = []) {
    let div = createElement('div', { attrs: { class: 'component__option' } });
    let inputs = {};
    for (let option of arr) {
        let { label, text, type, name, value, attr, button } = option;
        if (label) {
            div.append(createElement('span', { attrs: { ...attr, class: 'component__option__label' }, innerHTML: label }));
        } else if (text) {
            div.append(document.createTextNode(text));
        } else if (button) {
            let btn = createElement('button', { attrs: { ...attr, class: `component__option__button ${button}` } });
            div.append(btn);
            inputs[button] = btn;
        } else {
            let inputContainer = createElement('div', { attrs: { class: `component__option__input ${name}`, ondragstart: 'event.preventDefault();event.stopPropagation();', draggable: true } });
            let input = createElement('input', { attrs: { ...attr, type }, value });
            inputContainer.append(input);
            div.append(inputContainer);
            inputs[name] = input;
        }
    }
    div.inputs = inputs;
    return div;
}

function createMoreOption(render_fn) {
    let component__more = createElement('button', { attrs: { class: 'component__more' } });
    let component__more__list = createElement('ul', { attrs: { class: 'component__more__list' } });
    let component__more__list__close = createElement('button', { attrs: { class: 'component__more__list__close' } });

    component__more.append(component__more__list);
    component__more__list.append(component__more__list__close);
    for (let option of render_fn(default_render_li)) component__more__list.append(option);

    return component__more;

    function default_render_li(icon, text, func = () => { }) {
        return createElement('li', { attrs: { class: `mdi mdi-${icon}`, tabindex: 1 }, on: { mousedown: func }, innerHTML: text });
    }
}

const COMPONENT_SPEC = {
    textbox: {
        title: '텍스트 박스',
        option: createTextboxOpt,
        input: (option) => {
            return createElement('div', {
                attrs: { contenteditable: true, placeholder: '여기에 텍스트를 입력하세요', ondragstart: 'event.preventDefault();event.stopPropagation();', draggable: true },
                on: {
                    ondragstart: e => {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    blur: () => {
                        let s = window.getSelection();
                        option.lastSelection = {
                            anchorNode: s.anchorNode,
                            anchorOffset: s.anchorOffset,
                            focusNode: s.focusNode,
                            focusOffset: s.focusOffset,
                        };
                    },
                    paste: e => {
                        e.preventDefault();
                        document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
                    }
                },
                innerHTML: option.value || ''
            });
        },
        getData: component => {
            return component.querySelector('[contenteditable]').innerHTML;
        }
    },
    image: {
        title: '이미지',
        option: option => COMPONENT_SPEC.default.option(option),
        input: ({ file, value }, mediaTytpe = 'image') => {
            let tagName = mediaTytpe == 'image' ? 'img' : mediaTytpe;
            let media, fragment = document.createDocumentFragment();
            let input = createElement('input', { attrs: { type: 'file', accept: `${mediaTytpe}/*` } });
            let inputHidden = createElement('input', { attrs: { type: 'hidden' } });
            fragment.append(input);
            fragment.append(inputHidden);

            input.oninput = () => {
                addImg(URL.createObjectURL(input.files[0]));
            }

            input.onclick = e => {
                if (mediaTytpe != 'image') return;
                e.preventDefault();
                e.stopPropagation();
                modal('addImg', src => {
                    inputHidden.value = src;
                    addImg(src);
                })
            }

            if (file) {
                let dataTranster = new DataTransfer();
                dataTranster.items.add(file);
                input.files = dataTranster.files;
                input.oninput();
            }
            if (value) {
                inputHidden.value = value;
                if (value.startsWith('http')) {
                    addImg(value);
                } else {
                    firebase.storage.getUrl(value).then(addImg);
                }
            }

            function addImg(src) {
                if (media) media.remove();
                media = createElement(tagName, { attrs: { controls: mediaTytpe != 'image', src: src } });
                input.after(media);
            }
            return fragment;
        },
        getData: async component => {
            let file = component.querySelector('input[type="file"]').files[0];
            let value = component.querySelector('input[type="hidden"]')?.value;
            if (file) {
                let fileName = `${component.getAttribute('id')}/${file.name}`;
                if (FILE_UPLOAD_METHOD == 0 && `${file.type}`.startsWith('image')) {
                    let result = await uploadByImgur(file);
                    if (result.status === 200) {
                        fileName = result.data.link;
                    } else {
                        alert('Imgur사이트 파일 업로드에 실패했습니다.');
                        if (confirm('다시 시도하겠습니까?')) await firebase.storage.upload(fileName, file);
                    }
                } else {
                    await firebase.storage.upload(fileName, file);
                }
                return fileName;
            } else if (value) {
                return value;
            }
            else return 'undefined';
        }
    },
    audio: {
        hidden: true,
        title: '음악',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.image.input(option, 'audio'),
        getData: component => COMPONENT_SPEC.image.getData(component)
    },
    video: {
        hidden: true,
        title: '영상',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.image.input(option, 'video'),
        getData: component => COMPONENT_SPEC.image.getData(component)
    },
    table: {
        title: '도표',
        more_option: (option) => createMoreOption(render_fn => [
            render_fn('plus', '왼쪽에 열 1개 삽입', e => option.col_input.oninput(e, 1, true)),
            render_fn('plus', '오른쪽에 열 1개 삽입', e => option.col_input.oninput(e, 1)),
            render_fn('plus', '위에 행 1개 삽입', e => option.row_input.oninput(e, 1, true)),
            render_fn('plus', '아래에 행 1개 삽입', e => option.row_input.oninput(e, 1)),
            render_fn('minus', '왼쪽에 열 1개 삭제', e => option.col_input.oninput(e, -1, true)),
            render_fn('minus', '오른쪽에 열 1개 삭제', e => option.col_input.oninput(e, -1)),
            render_fn('minus', '위에 행 1개 삭제', e => option.row_input.oninput(e, -1, true)),
            render_fn('minus', '아래에 행 1개 삭제', e => option.row_input.oninput(e, -1)),
        ]),
        option: (option) => {
            let { rowcount, header, outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc' } = option;
            let frag = document.createDocumentFragment();
            let option_1 = createOption([
                { label: '가로 x 세로 크기' },
                { name: 'col', type: 'number', value: header?.length || 3, attr: { min: 1 } },
                { text: 'x' },
                { name: 'row', type: 'number', value: rowcount || 3, attr: { min: 1 } }
            ]);

            option_1.inputs.col.oninput = function (e, v, isPrepend) {
                if (v) this.value = parseInt(this.value) + v;
                if (!this.validity.valid) return false;
                if (isPrepend) option.table.isPrepend = true;
                option.table.colcount = this.value;
                if (isPrepend) option.table.isPrepend = false;
            }

            option_1.inputs.row.oninput = function (e, v, isPrepend) {
                if (v) this.value = parseInt(this.value) + v;
                if (!this.validity.valid) return false;
                if (isPrepend) option.table.isPrepend = true;
                option.table.rowcount = this.value;
                if (isPrepend) option.table.isPrepend = false;
            }

            option.row_input = option_1.inputs.row;
            option.col_input = option_1.inputs.col;

            frag.append(option_1);

            let option_2 = createOption([
                { label: '외각선 색상' },
                { name: 'outer', type: 'color', value: outerLineColor },
                { label: '굵기' },
                { name: 'outer_width', type: 'number', value: outerLineWidth, attr: { min: 1, step: 1 } }
            ]);

            option_2.inputs.outer.oninput = function () {
                option.table.outerLineColor = this.value;
            }

            option_2.inputs.outer_width.oninput = function () {
                if (!this.validity.valid) return false;
                option.table.outerLineWidth = this.value;
            }

            frag.append(option_2);

            let option_3 = createOption([
                { label: '내부선' },
                { name: 'inner', type: 'color', value: innerLineColor }
            ]);

            option_3.inputs.inner.oninput = function () {
                option.table.innerLineColor = this.value;
            }

            frag.append(option_3);

            let option_4 = createOption([
                { label: '셀 체우기' },
                { name: 'cell', type: 'color', value: '#ffffff' },
                { label: '삽입' },
                { button: 'image' },
                { button: 'link' }
            ]);

            option.cell_input = option_4.inputs.cell;

            option_4.inputs.cell.oninput = function () {
                if (option._lastCell == undefined) return;
                option._lastCell.setStyles({ 'background-color': this.value });
                option._lastCell._background = this.value;
            }

            option_4.inputs.image.onclick = () => {
                if (option._lastCell == undefined) return alert('셀을 먼저 선택해 주세요.');
                modal('addImg', src => {
                    option._lastCell.firstChild.append(document.createTextNode(`[image:${src}]`));
                });

            }
            option_4.inputs.link.onclick = () => {
                if (option._lastCell == undefined) return alert('셀을 먼저 선택해 주세요.');
                let link = prompt('삽입할 링크를 입력해 주세요');
                if (link) option._lastCell.firstChild.append(document.createTextNode(`[link:${link}]`));
            }

            frag.append(option_4);

            return frag;
        },
        input: (option) => {
            let { rowcount, header, cells, cellColors, outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc' } = option;
            let div = createElement();
            let table = option.table = createElement('editable-table',
                { styles: { 'margin-top': 'var(--size-indent)' } },
                { rowcount: rowcount || 3, colcount: header?.length || 3 }
            );
            table.addEventListener('focusin', e => {
                option._lastCell = e.target.closest('.editable-table__cell:not(.header *)');
                option.cell_input.value = rgb2hex(option._lastCell?._background) || '#ffffff';
            });
            if (cells) table.setData(cells);
            if (header) table.setHeader(header);
            if (cellColors) table.setCellColors(cellColors);
            table.outerLineWidth = outerLineWidth;
            table.outerLineColor = outerLineColor;
            table.innerLineColor = innerLineColor;
            div.append(table);
            return div;
        },
        getData: component => {
            let table = component.querySelector('editable-table');
            return {
                rowcount: table.rowcount,
                header: table.header,
                cells: table.data,
                innerLineColor: table.innerLineColor,
                outerLineColor: table.outerLineColor,
                outerLineWidth: table.outerLineWidth,
                cellColors: table.cellColors
            };
        }
    },
    title: {
        title: '소제목',
        option: ({ depth = 1 }) => {
            let option_1 = createOption([
                { label: '목차 깊이' },
                { name: 'depth', type: 'number', value: depth, attr: { min: 1, max: 6, step: 1 } }
            ]);
            return option_1;
        },
        input: ({ text = '' }) => {
            return createElement('div', { attrs: { contenteditable: 'plaintext-only', placeholder: '여기에 텍스트를 입력하세요', ondragstart: 'event.preventDefault();event.stopPropagation();', draggable: true }, innerHTML: text });
        },
        getData: component => {
            return { text: component.querySelector('[contenteditable]').innerHTML, depth: component.querySelector('.depth>input').value || 1 };
        }
    },
    seperator: {
        title: '구분선',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: component => COMPONENT_SPEC.default.getData(component)
    },
    summury: {
        title: '목차',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: component => COMPONENT_SPEC.default.getData(component)
    },
    caption: {
        hidden: true,
        title: '틀',
        option: option => COMPONENT_SPEC.default.option(option),
        input: option => COMPONENT_SPEC.default.input(option),
        getData: component => COMPONENT_SPEC.default.getData(component)
    },
    youtube: {
        title: '유튜브 링크',
        option: (option) => {
            let option_1 = createOption([
                { label: '시작 시간(초)' },
                { name: 'start', type: 'number', value: option.start, attr: { min: 0, step: 1 } }
            ]);
            option_1.inputs.start.onchange = e => {
                option.adjust(e.target.value, 'start');
            }
            return option_1;
        },
        input: (option) => {
            let frag = document.createDocumentFragment();
            let input = createElement('div', { attrs: { contenteditable: 'plaintext-only', placeholder: '링크를 삽입하세요', ondragstart: 'event.preventDefault();event.stopPropagation();', draggable: true }, innerHTML: option.link });
            let iframe = createElement('iframe', {
                attrs: {
                    title: 'YouTube video player',
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                    referrerpolicy: 'strict-origin-when-cross-origin',
                    allowfullscreen: true,
                    width: 530,
                    height: 315
                }
            })

            frag.append(input);
            frag.append(iframe);

            input.oninput = e => option.adjust(e.target.innerHTML, 'link');

            option.adjust = (value, type) => {
                if (type) option[type] = value;
                let video_id = getYoutubeId(option.link || '');
                let start = option.start || 0;
                iframe.src = `//www.youtube.com/embed/${video_id}?start=${start}`
            }
            option.adjust();
            return frag;
        },
        getData: component => {
            return { link: component.querySelector('[contenteditable]').innerHTML, start: component.querySelector('.start>input').value || 0 };
        }
    },
    default: {
        option: () => {
            return document.createDocumentFragment();
        },
        input: () => {
            return document.createDocumentFragment();
        },
        getData: component => {
            return '';
        }
    }
}

const commands = [{
    cmd: "backColor",
    icon: "format-color-highlight",
    val: "#00ffff",
    input: "color",
    desc: "글씨에 형광펜 효과를 줍니다."
},
{},
{
    cmd: "bold",
    icon: "format-bold",
    desc: "굵은 글씨 효과"
},
{
    cmd: "italic",
    icon: "format-italic",
    desc: "기울임 꼴"
},
{
    cmd: "strikeThrough",
    icon: "format-strikethrough",
    desc: "취소선 효과"
},
{
    cmd: "underline",
    icon: "format-underline",
    desc: "밑줄 효과"
},
{},
{
    cmd: "fontSize",
    val: "20",
    input: "number",
    desc: "폰트 사이즈를 지정합니다. 기본값은 20px입니다."
},
{},
{
    cmd: "justifyLeft",
    icon: "format-align-left",
    desc: "좌측 정렬"
},
{
    cmd: "justifyCenter",
    icon: "format-align-center",
    desc: "가운데 정렬"
},
{
    cmd: "justifyRight",
    icon: "format-align-right",
    desc: "우측 정렬"
},
{},
{
    cmd: "formatBlock",
    icon: "format-quote-close",
    val: "<blockquote>",
    desc: "인용 하기"
},
{
    cmd: "createLink",
    icon: "link-variant",
    desc: "링크 생성",
    prompt: '생성할 링크를 입력해 주세요.',
    conv_fn: val => val.startsWith('http') ? val : 'http://' + val
},
{
    cmd: "insertImage",
    icon: "image-plus",
    modal: "addImg",
    desc: "링크 기반 이미지 삽입",
    conv_fn: val => val.startsWith('http') ? val : 'http://' + val
},
{
    cmd: "unlink",
    icon: "link-variant-off",
    desc: "링크 삭제"
},
{
    cmd: "removeFormat",
    icon: "format-clear",
    desc: "서식 지우기"
},
{
    cmd: "selectAll",
    icon: "select-all",
    desc: "전체 선택하기"
},
{
    cmd: "undo",
    icon: "undo",
    desc: "되돌리기"
},
{
    cmd: "redo",
    icon: "redo",
    desc: "다시하기"
}];

function createTextboxOpt(option) {
    let frag = createElement('div', { attrs: { class: 'component__execList' } });

    for (let command of commands) {
        let input;
        if (typeof command.cmd == "undefined") frag.append(createElement('span', { attrs: { class: 'separator' } }))
        if (!document.queryCommandSupported(command.cmd)) continue;
        if (typeof command.input !== "undefined") {
            switch (command.input) {
                case 'number':
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'number',
                            min: 12,
                            step: 1
                        },
                        on: {
                            change: e => {
                                if (e != undefined) {
                                    let selection = window.getSelection();
                                    let { anchorNode, anchorOffset, focusNode, focusOffset } = option.lastSelection;
                                    let range = document.createRange();
                                    range.setStart(anchorNode, anchorOffset);
                                    range.setEnd(focusNode, focusOffset);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, "7");
                                for (let font of document.querySelectorAll('[style*="xxx-large"]')) {
                                    font.style.fontSize = `${input.value / 10}rem` || "2rem";
                                }
                            }
                        },
                        value: 20
                    });
                    let plusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-plus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) + 1;
                                input.onchange();
                            }
                        }
                    });
                    let minusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-minus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) - 1;
                                input.dispatchEvent(new Event('change'));
                            }
                        }
                    });
                    frag.append(plusButton);
                    frag.append(input);
                    frag.append(minusButton);
                    break;
                case 'color':
                    let label = createElement('label', { attrs: { class: 'mdi mdi-format-color-highlight input_color' } });
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'color'
                        },
                        on: {
                            input: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            },
                            focus: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            }
                        },
                        value: command.val
                    });
                    label.append(input);
                    frag.append(label);
                    break;
            }
        } else {
            frag.append(createElement('button', {
                attrs: {
                    title: command.desc,
                    class: `mdi mdi-${command.icon}`
                },
                on: {
                    click: () => {
                        val = command.val || "";
                        if (command.modal) {
                            return modal(command.modal, src => {
                                val = command.conv_fn(src);
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, val || "");
                            });
                        }
                        if (command.prompt) val = command.conv_fn(prompt(command.prompt));
                        document.execCommand("styleWithCSS", 0, true);
                        document.execCommand(command.cmd, false, val || "");
                    }
                }
            }));
        }
    }

    return frag;
}

function remove(button) {
    if (!confirm('정말로 삭제 하시겠습니까?')) return;
    if (!isOwner) return alert('문서 최초 작성자만 삭제가 가능합니다. 필요시, 관리자에게 문의 주세요');
    button.setAttribute('disabled', true);
    firebase.post.deleteOne(post_id)
        .then(async () => {
            await firebase.search.unset(post_id);
            location.href = ROOT_PATH;
        })
        .catch(firebaseErrorHandler);
}

async function submit(button) {
    if (!confirm('작성한 내용을 업로드 하시겠습니까?')) return;
    if (!validate(main__header__title)) return;
    if (main__header__title.value.length > 25) return alert('문서 명은 최대 25자 까지 가능합니다.');
    if (!validate(post_categories)) return;
    if (!validate(post_menu)) return;
    button.setAttribute('disabled', true);
    let components = preview.active ? preview.frag.children : main__contents.getElementsByClassName('component');
    let contents = [];
    for (let c of components) {
        contents.push({
            type: c.classList[1],
            value: await COMPONENT_SPEC[c.classList[1]].getData(c)
        });
    }
    let data = {
        board_name: post_menu.value.split(' > ').pop(),
        board_name_arr: post_menu.value.split(' > '),
        category: post_categories.value,
        title: main__header__title.value,
        contents: contents,
        hidden: post_menu.value == 'template',
        use: true,
        timestamp: new Date(main__header__timestamp.value),
        author: author_uid
    };
    if (post_id) {
        data.updated_timestamp = new Date();
        firebase.post.updateOne(post_id, data)
            .then(async () => {
                await makeKeyword(post_id, data);
                location.href = `${ROOT_PATH}?post=${post_id}`
            })
            .catch(firebaseErrorHandler);
    } else {
        firebase.post.insertOne(data)
            .then(async ref => {
                if (ref == undefined) {
                    alert('권한이 없거나 자동 로그아웃 처리되었습니다. 다시 로그인 해주세요.');
                    location.href = ROOT_PATH;
                    return;
                }
                await makeKeyword(ref.id, data);
                location.href = `${ROOT_PATH}?post=${ref.id}`;
            })
            .catch(e => {
                alert('ERROR::저장에 실패했습니다::');
                dev.error(e);
            });
    }

}

async function makeKeyword(id, data) {
    if (data.hidden) return;
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        updated_timestamp,
        author,
        contents
    } = data
    let fullText = data.title.replace(/\s+/g, '');
    let title_arr = [];

    for (let start = 0; start < fullText.length; start++) {
        let max_length = fullText.length - start;
        for (let length = 1; length <= max_length; length++) {
            title_arr.push(fullText.substr(start, length))
        }
    }

    title_arr = [...new Set(title_arr)];

    let keyword_data = {
        title,
        board_name,
        category,
        timestamp,
        author,
    }

    let urlObj = contents.find(content => content.type == 'image');
    if (urlObj) keyword_data.thumbnail = urlObj.value;
    if (updated_timestamp) keyword_data.updated_timestamp = updated_timestamp;
    if (old_data.board_name_arr == undefined || data.board_name != old_data.board_name) keyword_data.board_name_arr = board_name_arr;
    if (old_data.title == undefined || old_data.title_arr == undefined || data.title.replace(/\s+/g, '') != old_data.title.replace(/\s+/g, '')) keyword_data.title_arr = title_arr;

    await firebase.search.set(id, keyword_data);
}

const preview = (function () {
    let _buildPost;
    let _component_keep_frag = document.createDocumentFragment();
    let _notEndFlag = false;
    return async function (input) {
        if (_notEndFlag) return;
        _notEndFlag = true;
        if (main.classList.contains('preview')) {
            delete preview.active;
            main__contents.innerHTML = '';
            while (_component_keep_frag.firstChild) {
                main__contents.append(_component_keep_frag.firstChild);
            }
            input_component.setStyles({ display: 'block' });
            document.querySelector('body > div.index')?.remove();
            main.classList.remove('preview');
        } else {
            preview.active = true;
            if (_buildPost == undefined) {
                const { buildPost } = await import(`../util-post.js?timestamp=${new Date().getTime()}`);
                _buildPost = buildPost;
                preview.frag = _component_keep_frag;
            }
            let contents = [];
            for (let c of Array.from(document.getElementsByClassName('component'))) {
                contents.push({
                    type: c.classList[1],
                    value: await COMPONENT_SPEC[c.classList[1]].getData(c)
                });
                _component_keep_frag.append(c);
            }
            let data = {
                contents: contents
            };
            input_component.setStyles({ display: 'none' });
            _buildPost(data, false);
            main.classList.add('preview');
        }
        if (input) {
            input.checked = preview.active;
            input.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
        _notEndFlag = false;
    }
})();