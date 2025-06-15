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
    title: {
        text: '소제목',
        icon: 'icon-format-title',
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
                onkeyup: refreshLastSelection,
                onmouseup: refreshLastSelection,
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
    table: {
        text: '도표',
        icon: 'icon-table',
        initialize(id, wrap, tableInfo = {}) {
            let { cells = [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], header = [20, 20, 20], cellColors, outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc', isFullWidth = false, align = 'left', fit = 'true' } = tableInfo;
            if (typeof cells[0] == 'string') cells = cells.map((value, idx) => { return { value }; });// 버전 차이 보정을 위한 코드
            if ('cellColors' in tableInfo) cellColors.forEach((color, idx) => { cells[idx].color = color; });// 버전 차이 보정을 위한 코드
            let nTable = createElement('n-table').props({ editable: true, cells, header, outerLineWidth, outerLineColor, innerLineColor, isFullWidth }).attrs({ 'data-align': align || 'left', 'data-fit': fit });
            let form__inputs = createElement('div').addClass('form__inputs').css({ display: 'block' });

            let selection = nTable.selection = {
                first: null,
                last: null
            };
            let cellTool = createElement('div').addClass('form__table__tool');
            cellTool.append(createElement('button').addClass('table__tool__button', 'icon', 'icon-w-plus').props({
                onclick(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selection.first) return;
                    app_article.focusedElement = null;
                    app_article._focusedElement = nTable;
                    app_article.update('toolbar', ['foreColor', 'backColor', 'bold', 'italic', 'strikeThrough', 'underline', 'fontSize', 'cellAlign', 'fitToCell', 'removeFormat']);
                    app_article._focusedElement = null;
                }
            }));
            form__inputs.append(nTable);
            nTable.onResize = () => {
                let cell = nTable.lastSelection;
                if (!cell) return;
                if (keyboardStatus.shift) {
                    if (selection.first) selection.last = cell;
                    else selection.first = selection.last = cell;
                } else {
                    selection.first = selection.last = cell;
                }
                form__inputs.append(cellTool);
                adjustToolPosition();
            }
            const resizeObserver = new ResizeObserver(() => {
                adjustToolPosition();
            });

            function adjustToolPosition() {
                if (!cellTool.parentElement) return;
                let parentRect = form__inputs.getBoundingClientRect();
                let cell_1 = selection.first, cell_2 = selection.last;
                let cellRect = cell_1.getBoundingClientRect();
                let cellRect_2 = cell_2.getBoundingClientRect();
                cellTool.css({
                    width: `${Math.round(Math.max(cellRect.right, cellRect_2.right) - Math.min(cellRect.left, cellRect_2.left))}px`,
                    height: `${Math.round(Math.max(cellRect.bottom, cellRect_2.bottom) - Math.min(cellRect.top, cellRect_2.top))}px`,
                    top: `${Math.round(Math.min(cellRect.y, cellRect_2.y) - parentRect.y)}px`,
                    left: `${Math.round(Math.min(cellRect.x, cellRect_2.x) - parentRect.x + form__inputs.scrollLeft)}px`
                })
            }

            resizeObserver.observe(nTable);
            wrap.append(form__inputs);
            wrap.getData = () => {
                return {
                    cells: nTable.cells,
                    header: nTable.header,
                    outerLineWidth: nTable.outerLineWidth,
                    outerLineColor: nTable.outerLineColor,
                    innerLineColor: nTable.innerLineColor,
                    isFullWidth: nTable.isFullWidth,
                    align: nTable.dataset.align || 'left',
                    fit: nTable.dataset.fit || 'true'
                };
            };
        },
        buttons: ['rowSize', 'colSize', 'tableToLeft', 'tableToCenter', 'tableToRight', 'outerLineColor', 'innerLineColor', 'cellBackgroundColor', 'outerLineWidth', 'insertCellImage', 'insertCellLink', 'fitToCell', 'tableFitHoriontal']
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
    youtube: {
        text: '유튜브 링크',
        icon: 'icon-youtube',
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
        icon: 'icon-drag-horizontal-variant',
        initialize(id, wrap) {
            let form__inputs = createElement('div').addClass('form__inputs');
            form__inputs.innerHTML = '구분선';
            wrap.append(form__inputs);
            wrap.getData = () => '';
        }
    },
    summury: {
        text: '목차',
        icon: 'icon-format-list-numbered',
        initialize(id, wrap) {
            let form__inputs = createElement('div').addClass('form__inputs');
            form__inputs.innerHTML = '목차';
            wrap.append(form__inputs);
            wrap.getData = () => '';
        }
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
                onkeyup: refreshLastSelection,
                onmouseup: refreshLastSelection,
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