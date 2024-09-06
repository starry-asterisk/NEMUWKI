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

    createInput(id, type = 'text', validate_fn = Validator.default) {
        let wrap = createElement().attrs({ id, class: 'input' });
        let input = createElement('input').attrs({ id: `${id}__input`, type });

        wrap.append(input);

        this.components[id] = { input, wrap };

        Object.defineProperty(this.data, id, {
            get: () => this.components[id].input.value,
            set: newValue => {
                if (validate_fn(newValue)) return this.components[id].input.value = newValue;
            }
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
        if(!el) return;
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