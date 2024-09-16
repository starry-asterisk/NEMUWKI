class Router {
    VISITED_MAX = 5;
    pageClasses = {};
    histories = [];
    visited = [];
    now = '';
    state = null;
    user = null;
    blockMode = false;

    loginCallback = () => { };
    logoutCallback = () => { };
    constructor() {
        if (localStorage.getItem('visited')) this.visited = localStorage.getItem('visited').split(',');
    }
    async load(path = location.pathname, search = location.search) {
        now = { path, search };
        let params = new URLSearchParams(search);
        let page = await this.getClass(`/${path.split('/').pop()}`);
        document.body.removeClass('preview-mode');
        this.blockMode = false;
        __CallStack__ = {
            categories: [],
            board: []
        }
        this.loginCallback = page.loginCallback || (() => { });
        this.logoutCallback = page.logoutCallback || (() => { });
        app_aside = new page.aside(params);
        app_article = new page.article(params);
        this.histories.push({ app_aside, app_article });
    }
    async getClass(path) {
        let className = '404';
        switch (path) {
            case '/':
            case '/index':
                className = 'index';
                break;
            case '/login':
            case '/signup':
                className = 'login';
                break;
            case '/form':
                className = 'form';
                break;
            case '/profile':
                className = 'profile';
                break;
            case '/setting':
                className = 'setting';
                break;

        }
        this.now = path;
        return this.pageClasses[className] || (this.pageClasses[className] = await import(`./page/${className}.js?version=${version}`));
    }

    getVisited() {
        return this.visited.map(str => {
            let arr = str.split(':');
            return {
                visited_id: decodeVisited(arr[0]),
                title: decodeVisited(arr[1]),
                board_name: decodeVisited(arr[2])
            };
        });
    }

    saveVisited(post_id, title, board_name) {
        let str = `${encodeVisited(post_id)}:${encodeVisited(title)}:${encodeVisited(board_name)}`;
        let old_visited_index = this.visited.indexOf(str);
        if (old_visited_index > -1) this.visited.splice(old_visited_index, 1);
        this.visited.unshift(str);
        this.visited.splice(this.VISITED_MAX);
        localStorage.setItem('visited', this.visited);
    }
}

class asideBase {

    data = {};
    components = {};

    constructor() {
        emptyNode(aside);
        aside.removeClass('fold');
    }

    update(id, newDatas) {
        if (this.data[id] instanceof Model) {
            this.data[id].datas = newDatas;
            this.data[id].proceed();
        }
    }

    destroy() { }

    createInput(id, type = 'text') {
        let wrap = createElement().attrs({ id, class: 'input flex-horizontal' });
        let input = createElement('input').attrs({ id: `${id}__input`, type });

        wrap.append(input);

        this.components[id] = { input, wrap };

        Object.defineProperty(this.data, id, {
            get: () => this.components[id].input.value,
            set: newValue => this.components[id].input.value = newValue
        });

        return wrap;
    }
    createBlock(id, innerHTML, child) {
        let wrap = createElement().attrs({ id, class: 'block' }).props({ innerHTML });

        if (child) wrap.append(child);

        this.components[id] = { wrap };

        return wrap;
    }
    createBlockList(id, title, model) {
        let wrap = createElement().attrs({ id, class: 'b_block block inline' });
        let button = createElement('button').attrs({ class: `block__title icon` }).props({ onclick: () => toggle_block(id), innerHTML: title });
        let ul = createElement('ul').attrs({ class: `block__list` });

        wrap.append(button, ul);

        this.components[id] = { button, wrap, ul };
        this.data[id] = model;
        if (this.data[id] instanceof Model) {
            model.bind(this.components[id]);
            model.proceed();
        }

        return wrap;

    }
}

class articleBase {
    tabIndex = 5;

    contentBase = {};
    data = {};
    components = {};

    constructor() {
        emptyNode(article);
        article.style.removeProperty('zoom');
    }

    update(id, newDatas) {
        if (this.data[id] instanceof Model) {
            this.data[id].datas = newDatas;
            this.data[id].proceed();
        }
    }

    destroy() { }

