class asideForm extends asideBase {
    constructor() {
        super();
        app.blockMode = true;
        this.data.Board = new Model(
            Options.get('board'),
            function (data) { this.ul.append(createOption({ ...data, value: data.value, text: data.path, is_owner: data.owner == app.user?.uid }, this)) },
            function () { for (let option of Array.from(this.ul.children)) if (option.tagName == 'N-OPTION') option.remove(); }
        );
        this.data.Categories = new Model(
            Options.get('categories'),
            function (data) { this.ul.append(createOption(data, this)) },
            function () { for (let option of Array.from(this.ul.children)) if (option.tagName == 'N-OPTION') option.remove(); }
        );
        let boardSelect = this.components.board = createSelect([], 0, true, '문서 분류').addClass('input');
        let cateSelect = this.components.cate = createSelect([], 0, true, '카테고리').addClass('input');
        let templateSelect = this.components.template = createSelect([], 0, true, '템플릿').addClass('input');
        this.data.Board.bind(boardSelect);
        this.data.Categories.bind(cateSelect);

        boardSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.board.deleteOne(id).catch(firebaseErrorHandler);
            return true;
        }
        boardSelect.ul.append(createElement('button').addClass('n-option-add').props({
            innerHTML: '+ 새로운 분류 추가', onmousedown(e) {
                e.stopPropagation();
                e.preventDefault();
                modal('addMenu');
            }
        }));

        cateSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.categories.deleteOne(id).catch(firebaseErrorHandler);
            return true;
        }
        cateSelect.ul.append(createElement('button').addClass('n-option-add').props({
            innerHTML: '+ 새로운 카테고리 추가', onmousedown(e) {
                e.stopPropagation();
                e.preventDefault();
                modal('addCategory');
            }
        }));
        templateSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.post.deleteTemporary(id).catch(firebaseErrorHandler);
            return true;
        }

        let ComponentModel = new Model(
            Object.keys(FormContent),
            function (namespace) {

                if (!FormContent[namespace].text) return;
                let li = createElement('li')
                    .css({ 'font-size': 'var(--font-size-regular)', cursor: 'pointer' })
                    .attrs({ draggable: true })
                    .props({
                        ondragstart(e) {
                            e.dataTransfer.setData("text", namespace);
                            article.ondragover = e2 => {
                                e2.preventDefault();
                            }
                            article.ondrop = e2 => {
                                e2.preventDefault();

                                let rect, now_pos, last_pos = 999;
                                let last_el;

                                for (let el of Array.from(article.querySelectorAll('.focusable'))) {
                                    rect = el.getBoundingClientRect();
                                    now_pos = rect.y + (rect.height * 0.5);
                                    if (Math.abs(now_pos - e2.clientY) > Math.abs(last_pos - e2.clientY)) continue;
                                    last_pos = now_pos;
                                    last_el = el;
                                }

                                let component = app_article.createForm(namespace, undefined, undefined, true);
                                if (last_el) {
                                    if (last_pos < e2.clientY) last_el.after(component);
                                    else last_el.before(component);
                                }
                                else article.append(component);
                                component.scrollIntoViewIfNeeded();
                            }
                        },
                        ondragend() {
                            article.ondrop = article.ondragover = null;
                        }
                    });
                li.append(
                    createElement('span').attrs({ class: 'tag icon', 'data-icon': FormContent[namespace].icon }).props({ onclick() { article.append(app_article.createForm(namespace, undefined, undefined, true)) } }),
                    createElement('span').attrs({ 'data-type': namespace }).props({ innerHTML: FormContent[namespace].text })
                );
                this.ul.append(li);
            }
        )


        let templateChk = createElement('input').attrs({ type: 'checkbox', class: '' }).props({ id: 'template_chk', onclick: setTemplate });
        let div = createElement('div').props({ innerHTML: '템플릿으로 사용' }).addClass('flex-horizontal');

        div.append(templateChk);

        aside.append(
            cateSelect,
            boardSelect,
            templateSelect,
            this.createBlockList('components', '컴포넌트', ComponentModel),
            createElement('button').props({ innerHTML: '게시하기', onclick: submit }).addClass('f_button').addClass('submit_btn').css({ 'max-width': '23rem', width: '100%' }),
            div
        );

        listenCategories();
        let { next } = firebase.post.list({ board_name: 'template' }, true);
        let datas = {};
        next().then(docs => {
            for (let doc of docs) {
                let data = datas[doc.id] = doc.data();
                templateSelect.ul.append(createOption({ value: doc.id, text: data.title, is_owner: data.author == app.user?.uid }, templateSelect));
            }
            templateSelect.onselchange = (id) => {
                let { contents } = datas[id];

                let appendList = [];
                for (let content of contents) {
                    let data = content.value;
                    let content_wrap = app_article.createForm(content.type, undefined, data, true);
                    switch (content.type) {
                        case 'textbox':
                            for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
                    }
                    appendList.push(content_wrap);
                }

                article.querySelectorAll('.focusable').forEach(el => el.remove());
                article.append.apply(article, appendList);
            }
            loading(1);
        }).catch(firebaseErrorHandler);
        this.data.Board.proceed();
        this.data.Categories.proceed();
    }
}
class articleForm extends articleBase {
    constructor(params) {
        super();
        this.contentBase = ContentBase;
        this.formBase = FormContent;
        let _this = this;

        if (app.user === false) {
            Notify.alert(TEXTS.warn.login_neccesary);
            move('login', true);
            return;
        }

        let ToolBarModel = new Model(
            [],
            function (namespace) {
                this.wrap.append(ToolBase[namespace](createElement('span').addClass(namespace), _this._focusedElement));
            },
            function () { emptyNode(this.wrap) }
        );

        let appendList = [
            this.createForm('toolbar', 'toolbar', ToolBarModel),
            this.createForm('bottomtoolbar'),
            this.createForm('main_header', 'main_header')
        ];

        ToolBarModel.bind(this.components['toolbar']);
        ToolBarModel.proceed();

        let post_id = params.get('post');
        if (post_id) {
            (async () => {
                if (post_id == 'random') post_id = await firebase.search.random();

                let doc = await firebase.post.selectOne(post_id);
                let data = doc.data();

                this.BeforeData = { id: doc.id, ...data };

                if (!data) return move('404');

                document.title = `${TEXTS.sitename} :: ${data.title}`;

                if (app_aside) {
                    app_aside.components.board.set(data.board_name);
                    app_aside.components.cate.set(data.category);
                }

                this.components.main_header.wrap.setData(data.title);

                for (let content of data.contents) {
                    let data = content.value;
                    let content_wrap = this.createForm(content.type, undefined, data, true);
                    switch (content.type) {
                        case 'textbox':
                            for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
                    }
                    appendList.push(content_wrap);
                }

                article.append.apply(article, appendList);
            })();
        } else {
            document.title = `${TEXTS.sitename} :: 새로운 문서`;
            article.append.apply(article, appendList);
        }
    }

