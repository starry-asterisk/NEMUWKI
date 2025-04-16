const FormContent = {
    toolbar: {
        initialize(id, wrap, model) { wrap.addClass('flex-horizontal'); }
    },
    bottomtoolbar: {
        __initialize(id, wrap, model) {
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
                add(select.dataset.value);
            };
            wrap.addClass('flex-horizontal').append(select, addBtn, previewBtn, submitBtn);

            let add = type => {
                let textbox = this.createForm(type, undefined, undefined, true);
                if (this.focusedElement) this.focusedElement.after(textbox);
                else article.append(textbox);
                textbox.scrollIntoViewIfNeeded();
            }
        },
        initialize(id, wrap, model) {
            let previewBtn = createElement('button').props({ innerHTML: '미리보기', onclick: preview }).attrs({ class: 'previewBtn' });
            let submitBtn = createElement('button').props({ innerHTML: '게시', onclick: submit }).addClass('preventable').addClass('submit_btn');
            for (let namespace in this.formBase) {
                let { text, icon } = this.formBase[namespace];
                if (!text) continue;
                wrap.append(createElement('button').attrs({ class: `icon ${icon} preventable`, title: text }).props({ onclick() { add(namespace); } }));
            }
            wrap.addClass('flex-horizontal').append(previewBtn, submitBtn);

            let add = type => {
                let textbox = this.createForm(type, undefined, undefined, true);
                if (this.focusedElement) this.focusedElement.after(textbox);
                else article.append(textbox);
                textbox.scrollIntoViewIfNeeded();
            }
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
    textbox: {
        text: '텍스트박스',
        icon: 'icon-format-textbox',
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
                    this.querySelectorAll('[style^="font-size: var(--"]').forEach(el => el.style.removeProperty('font-size'));
                    this.querySelectorAll('[style^="background-color: var(--"]').forEach(el => el.style.removeProperty('background-color'));
                    this.toggleClass('empty', this.textContent.trim().length < 1);
                }
            });
            input_text.toggleClass('empty', input_text.textContent.trim().length < 1);
            wrap.append(input_text);
            wrap.getData = () => input_text.innerHTML;
        },
        buttons: ['foreColor', 'backColor', 'bold', 'italic', 'strikeThrough', 'underline', 'fontSize', 'justifyLeft', 'justifyCenter', 'justifyRight', 'formatBlock', 'createLink', 'insertAnno', 'insertImage', 'unlink', 'removeFormat', 'selectAll', 'undo', 'redo']
    },
    image: {
        text: '사진',
        icon: 'icon-image',
        initialize(id, wrap, imgInfo = {}) {
            if (typeof imgInfo == 'string') imgInfo = { src: imgInfo };
            let form__inputs = createElement('div').addClass('form__image');
            let form__inputs__wrap = createElement('div').addClass('form__image__wrap', 'flex-horizontal');
            let form__img = new Image();
            let info__wrap = createElement('div').addClass('flex-vertical');
            let isThumb = imgInfo.isThumb || false;
            let hidden = imgInfo.hidden || false;
            let align = imgInfo.align || 'left';

            let isThumb__p = createElement('p');
            let isThumb__input = createElement('input').attrs({ type: 'checkbox', label: '대표 이미지 설정' }).addClass('s_chk').props({ onchange() { form__inputs__wrap.toggleClass('main', isThumb = this.checked); } });
            let hidden__p = createElement('p');
            let hidden__input = createElement('input').attrs({ type: 'checkbox', label: '이미지 감추기' }).addClass('s_chk').props({ onchange() { hidden = this.checked; } });
            let width__input = createElement('input').attrs({ type: 'number', min: 10, step: 1 });
            let height__input = createElement('input').attrs({ type: 'number', min: 10, step: 1 });
            let size__p = createElement('p').addClass('input_l');

            form__img.onload = function () {
                let ratio = form__img.naturalWidth / form__img.naturalHeight;
                width__input.value = imgInfo.width || form__img.naturalWidth;
                height__input.value = parseInt(width__input.value / ratio);
                width__input.oninput = () => {
                    height__input.value = parseInt(width__input.value / ratio);
                }
                height__input.oninput = () => {
                    width__input.value = parseInt(height__input.value * ratio);
                }
            };

            size__p.append(document.createTextNode('W'), width__input, document.createTextNode('H'), height__input);
            isThumb__p.append(isThumb__input);
            hidden__p.append(hidden__input);

            info__wrap.append(size__p, isThumb__p, hidden__p);


            let btn = createElement('button').addClass('f_button').props({ innerHTML: '이미지 선택' });
            let file_url = '';
            let adjust_src = src => {
                file_url = src;
                form__img.src = src.startsWith('http') ? imgurThumb(src, 'm') : firebase.storage.getStaticUrl(src);;
            };
            btn.onclick = () => {
                modal('addImg', adjust_src);
            }
            if (imgInfo.src) adjust_src(imgInfo.src);
            if (isThumb) isThumb__input.checked = true;
            if (hidden) hidden__input.checked = true;
            if (imgInfo.align) form__img.dataset.align = align;
            form__inputs__wrap.append(form__img, info__wrap);
            form__inputs.append(btn, form__inputs__wrap);
            wrap.append(form__inputs);
            wrap.getData = () => {
                return {
                    width: width__input.value || 10,
                    src: file_url,
                    isThumb,
                    hidden,
                    align: form__img.dataset.align || 'left'
                };
            };
        },
        buttons: ['imageToLeft', 'imageToCenter', 'imageToRight']
    },
    dialog: {
        text: '대화',
        icon: 'icon-forum',
        initialize(id, wrap, data = {
            align: 'left',
            image: {
                width: 100,
            },
            html: ''
        }) {
            let form__dialog = createElement('div').addClass('form__dialog');
            let form__inputs = createElement('div').addClass('form__dialog__image');
            let form__img = new Image();
            let info__wrap = createElement('div').addClass('flex-vertical');
            let align = data.align || 'left';

            let width__input = createElement('input').attrs({ type: 'number', min: 10, step: 1 });
            let height__input = createElement('input').attrs({ type: 'number', min: 10, step: 1 });
            let size__p = createElement('p').addClass('input_l');

            let name__input = createElement('input').attrs({ type: 'text', maxlength: 24 }).addClass('input2');
            let name__p = createElement('p').addClass('input_l');

            form__img.onload = function () {
                let ratio = form__img.naturalWidth / form__img.naturalHeight;
                width__input.value = data.image.width || form__img.naturalWidth;
                height__input.value = parseInt(width__input.value / ratio);
                width__input.oninput = () => {
                    height__input.value = parseInt(width__input.value / ratio);
                }
                height__input.oninput = () => {
                    width__input.value = parseInt(height__input.value * ratio);
                }
            };

            name__p.append(document.createTextNode('이름'), name__input);
            size__p.append(document.createTextNode('W'), width__input, document.createTextNode('H'), height__input);

            info__wrap.append(name__p, size__p);


            let btn = createElement('button').addClass('f_button').props({ innerHTML: '이미지 선택' });
            let file_url = '';
            let adjust_src = src => {
                file_url = src;
                form__img.src = src.startsWith('http') ? imgurThumb(src, 'm') : firebase.storage.getStaticUrl(src);;
            };
            btn.onclick = () => {
                modal('addImg', adjust_src);
            }
            if (data.image.src) adjust_src(data.image.src);
            if (data.align) form__dialog.dataset.align = align;
            if (data.name) name__input.value = data.name;
            form__inputs.append(btn, form__img, info__wrap);
            form__dialog.append(form__inputs);

            let input_text = createElement('div').attrs({
                contenteditable: true,
                placeholder: `텍스트박스.
                여기에 텍스트를 입력하세요.`,
                class: 'form__dialog__textbox'
            }).props({
                innerHTML: (data.html || ''),
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
                    this.querySelectorAll('[style^="font-size: var(--"]').forEach(el => el.style.removeProperty('font-size'));
                    this.querySelectorAll('[style^="background-color: var(--"]').forEach(el => el.style.removeProperty('background-color'));
                    this.toggleClass('empty', this.textContent.trim().length < 1);
                }
            });
            input_text.toggleClass('empty', input_text.textContent.trim().length < 1);
            form__dialog.append(input_text);
            wrap.append(form__dialog);
            wrap.getData = () => {
                return {
                    align: form__dialog.dataset.align || 'left',
                    image: {
                        width: width__input.value || 100,
                        src: file_url,
                    },
                    name: name__input.value,
                    html: input_text.innerHTML
                };
            };
        },
        buttons: ['dialogToLeft', 'dialogToRight', 'foreColor', 'backColor', 'bold', 'italic', 'strikeThrough', 'underline', 'fontSize', 'justifyLeft', 'justifyCenter', 'justifyRight', 'formatBlock', 'createLink', 'insertAnno', 'insertImage', 'unlink', 'removeFormat', 'selectAll', 'undo', 'redo']
    },
}