    createContent(type, id = randomId(), model) {
        let wrap = createElement('div').attrs({ class: `content ${type}`, id });

        this.components[id] = { wrap };
        this.data[id] = model;

        if (this.contentBase[type]) this.contentBase[type].initialize.call(this, id, wrap, model);
        return wrap;
    }

    get focusedElement() {
        return this._focusedElement;
    }

    set focusedElement(el) {
        if (this._focusedElement == el) return el;
        if (el && el.parentElement != article) return;
        this._focusedElement = el;
        if (el && this.formBase[el.dataset.type]) this.update('toolbar', this.formBase[el.dataset.type].buttons || []);
        lastSelection = {};
    }
}

let lastSelection = {};

class Model {
    datas = [];
    components = [];

    constructor(datas, process, preprocess) {
        if (datas) this.datas = datas;
        if (process) this.process = process;
        if (preprocess) this.preprocess = preprocess;
    }

    process() {/*empty function*/ }
    preprocess() {/*empty function*/ }

    bind(component) {
        this.components.push(component);
    }

    proceed() {
        for (let component of this.components) {
            this.preprocess.call(component, this.datas);
            this.datas.forEach(this.process.bind(component));
        }
    }
}

customElements.define('n-table', class extends HTMLElement {
    _DEFAULT_WIDTH = 20;

    _beforeInit = true;
    _editable = false;
    _tbody = createElement('div').addClass('n-tbody');

    _header = createElement('div').addClass('n-th');
    _rowcount = 0;
    _colcount = 0;
    _outerLineWidth = 1;
    _outerLineColor = '#cccccc';
    _innerLineColor = '#cccccc';
    _isFullWidth = false;
    _lastSelection;

    /* getter */
    get cells() { return Array.from(this._tbody.children).map(td => { return { value: td.innerHTML, color: td.dataset.color || '', fittocell: td.dataset.fitToCell == 'true' }; }); }
    get header() { return Array.from(this._header.children).map(th => th.value); }
    get rowcount() { return this._rowcount; }
    get colcount() { return this._colcount; }
    get outerLineWidth() { return this._outerLineWidth; }
    get outerLineColor() { return this._outerLineColor; }
    get innerLineColor() { return this._innerLineColor; }
    get isFullWidth() { return this._isFullWidth; }
    get editable() { return this._editable; }
    get lastSelection() {
        if (!this._lastSelection) return;
        if (!this._lastSelection.parentElement) return;
        return this._lastSelection;
    }

    /* setter */
    set cells(new_arr) {
        emptyNode(this._tbody);
        this._tbody.append.apply(
            this._tbody,
            new_arr.map(obj => this.getTd(obj))
        );
        this._rowcount = new_arr.length / this._colcount;
        this.adJustTdPosition();
        return new_arr;
    }
    set header(new_arr) {
        emptyNode(this._header);
        this._header.append.apply(
            this._header,
            new_arr.map(size => this.getTh(size))
        );
        this.setWidth(new_arr);
        this._colcount = new_arr.length;
        this._rowcount = this._tbody.children.length / this._colcount;
        this.adJustTdPosition();
        return new_arr;
    }
    set rowcount(new_value) {
        if (this._rowcount == new_value) return new_value;
        if (this._rowcount > new_value) {
            this._tbody.querySelectorAll(`:nth-child(n + ${new_value * this._colcount + 1})`).forEach(el => el.remove());
        } else {
            this._tbody.append.apply(this._tbody, new Array((new_value - this._rowcount) * this._colcount).fill({ value: '' }).map(obj => this.getTd(obj)));
        }
        this.style.setProperty('--rowcount', new_value);
        this.adJustTdPosition(undefined, new_value);
        return this._rowcount = new_value;
    }
    set colcount(new_value) {
        if (this._colcount == new_value) return new_value;
        if (this._colcount > new_value) {
            this._header.querySelectorAll(`:nth-child(n + ${new_value + 1})`).forEach(el => el.remove());
            Array.from(this._tbody.children).forEach((el, idx) => {
                if (idx % this._colcount >= new_value) el.remove();
            });
        } else {
            this._header.append.apply(this._header, new Array(new_value - this._colcount).fill(this._DEFAULT_WIDTH).map(size => this.getTh(size)));
            this._tbody.querySelectorAll(`:nth-child(${this._colcount}n)`).forEach(el => el.after.apply(el,
                new Array((new_value - this._colcount)).fill({ value: '' }).map(obj => this.getTd(obj))
            ));
        }
        this.setWidth(Array.from(this._header.children).map(i => i.value))
        this.adJustTdPosition(new_value);
        return this._colcount = new_value;
    }
    set outerLineWidth(new_value) {
        this.style.setProperty('--outer-line-width', `${new_value}px`);
        return this._outerLineWidth = new_value;
    }
    set outerLineColor(new_value) {
        this.style.setProperty('--outer-line-color', new_value);
        return this._outerLineColor = new_value;
    }
    set innerLineColor(new_value) {
        this.style.setProperty('--inner-line-color', new_value);
        return this._innerLineColor = new_value;
    }
    set isFullWidth(new_value) {
        new_value ? this.addClass('full-width') : this.removeClass('full-width');
        return this._isFullWidth = new_value;
    }
    set editable(new_value) {
        if (new_value) {
            this.addClass('editable');
            this._tbody.querySelectorAll(`.n-td`).forEach(el => el.attrs({ contenteditable: 'plaintext-only' }));
        } else {
            this.removeClass('editable');
            this._tbody.querySelectorAll(`.n-td`).forEach(el => el.removeAttribute('contenteditable', 'plaintext-only'));
        }
        return this._editable = new_value;
    }
    set lastSelection(el) {
        if (!el) return;
        this._lastSelection = el;
        if (this.lastSelection && this.onSelChange) this.onSelChange(this.lastSelection);
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.append(
            this._header,
            this._tbody
        );
    }

    setWidth(header_arr) {
        let total_width = 0;
        this.style.setProperty('--columns', header_arr.map(w => {
            let width = parseFloat(w) || this._DEFAULT_WIDTH;
            total_width += width;
            return `${width}fr`;
        }).join(' '));
        this.css({ width: `${total_width * 10}px` });
    }

    getTh(size) {
        return createElement('input').addClass('n-td').attrs({ type: 'number' }).props({
            value: size, oninput: () => {
                this.setWidth(Array.from(this._header.children).map(el => el.value))
            }
        });
    }

    getTd(obj) {
        let td = createElement('div').addClass('n-td').props({ onfocus: () => this.lastSelection = td });
        td.innerHTML = this._editable ? obj.value : markdown(obj.value || '', td);
        td.dataset.fitToCell = !!obj.fittocell;
        if (obj.color) td.css({ 'background-color': obj.color }).attrs({ 'data-color': obj.color });
        if (this._editable) td.attrs({ contenteditable: 'plaintext-only' });
        return td;
    }

    adJustTdPosition(colcount = this._colcount, rowcount = this._rowcount) {
        if (colcount < 1 || rowcount < 1) return;
        let cells = Array.from(this._tbody.children);
        for (let idx in cells) {
            let col = (1 + Number(idx) % colcount || colcount);
            let row = Math.ceil((1 + Number(idx)) / colcount);
            let colspan = Number(cells[idx].dataset.colspan) || 1;
            let rowspan = Number(cells[idx].dataset.rowspan) || 1;
            cells[idx].dataset.col = col;
            cells[idx].dataset.row = row;
            cells[idx].css({ 'grid-area': `${row} / ${col} / ${row + rowspan} / ${col + colspan}` });
            if (colspan > 1 || rowspan > 1) cells[idx].css({ 'z-index': '1' });
        }
    }
});