    createForm(type, id = randomId(), model, focusable = false) {
        let wrap = createElement('div').attrs({ class: `form ${type}`, id, tabIndex: (this.tabIndex++), 'data-type': type });

        if (focusable) {
            let form__move = createElement('div').addClass('form__move');
            let form__move__up = createElement('button').addClass('form__move__up').props({ onclick() { wrap.prev('.focusable')?.before(wrap) } });
            let fomr__move__down = createElement('button').addClass('form__move__down').props({ onclick() { wrap.next('.focusable')?.after(wrap) } });
            let form__drag = createElement('button').addClass('form__drag');
            let form__del = createElement('button').addClass('form__del');

            wrap.addClass('focusable').onfocus = wrap.onfocusin = wrap.onclick = () => this.focusedElement = wrap;

            form__del.onclick = () => {
                wrap.remove();
                delete this.components[id];
                delete this.data[id];
                if (this.focusedElement == wrap) this.focusedElement = null;
            };

            form__drag.ontouchstart = form__drag.onmousedown = e1 => {
                e1.preventDefault();
                wrap.addClass('dragging');
                wrap.focus();
                let rect = wrap.getBoundingClientRect();
                let last_touch, first_touch = e1.touches ? e1.touches[0] : e1;
                let placeHolder = createElement('span').addClass('form__placeholder');
                window.ontouchmove = window.onmousemove = e2 => {
                    e2.preventDefault();
                    last_touch = e2.touches ? e2.touches[0] : e2;
                    wrap.css({ transform: `translate(${parseInt(last_touch.pageX - first_touch.pageX)}px, ${parseInt(last_touch.pageY - first_touch.pageY)}px)` });

                    let now_pos, last_pos = rect.y + (rect.height * 0.5);
                    let last_el;

                    for (let el of Array.from(article.querySelectorAll('.focusable')).filter(el => el != wrap)) {
                        rect = el.getBoundingClientRect();
                        now_pos = rect.y + (rect.height * 0.5);
                        if (Math.abs(now_pos - last_touch.clientY) > Math.abs(last_pos - last_touch.clientY)) continue;
                        last_pos = now_pos;
                        last_el = el;
                    }

                    if (last_el) {
                        if (last_pos < last_touch.clientY) last_el.after(placeHolder);
                        else last_el.before(placeHolder);
                    }
                }
                window.onmouseleave = window.onmouseup = window.ontouchend = () => {
                    window.onmouseleave = window.onmouseup = window.ontouchend = window.onmousemove = window.ontouchmove = null;
                    wrap.style.removeProperty('transform');
                    wrap.removeClass('dragging');
                    if (!last_touch) return;
                    placeHolder.replaceWith(wrap);
                    wrap.focus();
                }
            }

            form__move.append(form__move__up, form__drag, fomr__move__down);
            wrap.append(form__move, form__del);
        }

        this.components[id] = { wrap };
        this.data[id] = model;
        if (this.formBase[type]) { this.formBase[type].initialize.call(this, id, wrap, model); }
        return wrap;
    }

