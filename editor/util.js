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

Array.prototype.compare = function (target) {
    return this.length === target.length && this.every((element, index) => element === target[index]);
}

let devMode = true;

function dev(){
    if(!devMode) return;
    console[Array.prototype.shift.call(arguments) || 'log'](...arguments);
}

function sleep(delay) { return new Promise(resolve => setTimeout(resolve, delay)); }

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

function repaintResizer(e_down) {
    let aside = document.querySelector("aside");
    let nav = document.querySelector("nav");
    let section = document.querySelector("section");
    let rootContainer = document.querySelector(".rootContainer");
    let pos = e_down.screenX;
    let width = aside.getBoundingClientRect().width;
    let r_width = rootContainer.getBoundingClientRect().width;
    let n_width = nav.getBoundingClientRect().width;
    window.onmousemove = (e_move) => {
        let v = width + e_move.screenX - pos;
        let filtered_v = between(21 * rem, r_width - n_width, v);
        aside.style.maxWidth = aside.style.minWidth = `${filtered_v}px`;
        section.style.maxWidth = section.style.minWidth = `calc(100% - ${filtered_v + n_width}px)`;
        repaintScrollbarVisible();
    };
    window.onmouseup = () => {
        window.onmouseup = window.onmousemove = undefined;
    };
}

function contextMenuHandler(e, context) {
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

    if (context == undefined) {
        let contextParent = e.target.closest('[context]') || { getAttribute: () => 'global' };
        context = contextParent.getAttribute('context');
    }

    let contextMunuInfos = contextMenuOpt[context];
    contextMunuInfos.sort((info1, info2) => (info1.order || 0) - (info2.order || 0));

    for (let tabIndex in contextMunuInfos) {
        let contextMunuInfo = contextMunuInfos[tabIndex];
        let { name, disabled, callback, icon, shortcut } = contextMunuInfo;
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
                if (icon) el.classList.add('mdi', `mdi-${icon}`);
                if (shortcut) el.setAttribute('shortcut', shortcut);
            }
            return el;
        })();

        contextMenu.append(contextMenuItem);
    }

    document.body.append(contextContainer);

    let rect = contextMenu.getBoundingClientRect();

    if (window.innerWidth < rect.right) contextMenu.style.left = `${rect.left - rect.width}px`;
    if (window.innerHeight < rect.bottom) contextMenu.style.top = `${rect.top - rect.height}px`;

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

function invalidMovePath(from, to){
    if(from.node.kind == 'directory' && from.path.length < to.path.length){
        for(let i in from.path){
            if(from.path[i] != to.path[i]) return false;
        }
    } else {
        if(from.path.length - 1 != to.path.length) {
            return false;
        }
    
        for(let i = 0; i < from.path.length - 1; i++){
            if(from.path[i] != to.path[i]) return false;
        }
    }
    return true;
}

const rem = 10;