function createSelect(datas, selectedIndex, useSearch, placeholder = '') {
    let select = createElement('n-select').attrs({ tabindex: 2 });
    let select_wrap = createElement('div').attrs({ tabindex: 3 });
    let select_input;
    if (useSearch) {
        select_input = createElement('input').attrs({ type: 'text', placeholder }).props({
            onkeydown(e) { e.stopPropagation(); },
            oninput() {
                select.dataset.selectedtext = this.value || placeholder;
                select.dataset.value = this.value;
                for (let option of select_wrap.children) {
                    if (option === this) continue;
                    if (!option.innerText.includes(this.value)) option.style.display = 'none';
                    else option.style.removeProperty('display');
                }
                resizeDropDown();
            }
        });
        select_wrap.append(select_input);
    }
    if (placeholder) select_wrap.append(createOption({ text: placeholder }, select));
    select_wrap.append.apply(
        select_wrap,
        datas.map(data => createOption(data, select))
    );
    select.append(select_wrap);
    select.onkeydown = e => {
        let sel = select.querySelector('n-option[data-selected]');
        switch (e.keyCode) {
            case 13:
                e.preventDefault();
                if (select.submit) select.submit();
                break;
            case 37:
            case 38:
                e.preventDefault();
                sel.prev('n-option')?.dispatchEvent(new Event('mousedown'));
                break;
            case 39:
            case 40:
                e.preventDefault();
                sel.next('n-option')?.dispatchEvent(new Event('mousedown'));
                break;
        }
    }
    select.onmousedown = resizeDropDown;
    select.ul = select_wrap;
    select.input = select_input;
    select.set = (v, text) => {
        select.dataset.value = v;
        select.dataset.selectedtext = text || v;
        select_wrap.querySelector(`option[data-value="${v}"]`)?.dispatchEvent(new Event('mousedown'));
    }
    select.ondelete = () => true;
    if (selectedIndex !== undefined) select_wrap.children[selectedIndex].dispatchEvent(new Event('mousedown'));
    return select;
    function resizeDropDown() {
        let { y, height } = select.getBoundingClientRect();
        let top_margin = y, bottom_margin = window.innerHeight - height - y;
        let is_to_down = top_margin < bottom_margin;
        select.toggleClass('to_down', is_to_down);
        select.style.setProperty('--max-dropdown-height', `${Math.min(select_wrap.scrollHeight + 2, (is_to_down ? bottom_margin : top_margin) - 60, window.innerHeight * 0.4)}px`);
    }
}

