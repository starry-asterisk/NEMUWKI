if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}


if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;

        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

HTMLElement.prototype.prev = function (s) {
    var el = this.previousElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.previousElementSibling;
    }
    return null;
}

HTMLElement.prototype.next = function (s) {
    var el = this.nextElementSibling;

    while (el != null) {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.nextElementSibling;
    };
    return null;
}

Element.prototype.scrollIntoViewIfNeeded = function () {
    let parent = this.parentNode;
    let overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
        overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight) > (parent.scrollTop + parent.clientHeight),
        overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
        overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth) > (parent.scrollLeft + parent.clientWidth);

    if (overTop || overBottom || overLeft || overRight) {
        this.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
};

HTMLElement.prototype.empty = function () {
    let removed = Array.from(this.childNodes)
    for (let c of removed) {
        c.remove();
    }
    return removed;
}

HTMLElement.prototype.setStyles = function (obj) {
    if (obj == undefined) console.error('Arguments 0 is undefined or null');
    else for (let name in obj) this.style.setProperty(name, obj[name]);
    return this;
}


function between(min, max, value) {
    return Math.max(Math.min(max, value), min);
}

function repaintScrollbar(scrollbar, isHorizontal = true) {
    let targetName = scrollbar.getAttribute("target");
    let target = document.querySelector(targetName);

    if (target == undefined)
        return console.warn(`${targetName} is not exist`);

    let namespace = isHorizontal ? {
        size: 'width',
        pos: 'left',
        scrollSize: 'scrollWidth',
        scrollPos: 'scrollLeft',
        screen: 'screenX',
    } : {
        size: 'height',
        pos: 'top',
        scrollSize: 'scrollHeight',
        scrollPos: 'scrollTop',
        screen: 'screenY',
    };

    let s = target.getBoundingClientRect()[namespace.size];
    let scroll_s = target[namespace.scrollSize];
    let ratio = s / scroll_s;
    if (scroll_s - s < 2) return scrollbar.classList.add("unused");
    scrollbar.classList.remove("unused");

    let offset = target[namespace.scrollPos] / scroll_s;

    let min = 0,
        max = (scroll_s - s) * ratio;

    scrollbar.style[namespace.size] = Math.floor(s * ratio) + "px";
    scrollbar.style[namespace.pos] = Math.floor(s * offset) + "px";

    scrollbar.onmousedown = (e_down) => {
        e_down.preventDefault();
        let pos_final, pos = parseInt(scrollbar.getAttribute("pos")) || 0;
        let pos_down = e_down[namespace.screen];
        window.onmouseup = () => {
            window.onmouseup = window.onmousemove = undefined;
        };
        window.onmousemove = (e_move) => {
            let pos_move = e_move[namespace.screen];
            pos_final = between(min, max, pos_move - pos_down + pos);
            target[namespace.scrollPos] = pos_final / ratio;
        };
    };

    scrollEventManager.addEventListener(target, targetName + '_onscroll_' + isHorizontal, 'scroll', () => {
        let pos = target[namespace.scrollPos] * ratio;
        scrollbar.style[namespace.pos] = pos + 'px';
        scrollbar.setAttribute("pos", pos);
    });
    scrollEventManager.addEventListener(target, targetName + '_onwheel_' + isHorizontal, 'wheel', (e_wheel) => {
        if (e_wheel.shiftKey != isHorizontal) return;
        let direction, pos = parseInt(scrollbar.getAttribute("pos")) || 0;
        if (e_wheel.wheelDelta > 0 || e_wheel.detail < 0) direction = -1;
        else direction = 1;
        pos += direction * 19;
        pos = between(min, max, pos);
        target[namespace.scrollPos] = pos / ratio;
    });
}

function repaintScrollbarVisible() {
    for (let scrollbar of document.querySelectorAll(".h-scrollbar"))
        repaintScrollbar(scrollbar);
    for (let scrollbar of document.querySelectorAll(".v-scrollbar"))
        repaintScrollbar(scrollbar, false);
}

function contextMenuHandler(e) {
    e.preventDefault();

    let contextContainer = document.querySelector('.contextContainer') || (() => {
        let el = document.createElement('div');
        el.classList.add('contextContainer');
        return el;
    })();

    let contextMenu = document.querySelector('.contextMenu') || (() => {
        let el = document.createElement('div');
        el.classList.add('contextMenu');
        contextContainer.append(el);
        return el;
    })();

    contextMenu.setStyles({
        top: e.pageY + 'px',
        left: e.pageX + 'px',
    });

    window.onmousedown = (e2) => {
        e2.preventDefault();
        contextContainer.remove();
        window.onmousedown = undefined;
    }

    contextMenu.empty();

    let contextMunuInfos = e.srcElement.closest('.subTab__contents') == undefined ? contextMunuGlobal : contextMunuEditor;

    contextMunuInfos.sort((info1, info2) => (info1.order || 0) - (info2.order || 0));

    for (let tabIndex in contextMunuInfos) {
        let contextMunuInfo = contextMunuInfos[tabIndex];
        let { name, disabled, callback } = contextMunuInfo;
        let contextMenuItem = (() => {
            let el = document.createElement('p');
            el.setAttribute('tabindex', tabIndex);
            el.onmousedown = e3 => {
                e3.preventDefault();
                e3.stopPropagation();
            }
            if (name == undefined) {
                el.classList.add('contextMenu__line');
            } else {
                el.classList.add('contextMenu__item');
                el.innerHTML = name;
                if (!disabled) el.onclick = e4 => {
                    window.onmousedown(e4);
                    callback(e4);
                }
                else el.classList.add('disabled');
            }
            return el;
        })();

        contextMenu.append(contextMenuItem);
    }

    document.body.append(contextContainer);
    contextContainer.animate([
        { opacity: 0 },
        { opacity: 1 },
    ], {
        duration: 200,
        iterations: 1,
    })

    return false;
}

function callEditorFunction(option) {
    return editor.onkeydown.call(editor, {
        ...option,
        preventDefault: () => { },
        stopPropagation: () => { }
    });
}

let contextMunuGlobal = [
    {
        name: 'open',
        disabled: false,
        callback: function () { }
    },
    {

    },
    {
        name: 'cut',
        disabled: true,
        callback: function () { }
    },
    {
        name: 'copy',
        disabled: false,
        callback: function () { }
    },
    {
        name: 'paste',
        disabled: false,
        callback: function () { }
    }
];

let contextMunuEditor = [
    {
        name: 'select all',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'a' })
    },
    {
        name: 'find...',
        disabled: false,
        callback: function () { }
    },
    {

    },
    {
        name: 'paste',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'v' })
    },
    {
        name: 'cut',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'x' })
    },
    {
        name: 'copy',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'c' })
    },
    {
        name: 'delete',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: false, key: 'Delete' })
    },
    {

    },
    {
        name: 'refresh',
        disabled: false,
        callback: () => callEditorFunction({ ctrlKey: true, key: 'f5' })
    }
];