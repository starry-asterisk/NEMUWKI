class asideProfile extends asideBase {
    constructor(param) {
        super();
        aside.addClass('fold');

        let params = new URLSearchParams();
        params.set('field', 'board_name_arr');
        params.set('operator', 'array-contains');

        let BoardModel = new Model(
            Options.get('board'),
            function (data) {
                let li = createElement('li');
                params.set('keyword', data.value);
                li.append(createElement('a').attrs({ href: `./profile?${params.toString()}`, class: 'tag' }).props({ innerHTML: data.path }));
                this.ul.append(li);
            },
            function () { emptyNode(this.ul) }
        );

        let VisitedModel = new Model(
            app.getVisited(),
            function ({ visited_id, title, board_name }) {
                let li = createElement('li');
                params.set('keyword', board_name);
                li.append(
                    createElement('a').attrs({ href: `./profile?${params.toString()}`, class: 'tag', 'data-board': board_name }).props({ innerHTML: board_name }),
                    createElement('a').attrs({ href: `./index?post=${visited_id}` }).props({ innerHTML: title })
                );
                this.ul.append(li);
            }
        )

        aside.append(
            this.createBlock('B000', `<h1><a class="logo s_button" href="./">${TEXTS.sitename}</a></h1>`),
            this.createSearch('search', param),
            this.createBlockList('Visited', TEXTS.recent_document, VisitedModel),
            this.createBlockList('Board', TEXTS.document_cate, BoardModel),
            this.createBlock('btn_upload', `<button class="s_button" onclick=" move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`),
            this.createBlock('btn_login', `<button class="s_button" onclick=" move('login')">${TEXTS.form.login}</button>`)
        );

        this.components.Board.ul.addClass('type2');
    }

    createSearch(id, param) {
        let wrap = createElement('div').addClass('f_block').css({ marginBottom: 'var(--spacing-large)' }).props({ id: `${id}_wrap` });
        let fold_btn = createElement('button').attrs({ class: 'menu_fold icon' }).props({ onclick() { aside.toggleClass('fold') } });
        let input = this.createInput(id).addClass('icon');
        let input_run = createElement('button').attrs({ class: 'input_run icon' }).props({ onclick() { search(); } });
        input.firstChild.attrs({ placeHolder: TEXTS.search_i }).props({ onkeydown(e) { e.keyCode == 13 && search(e); }, value: (param.get('keyword')) });

        function search(e) {
            if (e) e.preventDefault();
            move(`./?keyword=${input.firstChild.value}`);
        }

        wrap.append(fold_btn, input);
        input.append(input_run);

        return wrap;
    }
}
class articleProfile extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        this.formBase = FormContent;
        let uid = params.get('uid');
        document.title = `${TEXTS.sitename} :: ${TEXTS.site_profile}`;

        this.load = async () => {
            if (!uid) {
                if (app.user === null) return;
                else uid = app.user.uid;
            }
            if (uid == undefined) return move('404', true);
            this.load = () => { };
            loading(0.3);

            let user_data = await firebase.auth.getUser(uid);

            let data = user_data.data();
            if (data == undefined) return move('404', true);

            if (data.banner_url);

            params.set("uid", uid);
            move(`profile?${params.toString()}`, true, false);

            let op = params.get("operator") || "contains";
            let field = params.get("field") || "title_arr";
            let key = params.get("keyword");
            let search = key ? { [field]: { op, key } } : {};

            let permission = app.user?.uid === uid ? FINAL.PERMISSION.RW : FINAL.PERMISSION.R;

            article.append(
                this.createContent('zoom'),
                this.createContent('profile_header', undefined, {
                    uid,
                    banner_url: data.banner_url,
                    permission
                }),
                this.createContent('seperator'),
                this.createContent('textbox', undefined, { uid, permission, text: data.description || `<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${data.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>` }),
                this.createContent('seperator'),
                footer
            );

            loadBoardLists.bind(this)(data.board_setting, uid, search, permission);
            loading(1);
        };
        this.load();
    }


    createForm(type, id = randomId(), model, focusable = false, movable = false) {
        let wrap = createElement('div').attrs({ class: `form ${type}`, id, tabIndex: (this.tabIndex++), 'data-type': type });

        if (focusable) wrap.addClass('focusable').onfocus = wrap.onfocusin = wrap.onclick = () => this.focusedElement = wrap;

        if (movable) {
            let form__move = createElement('div').addClass('form__move');
            let form__move__up = createElement('button').addClass('form__move__up').props({ onclick() { wrap.prev('.focusable')?.before(wrap) } });
            let fomr__move__down = createElement('button').addClass('form__move__down').props({ onclick() { wrap.next('.focusable')?.after(wrap) } });
            let form__drag = createElement('button').addClass('form__drag');
            let form__del = createElement('button').addClass('form__del');

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

    destroy() {
        if (this.timeout_timer) clearTimeout(this.timeout_timer);
        if (this.interval_timer) clearInterval(this.interval_timer);
    }
}

function loginCallback() {
    app_article.load();
}

function logoutCallback() {
    app_article.load();
}

function parseBoardSetting(str = '0;1;전체 문서;;,1;2;인물;인물;') {
    return str.split(',').map(boardInfo => {
        const [
            order_str, type, title, category, board
        ] = boardInfo.split(';');
        return { order: parseInt(order_str), style: type == '1' ? 'table' : 'galery', type, title, category, board };
    }).sort((a, b) => a.order - b.order);
}

function loadBoardLists(str, uid, search, permission) {
    let appendList = [];
    let editList = []

    this.data.Board = new Model(
        Options.get('board'),
        null,
        function (datas) {
            for (let a of article.querySelectorAll('[data-board]')) {
                let board = datas.find(data => data.value == a.getAttribute('data-board'));
                if (board) a.innerHTML = board.path;
            }
        }
    );

    for (let info of parseBoardSetting(str)) {
        let id = randomId();

        let searchData = { ...search };
        if (info.category) searchData.category = { key: info.category, op: 'equal' };
        if (info.board) searchData.board_name_arr = { key: info.board, op: 'contains' };
        appendList.push(
            this.createContent('title', `title_${id}`, { text: info.title }),
            this.createContent('list', `list_${id}`, { style: info.style, keyword: uid, field: "author", operator: "equal", searchData })
        );
        this.data.Board.bind(this.components[`list_${id}`]);

        if (permission >= FINAL.PERMISSION.RW) {
            listenCategories();
            editList.push(this.createForm('board_setting', `setting_${id}`, info, true, true));
        }
    }

    if (permission >= FINAL.PERMISSION.RW && appendList.length > 0) {
        let buttons = createElement('div').attrs({ class: `profile_header__buttons` });
        let button = createElement('button').props({ innerHTML: '목록 수정' }).css({flex: 1});
        let button2 = createElement('button').props({ innerHTML: TEXTS.form.cancel });

        button2.onclick = function () {
            if(Notify.confirm('목록 설정을 취소하시겠습니까?')) location.reload();
        }
        
        let buttons2 = createElement('div').attrs({ class: `profile_header__buttons` });
        let button3 = createElement('button').props({ innerHTML: '+ 메뉴 추가' });

        button3.onclick = function () {
            buttons2.before(app_article.createForm('board_setting', undefined, { type: 1, title: '', category: '', board: '' }, true, true))
        }

        button.onmousedown = e => e.stopPropagation();
        button.onclick = function (e) {
            e => e.stopPropagation();
            this.innerHTML = TEXTS.form.apply;
            button2.css({flex: 1});
            button3.css({flex: 1});
            for (let el of appendList) el.remove();
            buttons2.append(button3);
            buttons.append(button2);
            article.append(buttons);
            for (let el of editList) article.append(el);
            article.append(buttons2, footer);
            appendList = [];
        }

        buttons.append(button);
        appendList.unshift(buttons);
    }

    appendList.push(footer);

    article.append.apply(article, appendList);

    this.data.Board.proceed();
}

const IndexContent = {
    ...ContentBase,
    textbox: {
        initialize(id, wrap, model) {
            ContentBase.textbox.initialize.call(this, id, wrap, model.text);
            let buttons = createElement('div').attrs({ class: `profile_header__buttons` }).css({ float: 'right' });

            buttons.append(
                createElement('button').props({
                    innerHTML: TEXTS.edit, onclick: () => {
                        let ToolBarModel = new Model(
                            [],
                            function (namespace) { this.wrap.append(ToolBase[namespace](createElement('span').addClass(namespace), app_article._focusedElement)); },
                            function () { emptyNode(this.wrap) }
                        );
                        let toolbar = app_article.createForm('toolbar', 'toolbar', ToolBarModel);
                        ToolBarModel.bind(app_article.components['toolbar']);
                        let textbox = app_article.createForm('textbox', undefined, model.text, true).addClass('vertical');
                        article.prepend(toolbar);
                        wrap.after(textbox);

                        let textbox_buttons = createElement('div').attrs({ class: `profile_header__buttons` }).css({ 'margin-left': 'auto' });
                        textbox_buttons.append(
                            createElement('button').props({
                                innerHTML: TEXTS.form.apply, onclick: () => {
                                    wrap.removeClass('hide');
                                    toolbar.remove();
                                    textbox.remove();
                                    emptyNode(wrap);
                                    wrap.innerHTML = model.text = textbox.getData();
                                    wrap.append(buttons);
                                    firebase.auth.updateUser(model.uid, { description: model.text });
                                }
                            }).css({ display: model.permission >= FINAL.PERMISSION.RW ? 'block' : 'none' }),
                            createElement('button').props({
                                innerHTML: TEXTS.form.cancel, onclick: () => {
                                    wrap.removeClass('hide');
                                    toolbar.remove();
                                    textbox.remove();
                                }
                            }).css({ display: model.permission >= FINAL.PERMISSION.RW ? 'block' : 'none' }),
                        );
                        textbox.append(textbox_buttons);
                        wrap.addClass('hide');
                        textbox.focus();
                    }
                }).css({ display: model.permission >= FINAL.PERMISSION.RW ? 'block' : 'none' })
            );

            wrap.append(buttons);
        }
    },
    profile_header: {
        initialize(id, wrap, model) {
            let buttons = createElement('div').attrs({ class: `profile_header__buttons` });

            buttons.append(
                createElement('button').props({ innerHTML: TEXTS.share, onclick: () => goShare('twitter') }).css({ display: model.permission >= FINAL.PERMISSION.R ? 'block' : 'none' }),
                createElement('button').props({
                    innerHTML: TEXTS.edit, onclick: e => {
                        e.preventDefault();
                        e.stopPropagation();
                        modal("addImg", (banner_url) => {
                            wrap.css({ 'background-image': `url(${banner_url})` });
                            firebase.auth.updateUser(model.uid, { banner_url });
                        });
                    }
                }).css({ display: model.permission >= FINAL.PERMISSION.RW ? 'block' : 'none' })
            );

            if (model.banner_url) wrap.css({ 'background-image': `url(${model.banner_url})` })
            wrap.append(buttons);
        }
    },
    list: {
        async initialize(id, wrap, model) {
            let { keyword, field, operator, searchData = {} } = model
            let docs, { next } = await firebase.search.list({ [field]: keyword, ...searchData }, operator, model.page_offset || 25);

            let load = async () => {
                list__footer.disabled = true;

                docs = await next();

                for (let doc of docs) {
                    let data = doc.data();

                    let row = createElement('span').attrs({ class: 'list__item' });
                    let board_anchor = createElement('a').attrs({ class: 'list__item__board_name', 'data-board': data.board_name, href: `./profile?field=board_name_arr&operator=array-contains&keyword=${data.board_name}` }).props({ innerHTML: data.board_name });
                    let post_anchor = createElement('a').attrs({ class: 'list__item__title', href: `./?post=${doc.id}` }).props({ innerHTML: data.title });


                    if (model.style == 'galery') {
                        let onclick = function () { move(post_anchor.href); }
                        let img_alt = createElement('div').addClass('list__item__alt').props({ onclick })
                        if (data.thumbnail && data.thumbnail != 'undefined') {
                            let img = createElement('img').attrs({ class: 'list__item__img' }).props({ onerror() { this.replaceWith(img_alt); }, onclick });
                            img.src = data.thumbnail.startsWith('http') ? imgurThumb(data.thumbnail, 'm') : firebase.storage.getStaticUrl(data.thumbnail);
                            row.append(img);
                        } else {
                            row.append(img_alt);
                        }
                    }
                    row.append(board_anchor, post_anchor);
                    wrap.append(row);

                }

                if (docs.length < (model.page_offset || 25)) list__footer.remove();

                list__footer.disabled = false;
                if (this.data.Board) this.data.Board.proceed();
            }

            let list__header = createElement('span').attrs({ class: 'list__header' });
            let list__footer = createElement('button').props({ innerHTML: TEXTS.load_more, onclick: load }).attrs({ class: 'list__footer b_button' });

            list__header.append(
                createElement('a').attrs({ class: 'list__item__board_name' }).props({ innerHTML: TEXTS.document_cate }),
                createElement('a').attrs({ class: 'list__item__title' }).props({ innerHTML: TEXTS.title })
            );

            wrap.addClass(model.style).append(list__header, list__footer);

            await load();
        }
    }
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

const FormContent = {
    toolbar: {
        initialize(id, wrap, model) { }
    },
    textbox: {
        text: '텍스트박스',
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
    board_setting: {//프로필 게시판 설정 기능 완성 필요
        initialize(id, wrap, { type, title, category, board }) {
            let form__inputs = createElement('div').addClass('form__inputs').css({ 'grid-template-columns': 'auto 1fr' });
            let select_text = createElement('select');
            select_text.append(
                createElement('option').props({ value: 1, innerHTML: '게시판형' }),
                createElement('option').props({ value: 2, innerHTML: '앨범형' })
            );
            select_text.value = type;
            let label_text = createElement('label').props({ innerHTML: '표시 스타일' });
            let input_text2 = createElement('input').attrs({ type: 'text', placeholder: '예시) 전체 목록 1', name: 'text', value: title });
            let label_text2 = createElement('label').props({ innerHTML: '목록명' });
            form__inputs.append(label_text, select_text, label_text2, input_text2);
            let form__inputs2 = createElement('div').addClass('form__inputs').css({ 'grid-template-columns': '1fr 1fr' });
            let select_text3 = createElement('select').props({ onchange() { this.toggleClass('empty', !this.value); } });
            let _render_categories = (datas) => {
                emptyNode(select_text3);
                select_text3.append(createElement('option').props({ innerHTML: '예시) 인물', value: '' }).attrs({ disabled: true, hidden: true }))
                select_text3.append(createElement('option').props({ innerHTML: '전체', value: '' }));
                datas.forEach(({ value }) => {
                    select_text3.append(createElement('option').props({ innerHTML: value }));
                });
                select_text3.value = category;
                select_text3.onchange();
            };
            __CallStack__.categories.push(_render_categories);
            _render_categories(Options.get('categories'));
            let label_text3 = createElement('label').props({ innerHTML: '카테고리' });
            let select_text4 = createElement('select').props({ onchange() { this.toggleClass('empty', !this.value); } });
            let _render_board = (datas) => {
                emptyNode(select_text4);
                select_text4.append(createElement('option').props({ innerHTML: '예시) 분류1 > 분류2', value: '' }).attrs({ disabled: true, hidden: true }));
                select_text4.append(createElement('option').props({ innerHTML: '전체', value: '' }));
                datas.forEach(({ value, path }) => {
                    select_text4.append(createElement('option').props({ value, innerHTML: path }));
                });
                select_text4.value = board;
                select_text4.onchange();
            };
            __CallStack__.board.push(_render_board);
            _render_board(Options.get('board'));
            let label_text4 = createElement('label').props({ innerHTML: '분류' });
            form__inputs2.append(select_text3, label_text3, select_text4, label_text4);
            let inputs_wrap = createElement('div').css({ flex: 1 });
            inputs_wrap.append(form__inputs, form__inputs2);
            wrap.append(inputs_wrap);
            wrap.getData = () => {
                return {
                    type: select_text.value,
                    title: input_text2.value,
                    category: select_text3.value,
                    board: select_text4.value
                };
            };
        }
    },
    add_board: {
        initialize(id, wrap, model = {}) {
            wrap.append(createElement('button').props({
                innerHTML: '목록 생성', onclick() {
                    app_article.createForm('board_setting', undefined)
                }
            }));
        }
    },
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
}

export { asideProfile as aside, articleProfile as article, loginCallback, logoutCallback };