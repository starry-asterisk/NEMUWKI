const IndexContent = {
    ...ContentBase,
    textbox: {
        initialize(id, wrap, model) {
            ContentBase.textbox.initialize.call(this, id, wrap, model.text);
            let buttons = createElement('div').addClass('profile_header__buttons', 'flex-horizontal');

            buttons.append(
                createElement('button').props({
                    innerHTML: TEXTS.edit, onclick: () => {
                        let ToolBarModel = new Model(
                            [],
                            function (namespace) { this.wrap.append(ToolBase[namespace](createElement('span').addClass(namespace, 'flex-horizontal'), app_article._focusedElement)); },
                            function () { emptyNode(this.wrap) }
                        );
                        let toolbar = app_article.createForm('toolbar', 'toolbar', ToolBarModel);
                        ToolBarModel.bind(app_article.components['toolbar']);
                        let textbox = app_article.createForm('textbox', undefined, model.text, true).addClass('vertical');
                        article.prepend(toolbar);
                        wrap.after(textbox);

                        let textbox_buttons = createElement('div').addClass('profile_header__buttons', 'flex-horizontal');
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
            let buttons = createElement('div').addClass('profile_header__buttons', 'flex-horizontal');

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
}

const FormContent = {
    toolbar: {
        initialize(id, wrap, model) { wrap.addClass('flex-horizontal'); }
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
                innerHTML: (html || ''),
                onpaste(e) {
                    e.preventDefault();
                    document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
                },
                ondrop(e) {
                    const NewText = document.createTextNode(e.dataTransfer.getData('text/plain'));
                    if (NewText.textContent.startsWith('$$nemuwiki$$')) return;
                    e.preventDefault();
                    let range;
                    if ('caretRangeFromPoint' in document) {
                        range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    } else if ('caretPositionFromPoint' in document) {
                        range = document.caretPositionFromPoint(e.clientX, e.clientY);
                    } else return;
                    range.insertNode(NewText);

                    range.setStart(NewText, 0);
                    range.setEnd(NewText, NewText.length);

                    const selection = window.getSelection();
                    selection.removeAllRanges(); // 기존 선택 제거
                    selection.addRange(range);   // 새로운 선택 추가

                    this.oninput();
                },
                onkeyup: refreshLastSelection,
                onmouseup: refreshLastSelection,
                oninput() {
                    this.querySelectorAll('[style^="font-size: var(--"]').forEach(el => el.style.removeProperty('font-size'));
                    this.querySelectorAll('[style^="background-color: var(--"]').forEach(el => el.style.removeProperty('background-color'));
                    this.toggleClass('empty', this.textContent.trim().length < 1);
                }
            });
            input_text.toggleClass('empty', input_text.textContent.trim().length < 1);
            wrap.addClass('flex-horizontal').append(input_text);
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