    destroy() { }
}

const FormContent = {
    toolbar: {
        initialize(id, wrap, model) { }
    },
    bottomtoolbar: {
        initialize(id, wrap, model) {
            let addBtn = createElement('button').attrs({ class: 'icon icon-plus preventable' });
            let previewBtn = createElement('button').props({ innerHTML: '미리보기', onclick: preview }).attrs({ class: 'previewBtn' });
            let submitBtn = createElement('button').props({ innerHTML: '게시', onclick: submit }).addClass('preventable').addClass('submit_btn');
            let options = [];
            for (let namespace in this.formBase) {
                if (!this.formBase[namespace].text) continue;
                options.push({ text: this.formBase[namespace].text, value: namespace });
            }
            let select = createSelect(options, 0).addClass('preventable');
            select.submit = () => addBtn.onmousedown();
            addBtn.onmousedown = e => {
                if (e) e.preventDefault();
                let textbox = this.createForm(select.dataset.value, undefined, undefined, true);
                if (this.focusedElement) this.focusedElement.after(textbox);
                else article.append(textbox);
                textbox.scrollIntoViewIfNeeded();
            };
            wrap.append(select, addBtn, previewBtn, submitBtn);
        }
    },
    main_header: {
        initialize(id, wrap, model) {
            let form__inputs = createElement('div').addClass('form__inputs').css({ 'grid-template-columns': '1fr' });
            let input_text = createElement('input').attrs({ type: 'text', placeholder: '예시 ) 캐릭터 A', name: 'text', id: randomId() }).css({ 'font-size': 'var(--font-size-large)' });
            let label_text = createElement('label').attrs({ for: input_text.id }).props({ innerHTML: '문서 제목' }).css({ 'font-size': 'var(--font-size-xlarge)', 'font-weight': 'bold' });
            form__inputs.append(label_text, input_text);
            wrap.append(form__inputs);
            wrap.getData = () => input_text.value;
            wrap.setData = newValue => input_text.value = newValue;
        }
    },
    title: {
        text: '소제목',
        icon: '󰗴',
        initialize(id, wrap, model = {}) {
            let form__inputs = createElement('div').addClass('form__inputs').css({ 'grid-template-columns': 'auto 1fr' });
            let input_depth = createElement('input')
                .attrs({ type: 'number', name: 'depth', min: 1, max: 6, step: 1, id: randomId() })
                .props({ onchange() { this.value = Math.min(Math.max(parseInt(this.value) || 1, 1), 6) }, value: model.depth || 1 }).css({ 'text-align': 'center' });
            let input_text = createElement('input').attrs({ type: 'text', placeholder: '예시) 목차 1', name: 'text', id: randomId() }).props({ value: model.text || '' });
            let label_depth = createElement('label').attrs({ for: input_depth.id }).props({ innerHTML: '목차 깊이' });
            let label_text = createElement('label').attrs({ for: input_text.id }).props({ innerHTML: '제목' });
            form__inputs.append(label_depth, input_depth, label_text, input_text);
            wrap.append(form__inputs);
            wrap.getData = () => {
                return {
                    depth: parseInt(input_depth.value) || 1, text: input_text.value
                };
            };
        }
    },
    textbox: {
        text: '텍스트박스',
        icon: '󱄽',
        initialize(id, wrap, html) {
            let input_text = createElement('div').attrs({
                contenteditable: true,
                placeholder: `텍스트박스.
                여기에 텍스트를 입력하세요.`,
                class: 'form__textbox'
            }).props({
                innerHTML: markdown(html || ''),
                onpaste(e) {
                    e.preventDefault();
                    document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
                },
                onblur() {
                    let s = window.getSelection();
                    lastSelection = {
                        anchorNode: s.anchorNode,
                        anchorOffset: s.anchorOffset,
                        focusNode: s.focusNode,
                        focusOffset: s.focusOffset,
                    };
                },
                oninput() {
                    this.toggleClass('empty', this.textContent.trim().length < 1);
                }
            });
            input_text.toggleClass('empty', input_text.textContent.trim().length < 1);
            wrap.append(input_text);
            wrap.getData = () => input_text.innerHTML;
        },
        buttons: ['foreColor', 'backColor', 'bold', 'italic', 'strikeThrough', 'underline', 'fontSize', 'justifyLeft', 'justifyCenter', 'justifyRight', 'formatBlock', 'createLink', 'insertImage', 'unlink', 'removeFormat', 'selectAll', 'undo', 'redo']
    },
    table: {
        text: '도표',
        icon: '󰓫',
        initialize(id, wrap, tableInfo = {}) {
            let { cells = [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], header = [20, 20, 20], cellColors, outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc', isFullWidth = false } = tableInfo;
            if (typeof cells[0] == 'string') cells = cells.map((value, idx) => { return { value }; });// 버전 차이 보정을 위한 코드
            if ('cellColors' in tableInfo) cellColors.forEach((color, idx) => { cells[idx].color = color; });// 버전 차이 보정을 위한 코드
            let nTable = createElement('n-table').props({ editable: true, cells, header, outerLineWidth, outerLineColor, innerLineColor, isFullWidth });
            let form__inputs = createElement('div').addClass('form__inputs').css({ display: 'block' });
            form__inputs.append(nTable);
            wrap.append(form__inputs);
            wrap.getData = () => {
                return {
                    cells: nTable.cells,
                    header: nTable.header,
                    outerLineWidth: nTable.outerLineWidth,
                    outerLineColor: nTable.outerLineColor,
                    innerLineColor: nTable.innerLineColor,
                    isFullWidth: nTable.isFullWidth
                };
            };
        },
        buttons: ['rowSize', 'colSize', 'outerLineColor', 'innerLineColor', 'cellBackgroundColor', 'outerLineWidth', 'insertCellImage', 'insertCellLink', 'fitToCell']
    },
    image: {
        text: '사진',
        icon: '󰋩',
        initialize(id, wrap, src) {
            let form__inputs = createElement('div').addClass('form__image');
            let form__img = createElement('img');
            let btn = createElement('button').addClass('f_button').props({ innerHTML: '이미지 선택' });
            let file_url = 'undefined';
            let adjust_src = src => {
                file_url = src;
                form__img.src = src.startsWith('http') ? src : firebase.storage.getStaticUrl(src);;
            };
            btn.onclick = () => {
                modal('addImg', adjust_src);
            }
            if (src) adjust_src(src);
            form__inputs.append(btn, form__img);
            wrap.append(form__inputs);
            wrap.getData = () => file_url;
        }
    },
    youtube: {
        text: '유튜브 링크',
        icon: '󰗃',
        initialize(id, wrap, model = {}) {
            let oninput = () => {
                let video_id = getYoutubeId(input_link.value);
                let start = input_time.value || 0;
                iframe.src = `//www.youtube.com/embed/${video_id}?start=${start}`;
                form__inputs.append(iframe);
            };
            let form__inputs = createElement('div').addClass('form__inputs').css({ 'grid-template-columns': 'auto 1fr' });
            let input_time = createElement('input')
                .attrs({ type: 'number', name: 'time', min: 0, step: 1, max: 100000, id: randomId(), placeholder: '시간(초)' })
                .props({ value: model.start, oninput })
                .css({ 'min-width': '6rem' });
            let input_link = createElement('input').attrs({ type: 'text', placeholder: '예시) https://youtu.be/video_id', name: 'link', id: randomId() }).props({ value: model.link || '', oninput })
            let label_time = createElement('label').attrs({ for: input_time.id }).props({ innerHTML: '시작 시간' });
            let label_link = createElement('label').attrs({ for: input_link.id }).props({ innerHTML: '유튜브 링크' });
            let iframe = createElement('iframe').attrs({
                title: 'YouTube video player',
                frameborder: '0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                referrerpolicy: 'strict-origin-when-cross-origin',
                allowfullscreen: true,
                width: 530,
                height: 315
            }).css({ 'grid-column': '1/3' });
            form__inputs.append(label_time, input_time, label_link, input_link);
            wrap.append(form__inputs);
            wrap.getData = () => {
                return {
                    start: parseInt(input_time.value) || 0, link: input_link.value
                };
            };
        }
    },
    seperator: {
        text: '구분선',
        icon: '󱋰',
        initialize(id, wrap) {
            let form__inputs = createElement('div').addClass('form__inputs');
            form__inputs.innerHTML = '구분선';
            wrap.append(form__inputs);
            wrap.getData = () => '';
        }
    },
    summury: {
        text: '목차',
        icon: '󰉻',
        initialize(id, wrap) {
            let form__inputs = createElement('div').addClass('form__inputs');
            form__inputs.innerHTML = '목차';
            wrap.append(form__inputs);
            wrap.getData = () => '';
        }
    },
}

function preview() {
    document.body.addClass('preview-mode');
    let contents = [app_article.createContent('zoom')];

    let summuryList = [];

    let index = 0;
    let depth = 1;
    let prefix = ''
    let t_infos = [];

    this.onclick = () => {
        this.onclick = preview;

        for (let el of contents) el.remove();
        article.style.removeProperty('zoom');
        document.body.removeClass('preview-mode');
    }
    for (let el of article.children) {
        if (!el.getData) continue;
        let data = (el.dataset.type == 'main_header') ? { text: el.getData() } : el.getData();
        let content_wrap = app_article.createContent(el.dataset.type, undefined, data);
        let default_;
        switch (el.dataset.type) {
            case 'title':
                default_ = { content: content_wrap, title: content_wrap.innerHTML };
                if (depth < data.depth) {
                    prefix += `${index}.`;
                    t_infos.push({ depth: ++depth, prefix, index_str: prefix + '1.', index: index = 1, ...default_ });
                } else if (depth == data.depth) {
                    t_infos.push({ depth, prefix, index: ++index, index_str: prefix + `${index}.`, ...default_ });
                } else {
                    let info = t_infos.findLast(info => info.depth == data.depth);
                    t_infos.push({ depth: depth = data.depth, prefix: prefix = info.prefix, index: index = info.index + 1, index_str: prefix + `${index}.`, ...default_ });
                }
                break;
            case 'summury':
                summuryList.push(content_wrap);
                break;
            case 'textbox':
                for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
        }
        contents.push(content_wrap);
    }

    if (summuryList.length > 0) t_infos.forEach(info => {
        info.content.prepend(createElement('a')
            .props({
                innerHTML: `${info.index_str} `, id: info.index_str.split('.').join('_'),
                onclick(e) { e.preventDefault(); history.pushState({}, '', '#summury'); summuryList[0].scrollIntoViewIfNeeded(); }
            })
            .attrs({ href: '#summury' }));
    });

    for (let sumurry of summuryList) {
        sumurry.append.apply(sumurry, t_infos.map(
            info =>
                createElement('a').attrs({ href: `#${info.index_str.split('.').join('_')}` })
                    .props({ innerHTML: `${info.index_str} <span>${info.title}</span>`, onclick(e) { e.preventDefault(); history.pushState({}, '', `#${info.index_str.split('.').join('_')}`); info.content.scrollIntoViewIfNeeded(); } })
                    .css({ 'margin-left': `${info.depth * 1.5}rem` })
        ))
    }

    article.append.apply(article, contents);
}

function execBuildVal(command, val) {
    return function () {
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, val || "");
    };
}

