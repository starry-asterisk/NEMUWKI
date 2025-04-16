const ToolBase = {
    foreColor(wrap, el) {
        wrap.attrs({ title: '글씨에 형광펜 효과를 줍니다.' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-color-text'
            }).props({
                onclick: () => execModal('foreColor', 'colorPicker', hex => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<div style="color:' + hex + '"> </div>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, { 'color': hex });
                    });
                    wrap.style.setProperty('--input-color', hex);
                    wrap.dataset.foreColor = hex;
                    return hex;
                }, wrap.dataset.foreColor)
            })
        );
        return wrap;
    },
    backColor(wrap, el) {
        wrap.attrs({ title: '글씨에 형광펜 효과를 줍니다.' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-color-highlight'
            }).props({
                onclick: () => execModal('backColor', 'colorPicker', hex => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<span style="background-color:' + hex + '"> </span>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, { 'background-color': hex }, 'span');
                    });
                    wrap.style.setProperty('--input-color', hex);
                    wrap.dataset.backColor = hex;
                    return hex;
                }, wrap.dataset.backColor)
            })
        );
        return wrap;
    },
    bold(wrap, el) {
        wrap.attrs({ title: '굵은 글씨 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-bold'
            }).props({
                onclick: execBuildVal('bold', undefined, () => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<b> </b>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, {}, 'b');
                    });
                })
            })
        );
        return wrap;
    },
    italic(wrap, el) {
        wrap.attrs({ title: '기울임 꼴' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-italic'
            }).props({
                onclick: execBuildVal('italic', undefined, () => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<i> </i>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, {}, 'i');
                    });
                })
            })
        );
        return wrap;
    },
    strikeThrough(wrap, el) {
        wrap.attrs({ title: '취소선 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-strikethrough'
            }).props({
                onclick: execBuildVal('strikeThrough', undefined, () => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<s> </s>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, {}, 's');
                    });
                })
            })
        );
        return wrap;
    },
    underline(wrap, el) {
        wrap.attrs({ title: '밑줄 효과' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-underline'
            }).props({
                onclick: execBuildVal('underline', undefined, () => {
                    if (el.matches('n-table')) getCells(el).forEach(cell => {
                        if (cell.innerHTML == '') cell.innerHTML = '<u> </u>';
                        else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, {}, 'u');
                    });
                })
            })
        );
        return wrap;
    },
    fontSize(wrap, el) {
        wrap.addClass('group').attrs({ title: '폰트 사이즈를 지정합니다. 기본값은 17px입니다.' });

        let bigger_btn = createElement('button').attrs({ class: `icon icon-plus` }).props({ onclick() { size_input.value = Number(size_input.value) + 1; size_input.dispatchEvent(new Event('change')); } });
        let size_input = createElement('input').props({
            value: 17, onchange(e) {
                if (el.matches('n-table')) getCells(el).forEach(cell => {
                    if (cell.innerHTML == '') cell.innerHTML = '<span style="font-size:'+size_input.value+'px;"> </span>';
                    else for (let node of Array.from(cell.childNodes)) cellCss(cell, node, {'font-size':`${size_input.value}px`}, 'span');
                });
                else {
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
    insertAnno(wrap, option) {
        wrap.attrs({ title: '주석 삽입' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-code-brackets'
            }).props({ onclick: () => execModal('insertText', 'addAnno', (symbol, text) => `[*${symbol || '주석'} ${text || '텍스트를 입력하세요.'}]`) })
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
    removeFormat(wrap, el) {
        wrap.attrs({ title: '서식 지우기' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-clear'
            }).props({ onclick: execBuildVal('removeFormat', undefined, () => {
                if (el.matches('n-table')) getCells(el).forEach(cell => cell.innerHTML = cell.innerText);
            }) })
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
    imageToLeft(wrap, focusedElement) {
        let image = focusedElement.querySelector('img');
        wrap.attrs({ title: '좌측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-left'
            }).props({ onclick: () => image.dataset.align = 'left' })
        );
        return wrap;
    },
    imageToCenter(wrap, focusedElement) {
        let image = focusedElement.querySelector('img');
        wrap.attrs({ title: '가운데 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-center'
            }).props({ onclick: () => image.dataset.align = 'center' })
        );
        return wrap;
    },
    imageToRight(wrap, focusedElement) {
        let image = focusedElement.querySelector('img');
        wrap.attrs({ title: '우측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-right'
            }).props({ onclick: () => image.dataset.align = 'right' })
        );
        return wrap;
    },
    dialogToLeft(wrap, focusedElement) {
        let form__dialog = focusedElement.querySelector('.form__dialog');
        wrap.attrs({ title: '좌측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-left'
            }).props({ onclick: () => form__dialog.dataset.align = 'left' })
        );
        return wrap;
    },
    dialogToRight(wrap, focusedElement) {
        let form__dialog = focusedElement.querySelector('.form__dialog');
        wrap.attrs({ title: '우측 정렬' });
        wrap.append(
            createElement('button').attrs({
                class: 'icon icon-format-align-right'
            }).props({ onclick: () => form__dialog.dataset.align = 'right' })
        );
        return wrap;
    },
}