function createOption(data, select) {
    let opt = createElement('n-option').attrs({ 'data-value': data.value, 'data-owner': data.is_owner }).toggleClass('placeholder', !data.value).props({
        innerHTML: data.text || data.value, onmousedown(e) {
            if (e) e.stopPropagation();

            for (let option of Array.from(select.querySelectorAll('n-option[data-selected]'))) delete option.dataset.selected;
            this.dataset.selected = true;
            select.dataset.selectedtext = this.innerText;
            select.dataset.value = data.value || '';
            if (select.input) select.input.value = this.innerText;
            if (select.onselchange) select.onselchange(select.dataset.value, this.innerText);
        }
    });
    if (data.is_owner) {
        opt.append(
            createElement('button').addClass('del').props({
                onmousedown(e) {
                    e.stopPropagation();
                    console.log(data);
                    if (select.ondelete(data.id, opt)) opt.remove();
                }
            })
        );
    }
    if (select.dataset.value === data.value) {
        opt.dataset.selected = true;
        select.dataset.selectedtext = opt.innerText;
    }
    return opt;
}

const ContentBase = {
    zoom: {
        initialize(id, wrap, model) {
            let zoomIndicator = createElement('span').props({ id: '' });

            wrap.append(
                createElement('button').props({ innerHTML: TEXTS.zoomin, onclick: () => zoomArticle(0.1, false) }),
                zoomIndicator,
                createElement('button').props({ innerHTML: TEXTS.zoomout, onclick: () => zoomArticle(-0.1, false) }),
            );

            let oldZoom = localStorage.getItem('zoom') || 1;
            zoomArticle(oldZoom, true);

            function zoomArticle(diff, initialize) {
                const currentZoom = parseFloat(article.style.zoom || 1);
                let newZoom = initialize ? parseFloat(diff) : Math.max((parseFloat(currentZoom) + parseFloat(diff)).toFixed(1), 0.1);
                article.style.zoom = newZoom;
                wrap.style.zoom = (1 / newZoom).toFixed(2);
                zoomIndicator.innerHTML = `${Math.floor(newZoom * 100)}%`;
                if (!initialize) localStorage.setItem('zoom', newZoom);
            }
        }
    },
    main_header: {
        initialize(id, wrap, model) {
            let title = createElement('span').addClass('main_header__title', 'flex-horizontal').props({ innerHTML: model.text });
            let buttons = createElement('div').attrs({ class: `main_header__buttons buttons` });

            model.permission >= FINAL.PERMISSION.R && buttons.append(createElement('button').props({ innerHTML: TEXTS.share, onclick: () => goShare('twitter') }));
            model.permission >= FINAL.PERMISSION.RW && buttons.append(createElement('button').props({ innerHTML: TEXTS.edit, onclick: () => move(`form?post=${model.post_id}`) }));
            model.permission >= FINAL.PERMISSION.RWD && buttons.append(createElement('button').props({ innerHTML: TEXTS.delete, onclick: function () { remove(this, model.post_id); } }));

            wrap.addClass('fold-end', 'flex-horizontal').append(title, buttons);
        }
    },
    sub_header: {
        initialize(id, wrap, model) { wrap.addClass('fold-end').innerHTML = model.text; }
    },
    title: {
        initialize(id, wrap, model) {
            wrap.addClass('icon').addClass('fold-end').props({
                innerHTML: model.text,
                onclick() {
                    wrap.toggleClass('fold');
                    let isFold = wrap.classList.contains('fold');
                    let next = wrap;
                    while (next = next.nextElementSibling) {
                        if (next.classList.contains('fold-end')) return;
                        next.toggleClass('hide', isFold);
                    }
                }
            });
        }
    },
    textbox: {
        initialize(id, wrap, html) {
            let tpl = createElement('template').props({ innerHTML: markdown(html) });
            wrap.appendChild(tpl.content);
        }
    },
    table: {
        initialize(id, wrap, tableInfo) {
            let { cells, header, cellColors = [], outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc', isFullWidth, align, fit } = tableInfo;
            if (typeof cells[0] == 'string') cells = cells.map((value, idx) => { return { value }; });// 버전 차이 보정을 위한 코드
            if ('cellColors' in tableInfo) cellColors.forEach((color, idx) => { cells[idx].color = color; });// 버전 차이 보정을 위한 코드

            let nTable = createElement('n-table').props({ cells, header, outerLineWidth, outerLineColor, innerLineColor, isFullWidth, editable: false }).attrs({ 'data-align': align, 'data-fit': fit });

            wrap.append(nTable);
        }
    },
    image: {
        initialize(id, wrap, imgInfo) {
            if (typeof imgInfo == 'string') imgInfo = { src: imgInfo };
            if (imgInfo.hidden) {
                wrap.style.display = 'none';
                return;
            }
            let img = createElement('img').props({ onerror() { this.replaceWith(createElement('div').addClass('img_alt')); } });
            if (imgInfo.width) img.width = imgInfo.width;
            if (imgInfo.align) img.dataset.align = imgInfo.align;
            img.src = imgInfo.src.startsWith('http') ? imgInfo.src : firebase.storage.getStaticUrl(imgInfo.src);
            wrap.append(img);
        }
    },
    youtube: {
        initialize(id, wrap, model) {
            let video_id = getYoutubeId(model.link);
            let start = model.start || 0;
            let content_el = createElement('iframe').attrs({
                title: 'YouTube video player',
                frameborder: '0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                referrerpolicy: 'strict-origin-when-cross-origin',
                allowfullscreen: true,
                width: 530,
                height: 315,
                src: `//www.youtube.com/embed/${video_id}?start=${start}`
            });

            wrap.append(content_el);
        }
    },
    seperator: {
        initialize(id, wrap, model) { wrap.addClass('fold-end'); }
    },
    summury: {
        initialize(id, wrap, model) { wrap.addClass('fold-end', 'flex-vertical'); wrap.id = 'summury'; }
    },
    list: {
        async initialize(id, wrap, model) {
            let { keyword, field, operator, searchData = {} } = model
            let docs, { next } = await firebase.search.list({ [field]: keyword, ...searchData }, operator, model.page_offset || 25);
            let cardMode = model.style == 'galery';
            let itemFlexClass = cardMode ? 'flex-vertical' : 'flex-horizontal';
            let load = async () => {
                list__footer.disabled = true;

                docs = await next();

                for (let doc of docs) {
                    let data = doc.data();

                    let row = createElement('span').addClass('list__item', itemFlexClass);
                    let board_anchor = createElement('a').attrs({ class: 'list__item__board_name', 'data-board': data.board_name, href: `?field=board_name_arr&operator=array-contains&keyword=${data.board_name}` }).props({ innerHTML: data.board_name });
                    let post_anchor = createElement('a').attrs({ class: 'list__item__title', href: `index?post=${doc.id}` }).props({ innerHTML: data.title });


                    if (cardMode) {
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

            let list__footer = createElement('button').props({ innerHTML: TEXTS.load_more, onclick: load }).addClass('list__footer', 'b_button', itemFlexClass);

            if (cardMode) wrap.addClass(model.style).append(list__footer);
            else {
                let list__header = createElement('span').addClass('list__header', 'flex-horizontal');
                list__header.append(
                    createElement('a').attrs({ class: 'list__item__board_name' }).props({ innerHTML: TEXTS.document_cate }),
                    createElement('a').attrs({ class: 'list__item__title' }).props({ innerHTML: TEXTS.title })
                );
                wrap.addClass('flex-vertical', model.style).append(list__header, list__footer);
            }

            await load();
        }
    },
}

const MODAL_TEMPLATE = {
    colorPicker: (container, callback, value) => {
        let Saturation = 1, Brightness = 1, Hue = 0;
        let pallet = document.createElement('div').addClass('pallet');
        let pallet__pick = document.createElement('span').addClass('pallet__picker');
        let hue = document.createElement('div').addClass('hue');
        let hue_rotater = document.createElement('span').addClass('hue__picker');

        pallet.append(pallet__pick);
        pallet.onmousedown = pallet.ontouchstart = e_donw => {
            let { width, height, x, y } = pallet.getBoundingClientRect();
            pickColor(e_donw);
            window.onmousemove = window.ontouchmove = e_move => pickColor(e_move);
            window.onmouseup = window.onmouseleave = window.ontouchend = e_up => {
                pickColor(e_up);
                window.onmouseup = window.ontouchmove = window.ontouchend = window.onmouseleave = window.onmousemove = null;
            };
            function pickColor(e) {
                e.stopPropagation();
                e.preventDefault();
                if (e.touches) e = e.touches[0];
                if (!e) return;
                let { clientX, clientY } = e;
                let poxX = Math.max(Math.min(clientX - x, width), 0);
                let posY = Math.max(Math.min(clientY - y, height), 0);
                Saturation = poxX / width;
                Brightness = 1 - (posY / height);
                displayColor();
            }
        }

        hue.append(hue_rotater);
        hue.onmousedown = hue.ontouchstart = e_donw => {
            let { width, x } = hue.getBoundingClientRect();
            pickHue(e_donw);
            window.onmousemove = window.ontouchmove = e_move => pickHue(e_move);
            window.onmouseup = window.onmouseleave = window.ontouchend = e_up => {
                pickHue(e_up);
                window.onmouseup = window.ontouchmove = window.ontouchend = window.onmouseleave = window.onmousemove = null;
            };
            function pickHue(e) {
                e.stopPropagation();
                e.preventDefault();
                if (e.touches) e = e.touches[0];
                if (!e) return;
                let { clientX } = e;
                let poxX = Math.max(Math.min(clientX - x, width), 0);
                Hue = Math.floor(poxX / width * 361);
                displayColor();
            }
        }


        let hex_input_wrap = createElement('div').attrs({ class: 'b_input', placeholder: 'hex' }).css({ 'margin-block': '1rem' });
        let hex_input = createElement('input').attrs({ placeholder: '', maxlength: 7 }).props({
            value: '#FFFFFF',
            oninput() {
                let { h, s, v } = hexToHsv(hex_input.value);
                Hue = h, Saturation = s, Brightness = v;
                displayColor(false);
            }
        });
        let eyedropper_btn = createElement('button').addClass('icon').addClass('icon-eyedropper').props({
            onclick(e) {
                e.preventDefault();
                e.stopPropagation();
                let dropper = new EyeDropper();
                dropper.open().then(({ sRGBHex }) => {
                    let { h, s, v } = hexToHsv(sRGBHex);
                    Hue = h, Saturation = s, Brightness = v;
                    displayColor();
                });
            }
        });

        let button_confirm = createElement('button').props({
            onclick(e) {
                e.preventDefault();
                container.close();
                callback(hex_input.value);
            }
        }).attrs({ class: 'button primary' }).props({ innerHTML: TEXTS.form.apply });

        hex_input_wrap.append(hex_input, eyedropper_btn);
        if (!('EyeDropper' in window)) eyedropper_btn.remove();
        let frag = document.createDocumentFragment();
        frag.append(pallet, hue, hex_input_wrap, button_confirm);

        if (value) {
            let { h, s, v } = hexToHsv(value);
            Hue = h, Saturation = s, Brightness = v;
            displayColor();
        }

        return frag;

        function displayColor(reflow = true) {
            pallet__pick.css({ bottom: `${Brightness * 100}%`, left: `${Saturation * 100}%` });
            pallet.css({ 'filter': `hue-rotate(${Hue}deg)` });
            hue_rotater.css({ left: `${Hue / 3.6}%` });
            if (reflow) hex_input.value = hsvToHex(Hue, Saturation, Brightness);
        }
    },
    emailPrompt: container => {
        let frag = document.createDocumentFragment();
        let h3 = createElement('h3').props({ innerHTML: '비밀번호 초기화' });
        let text_input_container = createElement('div').attrs({ class: 'b_input', placeholder: '이메일' }).css({ 'min-width': '18rem', 'margin-bottom': 'var(--spacing-small)' });
        let text_input = createElement('input').attrs({ type: 'text', placeholder: ' ' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ innerHTML: '요청전송' });

        frag.append(h3, text_input_container, button_confirm);
        text_input_container.append(text_input);

        button_confirm.onclick = e => {
            e.preventDefault();
            if (validate(text_input, undefined, 'email')) {
                firebase.auth.sendPasswordResetEmail(text_input.value)
                    .then(result => {
                        if (result) dev.log(result);
                        Notify.alert('메일이 전송되었습니다.');
                        container.close();
                    })
                    .catch(firebaseErrorHandler);
            } else Notify.alert('옳바른 이메일을 입력하세요!');
        }
        return frag;
    },
    emailConfirm: container => {
        let frag = document.createDocumentFragment();
        let h3 = createElement('h3').props({ innerHTML: '메일 인증 요청 보내기' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ innerHTML: '요청' });
        frag.append(h3, button_confirm);
        button_confirm.onclick = e => {
            e.preventDefault();
            (async () => await firebase.auth.sendEmailVerification())()
                .then(result => {
                    if (result) dev.log(result);
                    Notify.alert('메일이 전송되었습니다.');
                    container.close();
                })
                .catch(firebaseErrorHandler);
        }
        return frag;
    },
    addCategory: container => {
        let frag = document.createDocumentFragment();
        let h3 = createElement('h3').props({ innerHTML: '카테고리 추가' });
        let text_input_container = createElement('div').attrs({ class: 'b_input', placeholder: '카테고리명' }).css({ 'min-width': '18rem', 'margin-bottom': 'var(--spacing-small)' });
        let text_input = createElement('input').attrs({ type: 'text', placeholder: ' ' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ innerHTML: '생성' });

        frag.append(h3, text_input_container, button_confirm);
        text_input_container.append(text_input);

        button_confirm.onclick = e => {
            e.preventDefault();
            if (text_input.value) {
                if (Notify.confirm('카테고리를 생성하시겠습니까?')) {
                    if (Options.categories.find(obj => obj.value === text_input.value)) return Notify.alert('동일 명칭의 카테고리가 이미 존재합니다!!');
                    firebase.categories.insertOne({ name: text_input.value, owner: app.user.uid })
                        .then(() => {
                            Notify.alert('카테고리가 추가되었습니다.');
                            container.close();
                        })
                        .catch(firebaseErrorHandler);
                }
            } else {
                Notify.alert('카테고리 명칭을 입력해 주세요.')
            }
        }
        return frag;
    },
    addMenu: container => {
        container.css({ overflow: 'visible' });
        let frag = document.createDocumentFragment();
        let h3 = createElement('h3').props({ innerHTML: '분류 추가' });
        let parent_select = createSelect(Options.get('board'), 0, true, '상위 분류').addClass('input', 'flex-horizontal').css({ 'margin-bottom': 'var(--spacing-small)', 'max-width': '100%', 'min-width': '15rem' });
        let text_input_container = createElement('div').attrs({ class: 'b_input', placeholder: '분류명' }).css({ 'min-width': '18rem', 'margin-bottom': 'var(--spacing-small)' });
        let text_input = createElement('input').attrs({ type: 'text', placeholder: ' ' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ innerHTML: '생성' });

        frag.append(h3, parent_select, text_input_container, button_confirm);
        text_input_container.append(text_input);

        button_confirm.onclick = e => {
            e.preventDefault();

            if (text_input.value) {
                if (Notify.confirm('메뉴를 생성하시겠습니까?')) {
                    if (Options.board.find(obj => obj.name === text_input.value)) return Notify.alert('동일 명칭의 메뉴가 이미 존재합니다!!');
                    let parent_data = { depth: 0, name: '' };
                    if (parent_select.dataset.value) {
                        let find_data = Options.board.find(obj => obj.name === parent_select.dataset.value);
                        if (find_data) parent_data = find_data;
                        else return Notify.alert('존재하지 않는 상위 메뉴입니다!!');
                    }
                    firebase.board.insertOne({ name: text_input.value, parent: parent_data.name, depth: parent_data.depth + 1, owner: app.user.uid })
                        .then(() => {
                            Notify.alert('메뉴가 추가되었습니다.');
                            container.close();
                        })
                        .catch(firebaseErrorHandler);
                }
            } else {
                Notify.alert('메뉴 명칭을 입력해 주세요.')
            }
        }
        setTimeout(() => {
            document.activeElement?.blur();  // 포커스 해제
        }, 10);
        return frag;
    },
    addImg: (container, callback) => {
        container.classList.add('imgSelector', 'fullSize');
        let frag = document.createDocumentFragment();
        let imgSelector__header = createElement('div').attrs({ class: 'imgSelector__header' }).props({ innerHTML: '이미지 선택' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ value: 'default', innerHTML: '선택' });

        let imgSelector__list = createElement('div').attrs({ class: 'imgSelector__list' });
        let input_file = createElement('input').attrs({ type: 'file', accept: 'image/*' });
        let imgSelector__list__stored = createElement('label').attrs({ class: 'imgSelector__list__item icon icon-tray-arrow-up' });
        let imgSelector__list__link = createElement('button').attrs({ class: 'imgSelector__list__item link' });

        frag.append(imgSelector__header);
        frag.append(button_confirm);
        frag.append(imgSelector__list);
        imgSelector__list__stored.append(input_file);
        imgSelector__list.append(imgSelector__list__stored);
        imgSelector__list.append(imgSelector__list__link);

        input_file.onchange = async () => {
            let file = input_file.files[0];
            if (file) {
                let result = await uploadByImgur(file);
                if (result.status === 200) {
                    container.close();
                    callback(result.data.link);
                } else {
                    Notify.alert('Imgur사이트 파일 업로드에 실패했습니다.');
                    input_file.setAttribute('type', 'text');
                    input_file.value = '';
                    input_file.setAttribute('type', 'file');
                }
            }
        }

        imgSelector__list__link.onclick = e => {
            e.preventDefault();
            let link = Notify.prompt('사용할 이미지의 URL을 입력해 주세요');
            if (link) {
                container.close();
                callback(link);
            }
        }

        firebase.resources.all().then(r => {
            for (let doc of r.docs) {
                let data = doc.data();
                let radio = createElement('input').attrs({ type: 'radio', class: 'imgSelector__list__item', name: 'gallery' }).css({ 'background-image': `url(${imgurThumb(data.link, 'm')})` }).props({ value: data.link });
                imgSelector__list.append(radio);
            }
        });
        button_confirm.onclick = e => {
            e.preventDefault();
            let i = imgSelector__list.querySelector(':checked');
            if (i) {
                container.close();
                callback(i.value);
            } else {
                Notify.alert('이미지를 선택해 주세요!!');
            }
        }
        return frag;
    }
};