function execBuildPrompt(command, prompt_text, conv_fn = v => v) {
    return function () {
        var val = prompt(prompt_text) || "";
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, conv_fn(val));
    };
}

function execModal(command, modal_type, conv_fn = v => v, option) {
    return modal(modal_type, v => {
        if ('anchorNode' in lastSelection) {
            let selection = window.getSelection();
            let { anchorNode, anchorOffset, focusNode, focusOffset } = lastSelection;
            let range = document.createRange();
            range.setStart(anchorNode, anchorOffset);
            range.setEnd(focusNode, focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, conv_fn(v));
    }, option);
}

const ToolBase = {
    foreColor(wrap, option) {
        wrap.attrs({ title: '글씨에 형광펜 효과를 줍니다.' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-color-text'
            }).props({
                onclick: () => execModal('foreColor', 'colorPicker', hex => {
                    wrap.style.setProperty('--input-color', hex);
                    wrap.dataset.foreColor = hex;
                    return hex;
                }, wrap.dataset.foreColor)
            })
        );
        return wrap;
    },
    backColor(wrap, option) {
        wrap.attrs({ title: '글씨에 형광펜 효과를 줍니다.' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-color-highlight'
            }).props({
                onclick: () => execModal('backColor', 'colorPicker', hex => {
                    wrap.style.setProperty('--input-color', hex);
                    wrap.dataset.backColor = hex;
                    return hex;
                }, wrap.dataset.backColor)
            })
        );
        return wrap;
    },
    bold(wrap, option) {
        wrap.attrs({ title: '굵은 글씨 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-bold'
            }).props({ onclick: execBuildVal('bold') })
        );
        return wrap;
    },
    italic(wrap, option) {
        wrap.attrs({ title: '기울임 꼴' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-italic'
            }).props({ onclick: execBuildVal('italic') })
        );
        return wrap;
    },
    strikeThrough(wrap, option) {
        wrap.attrs({ title: '취소선 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-strikethrough'
            }).props({ onclick: execBuildVal('strikeThrough') })
        );
        return wrap;
    },
    underline(wrap, option) {
        wrap.attrs({ title: '밑줄 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-underline'
            }).props({ onclick: execBuildVal('underline') })
        );
        return wrap;
    },
    fontSize(wrap, option) {
        wrap.addClass('group').attrs({ title: '폰트 사이즈를 지정합니다. 기본값은 17px입니다.' });

        let bigger_btn = createElement('button').attrs({ class: `icon icon-plus` }).props({ onclick() { size_input.value = Number(size_input.value) + 1; size_input.dispatchEvent(new Event('change')); } });
        let size_input = createElement('input').props({
            value: 17, onchange(e) {
                if (e != undefined && 'anchorNode' in lastSelection) {
                    let selection = window.getSelection();
                    let { anchorNode, anchorOffset, focusNode, focusOffset } = lastSelection;
                    let range = document.createRange();
                    range.setStart(anchorNode, anchorOffset);
                    range.setEnd(focusNode, focusOffset);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                document.execCommand("styleWithCSS", 0, true);
                document.execCommand("fontSize", false, "7");
                for (let font of article.querySelectorAll('[style*="xxx-large"]')) {
                    font.style.fontSize = `${size_input.value}px` || "17px";
                }
            }
        }).attrs({ type: 'number', min: 12, step: 1 });
        let smaller_btn = createElement('button').attrs({ class: `icon icon-minus` }).props({ onclick() { size_input.value = Number(size_input.value) - 1; size_input.dispatchEvent(new Event('change')); } });

        wrap.append(bigger_btn, size_input, smaller_btn);
        return wrap;
    },
    justifyLeft(wrap, option) {
        wrap.attrs({ title: '좌측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-left'
            }).props({ onclick: execBuildVal('justifyLeft') })
        );
        return wrap;
    },
    justifyCenter(wrap, option) {
        wrap.attrs({ title: '가운데 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-center'
            }).props({ onclick: execBuildVal('justifyCenter') })
        );
        return wrap;
    },
    justifyRight(wrap, option) {
        wrap.attrs({ title: '우측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-right'
            }).props({ onclick: execBuildVal('justifyRight') })
        );
        return wrap;
    },
    formatBlock(wrap, option) {
        wrap.attrs({ title: '인용 하기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-quote-close'
            }).props({ onclick: execBuildVal('formatBlock', '<blockquote>') })
        );
        return wrap;
    },
    createLink(wrap, option) {
        wrap.attrs({ title: '링크 생성' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-link-variant'
            }).props({ onclick: execBuildPrompt('createLink', '생성할 링크를 입력해 주세요.', val => val.startsWith('http') ? val : 'http://' + val) })
        );
        return wrap;
    },
    insertImage(wrap, option) {//이미지 처리 모달 / conv_fn: val => val.startsWith('http') ? val : 'http://' + val
        wrap.attrs({ title: '링크 기반 이미지 삽입' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-image-plus'
            }).props({ onclick: () => execModal('insertImage', 'addImg', val => val.startsWith('http') ? val : 'http://' + val) })
        );
        return wrap;
    },
    unlink(wrap, option) {
        wrap.attrs({ title: '링크 삭제' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-link-variant-off'
            }).props({ onclick: execBuildVal('unlink') })
        );
        return wrap;
    },
    removeFormat(wrap, option) {
        wrap.attrs({ title: '서식 지우기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-clear'
            }).props({ onclick: execBuildVal('removeFormat') })
        );
        return wrap;
    },
    selectAll(wrap, option) {
        wrap.attrs({ title: '전체 선택하기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-select-all'
            }).props({ onclick: execBuildVal('selectAll') })
        );
        return wrap;
    },
    undo(wrap, option) {
        wrap.attrs({ title: '되돌리기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-undo'
            }).props({ onclick: execBuildVal('undo') })
        );
        return wrap;
    },
    redo(wrap, option) {
        wrap.attrs({ title: '다시하기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-redo'
            }).props({ onclick: execBuildVal('redo') })
        );
        return wrap;
    },
    rowSize(wrap, focusedElement) {
        wrap.addClass('group').attrs({ title: '행 크기 조절' });
        let table = focusedElement.querySelector('n-table');
        let size_input = createElement('input').props({
            value: table.rowcount, oninput: () => parseInt(size_input.value) && (table.rowcount = parseInt(size_input.value))
        }).attrs({ type: 'number', min: 1, step: 1 });

        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-table-row-plus-after'
            }).props({ onclick: () => table && table.rowcount++ && (size_input.value = table.rowcount) }),
            size_input,
            createElement('button').attrs({
                class: 'icon icon-table-row-remove'
            }).props({ onclick: () => table && table.rowcount-- && (size_input.value = table.rowcount) })
        );
        return wrap;
    },
    colSize(wrap, focusedElement) {
        wrap.addClass('group').attrs({ title: '열 크기 조절' });
        let table = focusedElement.querySelector('n-table');
        let size_input = createElement('input').props({
            value: table.colcount, oninput: () => parseInt(size_input.value) && (table.colcount = parseInt(size_input.value))
        }).attrs({ type: 'number', min: 1, step: 1 });

        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-table-column-plus-after'
            }).props({ onclick: () => table && table.colcount++ && (size_input.value = table.colcount) }),
            size_input,
            createElement('button').attrs({
                class: 'icon icon-table-column-remove'
            }).props({ onclick: () => table && table.colcount-- && (size_input.value = table.colcount) })
        );
        return wrap;
    },
    innerLineColor(wrap, focusedElement) {
        let table = focusedElement.querySelector('n-table');
        let span = createElement('span').addClass('color_swap').css({ 'background-color': table.innerLineColor });
        wrap.addClass('group').attrs({ title: '표 내부 테두리 색상' });
        wrap.props({ onclick: () => modal('colorPicker', val => table && (table.innerLineColor = span.style.backgroundColor = val), table?.innerLineColor) }).append(
            createElement('button').attrs({
                class: 'icon icon-border-inside'
            }),
            span
        );
        return wrap;
    },
    outerLineColor(wrap, focusedElement) {
        let table = focusedElement.querySelector('n-table');
        let span = createElement('span').addClass('color_swap').css({ 'background-color': table.outerLineColor });
        wrap.addClass('group').attrs({ title: '표 외부 테두리 색상' });
        wrap.props({ onclick: () => modal('colorPicker', val => table && (table.outerLineColor = span.style.backgroundColor = val), table?.outerLineColor) }).append(
            createElement('button').attrs({
                class: 'icon icon-border-outside'
            }),
            span
        );
        return wrap;
    },
    outerLineWidth(wrap, focusedElement) {
        wrap.addClass('group').attrs({ title: '표 외부 테두리 굵기' });
        let table = focusedElement.querySelector('n-table');
        let size_input = createElement('input').props({
            value: table.outerLineWidth, oninput: () => parseInt(size_input.value) && (table.outerLineWidth = parseInt(size_input.value))
        }).attrs({ type: 'number', min: 1, step: 1 });

        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-plus'
            }).props({ onclick: () => table && table.outerLineWidth++ && (size_input.value = table.outerLineWidth) }),
            size_input,
            createElement('button').attrs({
                class: 'icon icon-minus'
            }).props({ onclick: () => table && table.outerLineWidth-- && (size_input.value = table.outerLineWidth) })
        );
        return wrap;
    },
    cellBackgroundColor(wrap, focusedElement) {
        let table = focusedElement.querySelector('n-table');
        let span = createElement('span').addClass('color_swap').css({
            'background-color': (
                table.lastSelection?.dataset.color || '#ffffff'
            )
        });
        table.onSelChange = cell => (span.style.backgroundColor = cell.dataset.color || '#ffffff');
        wrap.addClass('group').attrs({ title: '셀 체우기 색상' });
        wrap.props({
            onclick: () => modal('colorPicker', val => {
                if (!table?.lastSelection) return;
                table.lastSelection.dataset.color = val;
                table.lastSelection.style.backgroundColor = val;
                span.style.backgroundColor = val;
            }, table?.lastSelection.dataset.color)
        }).append(
            createElement('button').attrs({
                class: 'icon icon-format-color-fill'
            }),
            span
        );
        return wrap;
    },
    insertCellLink(wrap, option) {//이미지 처리 모달 / conv_fn: val => val.startsWith('http') ? val : 'http://' + val
        wrap.attrs({ title: '링크 생성' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-link-variant'
            }).props({
                onclick: execBuildPrompt('insertHTML', '생성할 링크를 입력해 주세요', val => {
                    val = val.startsWith('http') ? val : 'http://' + val;
                    return `[link:${val}]`;
                })
            })
        );
        return wrap;
    },
    insertCellImage(wrap, focusedElement) {//이미지 처리 모달 / conv_fn: val => val.startsWith('http') ? val : 'http://' + val
        let table = focusedElement.querySelector('n-table');
        wrap.attrs({ title: '링크 기반 이미지 삽입' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-image-plus'
            }).props({
                onclick: () => modal('addImg', val => {
                    table.lastSelection && table.lastSelection.append(document.createTextNode(`[image:${val}]`));
                })
            })
        );
        return wrap;
    },
    fitToCell(wrap, focusedElement) {
        let table = focusedElement.querySelector('n-table');
        wrap.attrs({ title: '셀 여백 사용 설정' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-fit-to-page-outline'
            }).props({
                onclick: () => {
                    if (!table?.lastSelection) return;
                    table.lastSelection.dataset.fitToCell = table.lastSelection.dataset.fitToCell != 'true';
                }
            })
        );
        return wrap;
    },
}

