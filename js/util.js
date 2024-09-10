HTMLElement.prototype.scrollIntoViewIfNeeded = function () {
    this.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
};

HTMLElement.prototype.css = function (styleObj) {
    if (typeof styleObj == 'object') for (let prop in styleObj) this.style[prop] = styleObj[prop];
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

function hsvToHex(H, S, V) {
    let C = V * S;
    let X = C * (1 - Math.abs((H / 60) % 2 - 1));
    let m = V - C;

    let R1, G1, B1;

    if (0 <= H && H < 60) {
        R1 = C;
        G1 = X;
        B1 = 0;
    } else if (60 <= H && H < 120) {
        R1 = X;
        G1 = C;
        B1 = 0;
    } else if (120 <= H && H < 180) {
        R1 = 0;
        G1 = C;
        B1 = X;
    } else if (180 <= H && H < 240) {
        R1 = 0;
        G1 = X;
        B1 = C;
    } else if (240 <= H && H < 300) {
        R1 = X;
        G1 = 0;
        B1 = C;
    } else {
        R1 = C;
        G1 = 0;
        B1 = X;
    }

    let R = Math.round((R1 + m) * 255);
    let G = Math.round((G1 + m) * 255);
    let B = Math.round((B1 + m) * 255);

    // RGB 값을 HEX로 변환
    const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();

    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
}

function hexToHsv(hex) {
    // HEX 문자열을 RGB로 변환
    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;

    // RGB 값에서 최대값과 최소값을 찾기
    let cMax = Math.max(r, g, b);
    let cMin = Math.min(r, g, b);
    let delta = cMax - cMin;

    // Hue 계산
    let h;
    if (delta === 0) {
        h = 0; // undefined, but will be set to 0
    } else if (cMax === r) {
        h = ((g - b) / delta) % 6;
    } else if (cMax === g) {
        h = ((b - r) / delta) + 2;
    } else if (cMax === b) {
        h = ((r - g) / delta) + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Saturation 계산
    let s = cMax === 0 ? 0 : (delta / cMax);

    // Value 계산
    let v = cMax;

    return { h, s, v };
}

function toggle_block(id) {
    window[id].toggleClass('open');
}

function parseHTML(htmlText) {
    let frag = document.createDocumentFragment();
    frag.insertAdjacentHTML("afterbegin", htmlText);
    return frag.firstChild;
}

function createElement(tagName = 'div') {
    return document.createElement(tagName);
}

function emptyNode(node) {
    let childs = Array.from(node.childNodes);
    for (let child of childs) child.remove();
}

function randomId() { return `_${Math.floor(Math.random() * Math.pow(10, 8)).toString(16)}`; }

function getBoardPath(data) {
    let arr = [];
    while (data) {
        arr.unshift(data.name);
        data = data.parent_data;
    }
    return arr.join(' > ');
}

function firebaseErrorHandler(error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    if (app) app.state = null;
    switch (errorCode) {
        case 'permission-denied':
            Notify.alert('권한이 없거나 자동 로그아웃 처리되었습니다. 다시 로그인 해주세요.');
            location.href = ROOT_PATH;
            break;
        case 'admin-permission-denied':
            Notify.alert('접근 가능한 관리자가 아닌 계정으로 로그인 되어있습니다. 다시 로그인 해주세요.');
            break;
        case 'auth/invalid-email':
            Notify.alert('옳바르지 않거나 존재하지 않는 이메일 입니다.');
            break;
        case 'auth/missing-password':
            Notify.alert('패스워드를 입력해주세요.');
            break;
        case 'auth/invalid-credential':
            Notify.alert('로그인 인증에 실패했습니다. 패스워드 또는 아이디를 확인해 주세요.');
            break;
        case 'auth/email-already-in-use':
            Notify.alert('이미 사용중인 이메일입니다.');
            break;
        case 'auth/weak-password':
            Notify.alert('취약한 비밀번호 입니다.');
            break;
        default:
            Notify.alert(`오류가 발생했습니다::${errorCode}:`);
            dev.error(errorCode, errorMessage);
            break;
    }
}


function remove(button, post_id) {
    if (!confirm('정말로 삭제 하시겠습니까?') || !confirm('삭제시 5영업일 이내의 글의 복구는 개발자에게 문의주세요')) return;
    button.setAttribute('disabled', true);
    firebase.post.deleteTemporary(post_id)
        .then(async () => {
            await firebase.search.unset(post_id);
            move('/');
        })
        .catch(firebaseErrorHandler);
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
            let { cells, header, cellColors = [], outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc', isFullWidth, align } = tableInfo;
            if (typeof cells[0] == 'string') cells = cells.map((value, idx) => { return { value }; });// 버전 차이 보정을 위한 코드
            if ('cellColors' in tableInfo) cellColors.forEach((color, idx) => { cells[idx].color = color; });// 버전 차이 보정을 위한 코드

            let nTable = createElement('n-table').props({ cells, header, outerLineWidth, outerLineColor, innerLineColor, isFullWidth, editable: false }).attrs({'data-align':align});

            wrap.append(nTable);
        }
    },
    image: {
        initialize(id, wrap, imgInfo) {
            if(typeof imgInfo == 'string') imgInfo = {src: imgInfo};
            if(imgInfo.hidden) {
                wrap.style.display = 'none';
                return;
            }
            let img = createElement('img').props({ onerror() { this.replaceWith(createElement('div').addClass('img_alt')); } });
            if(imgInfo.width) img.width = imgInfo.width;
            if(imgInfo.align) img.dataset.align = imgInfo.align;
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
        initialize(id, wrap, model) { wrap.addClass('fold-end','flex-vertical'); wrap.id='summury'; }
    },
    list: {
        async initialize(id, wrap, model) {
            let { keyword, field, operator, searchData = {} } = model
            let docs, { next } = await firebase.search.list({ [field]: keyword, ...searchData }, operator, model.page_offset || 25);
            let cardMode = model.style == 'galery';
            let itemFlexClass = cardMode ? 'flex-vertical':'flex-horizontal';
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
                            let img = createElement('img').attrs({ class: 'list__item__img', width: 200, height: 200 }).props({ onerror() { this.replaceWith(img_alt); }, onclick });
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

            if(cardMode) wrap.addClass(model.style).append(list__footer);
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

function logout() {
    firebase.auth.logout()
        .then(() => {
            move('/');
            Notify.alert(TEXTS.alert.logout);
        })
        .catch(firebaseErrorHandler);
}

const Validator = {
    default: () => true
}

const checkLogin = () => {
    firebase.auth.check(user => {
        nav__my_btn.innerHTML = TEXTS.form.profile;
        nav__my_btn.onclick = null;
        pop_profile.style.removeProperty('display');
        app.user = user;
        firebase.auth.getUser().then(user => {
            let data = user.data();
            if (data.banner_url) profile__background.css({ display: 'block' }) && (profile__background.src = data.banner_url);
            if (data.photo_url) profile__avatar.css({ display: 'block' }) && (profile__avatar.src = data.photo_url);
            profile__email.innerHTML = data.email;
        }).catch(firebaseErrorHandler);
        app.loginCallback(user);
        document.body.removeClass('none-auth');
    }, () => {
        nav__my_btn.innerHTML = TEXTS.form.login;
        nav__my_btn.onclick = () => { move('login') };
        profile__background.css({ display: 'none' });
        profile__avatar.css({ display: 'none' });
        profile__email.innerHTML = '';
        pop_profile.css({ display: 'none' });
        app.user = false;

        app.logoutCallback();
        document.body.addClass('none-auth');
    });
}

let __CallStack__ = {
    categories: [],
    board: []
}

function listenCategories() {
    if ('categories' in Listerners) return;
    Listerners.categories = firebase.listen(firebase.categories.query(), (snapshot) => {
        Options.categories = Array.prototype.map.call(snapshot.docs, doc => {
            let data = doc.data();
            data.id = doc.id;
            return data;
        });

        let datas = Options.get('categories');
        app_aside.update('Categories', datas);
        __CallStack__.categories.forEach(fn => fn(datas));
    });
}

function listenBoard() {
    if ('board' in Listerners) return;
    Listerners.board = firebase.listen(firebase.board.query(), (snapshot) => {
        Options.board = Array.prototype.map.call(snapshot.docs, doc => {
            let data = doc.data();
            data.id = doc.id;
            data.children = [];
            return data;
        });

        for (let data of Options.board) {
            let parent_data = Options.board.find(parent => data.parent == parent.name && data.depth - 1 == parent.depth);
            if (parent_data) {
                parent_data.children.push(data);
                data.parent_data = parent_data;
            }
        }

        var datas = Options.get('board');
        app_aside.update('Board', datas);
        app_article.update('Board', datas);
        __CallStack__.board.forEach(fn => fn(datas));
    });
}

const TEXTS = {
    sitename: '네무위키',
    search_i: '검색창',
    recent_document: '최근 문서',
    document_cate: '문서 분류',
    upload: '글쓰기',
    mypage: '마이페이지',
    welcome_title: '네무위키:대문',
    edit: '수정',
    share: '공유',
    delete: '삭제',
    all_document: '전체 문서',
    character_document: '인물 문서',
    title: '제목',
    load_more: 'load more',
    site_index: '대문',
    site_form: '문서 편찬',
    site_profile: '사용자 문서',
    zoomin: '+',
    zoomout: '-',
    warn: {
        login_already: '이미 로그인되어 있습니다.',
        login_neccesary: '로그인이 필요합니다',
        email_pattern: '이메일 형식에 맞지 않습니다.',
        password_short: '비밀번호는 8자 이상으로 입력하셔야 합니다.',
        password_mismatch: '비밀번호 재입력이 일치하지 않습니다.',
        beforeunload: '저장하지 않고 페이지를 나가시겠습니까?',
    },
    alert: {
        signup: '회원 가입완료 되었습니다.',
        login: '로그인이 완료 되었습니다.',
        logout: '로그아웃이 완료 되었습니다.'
    },
    form: {
        login: '로그인',
        profile: '프로필',
        signup: '회원가입',
        find: '비밀번호 찾기',
        id: '이메일',
        pw: '비밀번호',
        re: '비밀번호 다시입력',
        cancel: '취소',
        apply: '적용'
    },
    empty: ' '
}

const footer = createElement('footer').attrs({ class: 'content fold-end' }).props({ innerHTML: '이 저작물은 CC BY-NC-SA 2.0 KR에 따라 이용할 수 있습니다. (단, 라이선스가 명시된 일부 문서 및 삽화 포함)<br>기여하신 문서의 저작권은 각 기여자에게 있으며, 각 기여자는 기여하신 부분의 저작권을 갖습니다.<br><br>네무위키는 백과사전이 아니며 검증되지 않았거나, 편향적이거나, 잘못된 서술이 있을 수 있습니다.<br>네무위키는 위키위키입니다. 여러분이 직접 문서를 고칠 수 있으며, 다른 사람의 의견을 원할 경우 직접 토론을 발제할 수 있습니다.<br>' });

const FINAL = {
    PERMISSION: {
        R: 0, // 읽기 전용
        RW: 1, // 수정가능, 삭제불가
        RWD: 2 // 무제한 권한
    }
}

let firebase = {};

let Options = {
    board: [],
    categories: [],
    get(target) {
        switch (target) {
            case 'board': return Options.board.map(data => { return { ...data, value: data.name, path: getBoardPath(data), owner: data.owner }; }).sort((data, data2) => data.path.localeCompare(data2.path));
            case 'categories': return Options.categories.map(data => { return { ...data, value: data.name, is_owner: data.owner == app.user?.uid }; }).sort(data => data.value);
        }
    }
}

let Listerners = {};

let app = {}, app_aside = {}, app_article = {}, now = {};
let devmode = false;
let version = devmode ? new Date().getTime() : 'v2.0.8';
const DOMAIN = 'nemuwiki.com';
const SUFFIX = location.hostname.endsWith(DOMAIN) ? '' : '.html';

const OLD_ROOT_PATH = '/wiki';
const ROOT_PATH = '/';
const FILE_UPLOAD_METHOD = 0; // 0 is imgur, 1 is firestorage

const Notify = {
    alert: param => { return alert(param); },
    confirm: param => { return confirm(param); },
    prompt: param => { return prompt(param); },
    error: param => { console.error(param); }
}
const dev = console;
const REGEX = {
    annotation: /\[\*(\S+)\s([^\[\]]+)\]/i,
    link: /\[link\:([^\s\[\]]+)\]/i,
    image: /\[image\:([^\s\[\]]+)\]/i,
    video: /\[video\:([^\s\[\]]+)\]/i,
    music: /\[music\:([^\s\[\]]+)\]/i,
    colspan: /\[colspan\:([^\s\[\]]+)\]/i,
    rowspan: /\[rowspan\:([^\s\[\]]+)\]/i,
    css: /%\{([^\s\{\}]+)\}([^\{\}]+)%/i,
};

window.onload = async function () {
    if (location.href.startsWith(location.origin + OLD_ROOT_PATH)) history.replaceState({}, '', location.href.replace(OLD_ROOT_PATH, ''));

    const module = await import(`./firebase.js?version=${version}`);
    firebase = module.default;

    app = new Router();

    checkLogin();

    await app.load();

    listenBoard();
}

function validate(input, input_2, type = 'text') {
    if (input.value != undefined && input.value != '') {
        input.setCustomValidity('valueMissing');
        if (input_2 == undefined || input.value == input_2.value) {
            if (input_2) input_2.setCustomValidity('');
            switch (type) {
                case 'email':
                    if (/^\S+@\S+$/.test(input.value)) input.setCustomValidity('');
                    else input.setCustomValidity('typeMismatch');
                    break;
                case 'password':
                    if (input.value.length > 7) input.setCustomValidity('');
                    else input.setCustomValidity('tooShort');
                    break;
            }
        } else input_2.setCustomValidity('valueMisMatch');
    } else input.setCustomValidity('valueMissing');
    return input.checkValidity();
}

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
            case `/index`:
                className = 'index';
                break;
            case `/login`:
            case `/signup`:
                className = 'login';
                break;
            case `/form`:
                className = 'form';
                break;
            case `/profile`:
                className = 'profile';
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

function encodeVisited(str) {
    return str.replace(/:/g, '&colon;');
}
function decodeVisited(str) {
    return str.replace(/&colon;/g, ':');
}

window.addEventListener('popstate', function () {
    if (app.blockMode) app.blockMode = !Notify.confirm(TEXTS.warn.beforeunload);
    if (app.blockMode) return history.pushState(null, null, window.location.href);
    app.load();
});

window.addEventListener('click', function (e) {
    let a = e.target.closest('a');
    if (a && !e.ctrlKey) {
        let full_url = a.getAttribute('href');
        if (!full_url) return;
        if (full_url.startsWith('#')) {
            e.preventDefault();
            document.querySelector(full_url)?.scrollIntoViewIfNeeded();
            history.pushState({}, '', full_url);
            return;
        }
        if (move(full_url)) e.preventDefault();
    }
});

window.addEventListener('beforeunload', e => {
    if (app.blockMode) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
});

function move(full_url, forward, load = true) {
    if (document.activeElement) document.activeElement.blur();
    let { isInlink, path, search, hash } = parseUrl(full_url)
    if (isInlink) {
        if (app.blockMode) app.blockMode = !Notify.confirm(TEXTS.warn.beforeunload);
        if (app.blockMode) return true;
        if (forward) history.replaceState({}, '', `${path + search + hash}`);
        else history.pushState({}, '', `${path + search + hash}`);
        if (load) app.load(path, search);
    }
    return isInlink;
}

function parseUrl(full_url) {
    try {
        let url = new URL(full_url, location.href);
        return {
            hash: url.hash,
            search: url.search,
            path: url.pathname,
            isInlink: location.hostname == url.hostname
        };
    } catch (error) {
        return { isInlink: false, error };
    }
}

function imgurThumb(url, size = 'm') {
    let fullName = url.split('/').pop();
    let [name, extension] = fullName.split('.');
    if (extension.toLowerCase() === 'png') return url;
    return `https://i.imgur.com/${name}${size}.${extension}`;
}

let html_annotation = '';

function markdown(html, cell) {
    return html
        .replace(REGEX.annotation, (full_str, index, description) => {
            html_annotation += `<p id="anno_${index}"><a href="#sup_${index}">[${index}]</a> ${description}</p>`;
            return `<a href="#anno_${index}"><sup title="${description}" id="sup_${index}">[${index}]</sup></a>`;
        })
        .replace(REGEX.colspan, (full_str, group1) => {
            cell.dataset.colspan = group1;
            return '';
        })
        .replace(REGEX.rowspan, (full_str, group1) => {
            cell.dataset.rowspan = group1;
            return '';
        })
        .replace(REGEX.css, (full_str, cssString, text) => `<span style="${cssString}"/>${text}</span>`)
        .replace(REGEX.image, (full_str, group1) => `<img src="${group1}"/>`)
        .replace(REGEX.link, (full_str, group1) => {
            let [link, namespace] = group1.split(';')
            return `<a class="link" href="${link.startsWith('http') ? link : ('//' + link)}" target="_blank">${namespace || '링크'}</a>`;
        })
        .replace(REGEX.video, (full_str, group1) => `<iframe width="560" height="315" src="//www.youtube.com/embed/${getYoutubeId(group1)}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`);
}

async function uploadByImgur(file) {
    loading(0);
    let bodyData = new FormData();
    bodyData.append("image", file);
    loading(0.1);
    const response = await fetch('https://api.imgur.com/3/image', {
        method: "POST",
        headers: {
            Authorization: 'Client-ID cfb9241edbf292e',
            Accept: 'application/json',
        },
        body: bodyData,
    });
    loading(0.7);
    let result = await response.json();
    loading(0.9);
    if (result.status === 200) firebase.resources.regist(result.data).catch(dev.error);
    loading(1);
    return result;
}

function getYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11)
        ? match[2]
        : null;
}

function loading(float) {
    /*로딩바*/
}

function goShare(destination, url = location.href) {
    if (destination == undefined && typeof navigator.share == 'function') {
        navigator.share({
            title: document.title,
            text: document.title,
            url: url,
        });
    } else {
        let searchParams = new URLSearchParams();
        switch (destination) {
            case 'twitter':
                searchParams.set("url", url);
                searchParams.set("text", `${document.title}\n`);
                window.open(`https://twitter.com/intent/post?${searchParams.toString()}`, '_blank').focus();
                break;
        }
    }
}

function modal(mode = 'emailPrompt', callback, option) {
    let container = createElement('dialog');
    let form = createElement('form').attrs({ method: 'dialog' });
    let button_cancel = createElement('button').props({ value: 'cancel' }).attrs({ class: 'button secondary' }).props({ innerHTML: TEXTS.form.cancel });
    document.body.append(container);
    container.append(form);
    form.append(MODAL_TEMPLATE[mode](container, callback, option));
    form.append(button_cancel);
    container.showModal();
    container.onclose = () => container.remove();
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
                        alert('메일이 전송되었습니다.');
                        container.close();
                    })
                    .catch(firebaseErrorHandler);
            } else alert('옳바른 이메일을 입력하세요!');
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
                    alert('메일이 전송되었습니다.');
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
                if (confirm('카테고리를 생성하시겠습니까?')) {
                    if (Options.categories.find(obj => obj.value === text_input.value)) return alert('동일 명칭의 카테고리가 이미 존재합니다!!');
                    firebase.categories.insertOne({ name: text_input.value, owner: app.user.uid })
                        .then(() => {
                            alert('카테고리가 추가되었습니다.');
                            container.close();
                        })
                        .catch(firebaseErrorHandler);
                }
            } else {
                alert('카테고리 명칭을 입력해 주세요.')
            }
        }
        return frag;
    },
    addMenu: container => {
        container.css({ overflow: 'visible' });
        let frag = document.createDocumentFragment();
        let h3 = createElement('h3').props({ innerHTML: '분류 추가' });
        let parent_select = createSelect(Options.get('board'), 0, true, '상위 분류').addClass('input','flex-horizontal').css({ 'margin-bottom': 'var(--spacing-small)', 'max-width': '100%', 'min-width': '15rem' });
        let text_input_container = createElement('div').attrs({ class: 'b_input', placeholder: '분류명' }).css({ 'min-width': '18rem', 'margin-bottom': 'var(--spacing-small)' });
        let text_input = createElement('input').attrs({ type: 'text', placeholder: ' ' });
        let button_confirm = createElement('button').attrs({ class: 'button primary' }).props({ innerHTML: '생성' });

        frag.append(h3, parent_select, text_input_container, button_confirm);
        text_input_container.append(text_input);

        button_confirm.onclick = e => {
            e.preventDefault();

            if (text_input.value) {
                if (confirm('메뉴를 생성하시겠습니까?')) {
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
                    alert('Imgur사이트 파일 업로드에 실패했습니다.');
                    input_file.setAttribute('type', 'text');
                    input_file.value = '';
                    input_file.setAttribute('type', 'file');
                }
            }
        }

        imgSelector__list__link.onclick = e => {
            e.preventDefault();
            let link = prompt('사용할 이미지의 URL을 입력해 주세요');
            if (link) {
                container.close();
                callback(link);
            } else {
                alert('URL을 입력해 주세요!!');
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
                alert('이미지를 선택해 주세요!!');
            }
        }
        return frag;
    }
};
