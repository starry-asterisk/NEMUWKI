/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-19
* Description: personal canvas project for NEMU
*/

// 기존 메서드를 저장
const OrgAddEventListener = HTMLElement.prototype.addEventListener;
const OrgRemoveEventListener = HTMLElement.prototype.removeEventListener;

// addEventListener 오버라이드
HTMLElement.prototype.addEventListener = function (type, listener, options) {
    // 기존 메서드 호출
    OrgAddEventListener.call(this, type, listener, options);

    // 이벤트 리스너를 추적하여 저장
    if (!this._eventListeners) this._eventListeners = [];
    this._eventListeners.push({ type, listener, options });
};

// removeEventListener 오버라이드
HTMLElement.prototype.removeEventListener = function (type, listener, options) {
    // 기존 메서드 호출
    OrgRemoveEventListener.call(this, type, listener, options);

    // 저장된 리스너 정보에서 제거
    if (this._eventListeners) {
        this._eventListeners = this._eventListeners.filter(event => 
            event.type !== type || event.listener !== listener || event.options !== options);
    }
};

// destroy 메서드 추가
HTMLElement.prototype.destroy = function () {
    // 등록된 모든 이벤트 리스너 제거
    if (this._eventListeners) {
        this._eventListeners.forEach(({ type, listener, options }) => {
            OrgRemoveEventListener.call(this, type, listener, options);
        });
        this._eventListeners = []; // 리스트 초기화
    }
    console.log(`${this.tagName} destroyed and all event listeners removed.`);
};

HTMLElement.prototype.scrollIntoViewIfNeeded = function () {
    this.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
};

HTMLElement.prototype.css = function (styleObj) {
    if (typeof styleObj == 'object') for (let prop in styleObj) this.style.setProperty(prop, styleObj[prop]);
    return this;
};

HTMLElement.prototype.attrs = function (attrObj) {
    if (typeof attrObj == 'object') for (let prop in attrObj) this.setAttribute(prop, attrObj[prop]);
    return this;
};

HTMLElement.prototype.props = function (propObj) {
    if (typeof propObj == 'object') for (let prop in propObj) this[prop] = propObj[prop];
    return this;
};

HTMLElement.prototype.addClass = function () {
    this.classList.add.apply(this.classList, arguments);
    return this;
};

HTMLElement.prototype.removeClass = function (classNmae) {
    this.classList.remove(classNmae);
    return this;
};

HTMLElement.prototype.toggleClass = function (classNmae, bool) {
    this.classList.toggle(classNmae, bool);
    return this;
};

HTMLElement.prototype.prev = function (s) {
    var el = this.previousElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.previousElementSibling;
    }
    return null;
};

HTMLElement.prototype.next = function (s) {
    var el = this.nextElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.nextElementSibling;
    };
    return null;
};

HTMLElement.prototype.appendTo = function (parent) {
    if(parent) parent.appendChild(this);
    else error('parent is null');
    return this;
};

DocumentFragment.prototype._children = new Set();

const FragAppend = DocumentFragment.prototype.append;
DocumentFragment.prototype.append = function(){
    FragAppend.apply(this, arguments);
    this._children.push(...arguments);
}

export function createFragment() {
    return document.createDocumentFragment();
}

export function createElement(tagName = 'div') {
    return document.createElement(tagName);
}

export function createIconBtn(iconCode) {
    return createElement('button').addClass('icon').props({ innerHTML: iconCode });
}

export function createSlider(label_text, suffix = '', min = 0, max = 100) {
    let wrap = Utils.createElement('div').addClass('slider').props({ onchange() { }, oninput() { } })
    Utils.createElement('span').props({ innerHTML: label_text }).appendTo(wrap);
    let input = Utils.createElement('input').attrs({ min, max, step: 1, type: 'range' }).props({
        onchange(e) {
            e.stopPropagation();
            v_display_span.props({ innerHTML: `${this.value}${suffix}` });
            wrap.onchange(this.value);
        },
        oninput(e) {
            e.stopPropagation();
            v_display_span.props({ innerHTML: `${this.value}${suffix}` });
            wrap.oninput(this.value);
        }
    }).appendTo(wrap);
    let v_display_span = Utils.createElement('span').appendTo(wrap);
    Object.defineProperty(wrap, 'value', {
        set(v) {
            v_display_span.props({ innerHTML: `${v}${suffix}` });
            return input.value = v;
        },
        get() { return input.value; }
    })
    return wrap;
}

export function emptyNode(node) {
    let childs = Array.from(node.childNodes);
    for (let child of childs) child.remove();
}

export function randomID(_prefix = 'id_', id) {
    return id || (_prefix + Math.floor(Math.random() * Math.pow(10, 10)).toString(32).padStart(7, '_'));
}

export function info(text, time = 1000) {
    var span = Utils.createElement('span')
        .attrs({ 'data-level': 'info' })
        .props({ innerHTML: text });
    nemu.displayDynamicIsland(span, time);
}

export function warn(text, time = 2000) {
    var span = Utils.createElement('span')
        .attrs({ 'data-level': 'warn' })
        .props({ innerHTML: text });
    nemu.displayDynamicIsland(span, time);
}

export function error(text, time = 3000) {
    console.error(text);
    var span = Utils.createElement('span')
        .attrs({ 'data-level': 'error' })
        .props({ innerHTML: text });
    nemu.displayDynamicIsland(span, time);
}

export function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            info('링크가 클립보드에 복사되었습니다!', 500);
        }).catch(err => {
            error('클립보드에 복사하는 중 오류가 발생했습니다');
            console.error(err);
        });
    } else {
        // 클립보드 API가 지원되지 않는 경우
        fallbackCopyTextToClipboard(text);
    }
}

// 폴백 복사 기능
function fallbackCopyTextToClipboard(text) {

    const textArea = createElement("textarea")
        .css({ opacity: 0, 'pointer-events': 'none', position: 'fixed', top: 0, left: 0 })
        .props({ value: text }).appendTo(document.body);

    try {
        textArea.select();
        if (document.execCommand('copy')) {
            info('링크가 클립보드에 복사되었습니다!', 500);
        } else {
            error('복사에 실패했습니다.');
        }
    } catch (err) {
        error('클립보드에 복사하는 중 오류가 발생했습니다');
        console.error(err);
    }

    textArea.remove();
}