function logoutCallback() {
    Notify.alert(TEXTS.warn.login_neccesary);
    history.back();
}
async function submit() {
    try {

        if (!Notify.confirm('작성한 내용을 업로드 하시겠습니까?')) return;

        let { board, cate } = app_aside.components;

        let formData = {
            board_name: board.dataset.value || '전체',
            board_name_arr: board.dataset.value ? board.dataset.selectedtext.split(' > ') : ['전체'],
            category: cate.dataset.value || '전체',
            title: '[이 값이 보이면 개발자한테 알려주세요]',
            contents: [],
            hidden: board.dataset.value == 'template'
        }

        for (let el of article.children) {
            if (!el.getData) continue;
            switch (el.dataset.type) {
                case 'main_header':
                    formData.title = el.getData();
                    break;
                default:
                    formData.contents.push({ type: el.dataset.type, value: el.getData() })
                    break;
            }
        }

        if (formData.title.length > 25) return alert('문서 명은 최대 25자 까지 가능합니다.');
        if (formData.title.length < 1) return alert('문서 명은 비워 둘 수 없습니다.');

        toggleSubmitMode();

        if (app_article.BeforeData) {
            formData.updated_timestamp = new Date();
            formData.timestamp = new Date(1000 * app_article.BeforeData.timestamp.seconds);
            formData.author = app_article.BeforeData.author;
            formData.use = app_article.BeforeData.use;
            firebase.post.updateOne(app_article.BeforeData.id, formData)
                .then(async () => {
                    await makeKeyword(app_article.BeforeData.id, formData);
                    app.blockMode = false;
                    move(`/?post=${app_article.BeforeData.id}`);
                })
                .catch(firebaseErrorHandler)
                .finally(() => toggleSubmitMode(false));
        } else {
            formData.updated_timestamp = new Date();
            formData.timestamp = formData.updated_timestamp;
            formData.author = app.user.uid;
            formData.use = true;
            firebase.post.insertOne(formData)
                .then(async ref => {
                    if (ref == undefined) {
                        alert('권한이 없거나 자동 로그아웃 처리되었습니다. 다시 로그인 해주세요.');
                        app.blockMode = false;
                        move('/');
                        return;
                    }
                    await makeKeyword(ref.id, formData);
                    app.blockMode = false;
                    move(`/?post=${ref.id}`);
                })
                .catch(e => {
                    Notify.alert('ERROR::저장에 실패했습니다::');
                    dev.error(e);
                }).finally(() => toggleSubmitMode(false));
        }
    } catch (e) {
        toggleSubmitMode(false);
        Notify.alert(e);
    }
}

