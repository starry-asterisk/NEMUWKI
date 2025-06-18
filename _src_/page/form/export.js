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
                createElement('a').attrs({ href: `#_${info.index_str.split('.').join('_')}` })
                    .props({ innerHTML: `${info.index_str} <span>${info.title}</span>`, onclick(e) { e.preventDefault(); history.pushState({}, '', `#_${info.index_str.split('.').join('_')}`); info.content.scrollIntoViewIfNeeded(); } })
                    .css({ 'margin-left': `${info.depth * 1.5}rem` })
        ))
    }

    if (html_annotation.length > 0) {
        let annotation = createElement('div').attrs({ class: 'content annotation' });
        annotation.innerHTML = html_annotation;
        html_annotation = '';
        contents.push(annotation);
    }

    article.append.apply(article, contents);
}

function execBuildVal(command, val, altFn) {
    return function () {
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, val || "");
        altFn && altFn();
    };
}

function execBuildPrompt(command, prompt_text, conv_fn = v => v) {
    return function () {
        var val = Notify.prompt(prompt_text) || "";
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, conv_fn(val));
    };
}

function execModal(command, modal_type, conv_fn = v => v, option) {
    return modal(modal_type, (v, v2, v3) => {
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
        document.execCommand(command, false, conv_fn(v, v2, v3));
    }, option);
}

function cellCss(parent, node, css, tagName = 'div') {
    if (node.nodeType == 3) {
        let span = createElement(tagName).css(css);
        span.innerHTML = node.textContent;
        console.log('1', parent, '2', node, '3', span);
        parent.replaceChild(span, node);
    } else {
        let isTarget = node.tagName.toLowerCase() == tagName;
        if (isTarget) node.css(css);
        for (let child of Array.from(node.childNodes)) {
            if (child.nodeType != 3 || !isTarget) cellCss(node, child, css, tagName);
        }
    }
}

function getCells(table) {
    let cells = [];
    let { first, last } = table.selection;
    if (!first || !last) return;
    let sRow = Number(first.dataset.row),
        sCol = Number(first.dataset.col),
        eRow = Number(last.dataset.row),
        eCol = Number(last.dataset.col);
    let temp;
    if (eRow < sRow) {
        temp = eRow, eRow = sRow, sRow = temp;
    }
    if (eCol < sCol) {
        temp = eCol, eCol = sCol, sCol = temp;
    }
    for (let cell of Array.from(table._tbody.children)) {
        let nRow = cell.dataset.row;
        let nCol = cell.dataset.col;
        if (sRow > nRow || nRow > eRow || sCol > nCol || nCol > eCol) continue;
        cells.push(cell);
    }
    return cells;
}

function logoutCallback() {
    move(`401?message=${encodeURI(TEXTS.warn.login_neccesary)}&url=${location.href}`, true);
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
            hidden: hidden_chk.checked
        }

        let preview_text = Array.from(article.querySelectorAll('[contenteditable], input[type="text"]')).map(el => el.value || el.textContent).join(' ').trim().substring(0, 140);

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

        if (formData.title.length > 25) return Notify.alert('문서 명은 최대 25자 까지 가능합니다.');
        if (formData.title.length < 1) return Notify.alert('문서 명은 비워 둘 수 없습니다.');

        toggleSubmitMode();

        if (app_article.BeforeData) {
            formData.updated_timestamp = new Date();
            formData.timestamp = new Date(1000 * app_article.BeforeData.timestamp.seconds);
            formData.author = app_article.BeforeData.author;
            formData.use = app_article.BeforeData.use;
            firebase.post.updateOne(app_article.BeforeData.id, formData)
                .then(async () => {
                    await makeKeyword(app_article.BeforeData.id, formData, preview_text);
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
                        app.blockMode = false;
                        move(`401?message=${encodeURI('권한이 없거나 자동 로그아웃 처리되었습니다.')}&url=${location.href}`,true);
                        return;
                    }
                    await makeKeyword(ref.id, formData, preview_text);
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

async function makeKeyword(id, data, preview_text) {
    if (data.deleted) return await firebase.search.unset(id);
    if (data.board_name == 'template') return await firebase.search.unset(id);
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        updated_timestamp,
        author,
        contents,
        hidden
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
        preview_text,
        timestamp,
        author,
        hidden
    }

    let thumbnail, regex_result;
    for (let content of contents) {
        switch (content.type) {
            case 'image':
                if (thumbnail && !content.value.isThumb) break;
                thumbnail = content.value.src;
                break;
            case 'table':
                if (thumbnail) break;
                if (content.value.cells) for (let cell of content.value.cells) {
                    REGEX.image_for_exec.lastIndex = 0;
                    regex_result = REGEX.image_for_exec.exec(cell.value);
                    if (regex_result) {
                        thumbnail = regex_result[1];
                        break;
                    }
                }
                break;
            case 'textbox':
                if (thumbnail) break;
                REGEX.image_for_exec.lastIndex = 0;
                regex_result = REGEX.image_for_exec.exec(content.value);
                if (regex_result) {
                    thumbnail = regex_result[1];
                    break;
                }
                break;
        }
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
            hidden_chk.checked = true;
            hidden_chk.setAttribute('disabled', true);
        } else {
            board.set(oldValue || '');
            board.removeClass('disabled');
            template.removeClass('disabled');
            hidden_chk.checked = false;
            hidden_chk.removeAttribute('disabled');
        }
        setTimeout(() => { template_chk.disabled = false }, 100);
    };
})();

export { asideForm as aside, articleForm as article, logoutCallback };