function toggleSubmitMode(bool = true) {
    document.querySelectorAll('.submit_btn').forEach(el => el.disabled = bool);
    return true;
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
        title_arr,
        board_name,
        board_name_arr,
        category,
        timestamp,
        author,
    }

    let thumbnail, regex_result;
    for (let content of contents) {
        switch (content.type) {
            case 'image':
                thumbnail = content.value;
                break;
            case 'table':
                if (content.value.cells) for (let cell of content.value.cells) {
                    REGEX.image.lastIndex = 0;
                    regex_result = REGEX.image.exec(cell);
                    if (regex_result) {
                        thumbnail = regex_result[1];
                        break;
                    }
                }
                break;
            case 'textbox':
                REGEX.image.lastIndex = 0;
                regex_result = REGEX.image.exec(content.value);
                if (regex_result) {
                    thumbnail = regex_result[1];
                    break;
                }
                break;
        }
        if (thumbnail) break;
    }
    if (thumbnail) keyword_data.thumbnail = thumbnail;
    if (updated_timestamp) keyword_data.updated_timestamp = updated_timestamp;

    await firebase.search.set(id, keyword_data);
}
const setTemplate = (function () {
    let oldValue;
    return () => {
        template_chk.disabled = true;
        let { board, template } = app_aside.components;
        if (template_chk.checked) {
            oldValue = board.dataset.value;
            board.set('template');
            board.addClass('disabled');
            template.addClass('disabled');
        } else {
            board.set(oldValue || '');
            board.removeClass('disabled');
            template.removeClass('disabled');
        }
        setTimeout(() => { template_chk.disabled = false }, 100);
    };
})();

export { asideForm as aside, articleForm as article, logoutCallback };