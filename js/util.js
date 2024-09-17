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

function createElement(tagName = 'div') {
    return document.createElement(tagName);
}

function emptyNode(node) {
    let childs = Array.from(node.childNodes);
    for (let child of childs) child.remove();
}

// Not-Used
function parseHTML(htmlText) {
    let frag = document.createDocumentFragment();
    frag.insertAdjacentHTML("afterbegin", htmlText);
    return frag.firstChild;
}

function scrollToCaret() {
    return;//임시조치
    // 현재 선택된 커서 위치 가져오기
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if(!rect.top) return;
      // 화면에서 커서 위치의 절대 좌표 가져오기
      const absoluteCaretY = section.scrollTop + rect.top;
  
      // 커서가 보이지 않는 위치에 있을 때 스크롤 맞추기
      section.scrollTop = absoluteCaretY - (section.clientHeight / 2);
    }
  }

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


function remove(button, post_id, isTemplate) {
    if (!Notify.confirm('정말로 삭제 하시겠습니까?') || !Notify.confirm('안내 : 삭제 이후 5일 이상이 경과하면 삭제가 불가할 수 있습니다')) return;
    button.setAttribute('disabled', true);
    firebase.post.deleteTemporary(post_id, undefined, isTemplate)
        .then(async () => {
            await firebase.search.unset(post_id);
            move('/');
        })
        .catch(firebaseErrorHandler);
}

function logout() {
    firebase.auth.logout()
        .then(() => {
            move('/');
            Notify.alert(TEXTS.alert.logout);
        })
        .catch(firebaseErrorHandler);
}

function checkLogin() {
    firebase.auth.check(user => {
        nav__my_btn.innerHTML = TEXTS.form.profile;
        nav__my_btn.onclick = null;
        pop_profile.style.removeProperty('display');
        app.user = user;
        firebase.auth.getUser().then(user => {
            let data = user.data();
            if (data.banner_url) profile__background.css({ display: 'block' }) && (profile__background.src = data.banner_url);
            if (data.photo_url) profile__avatar.css({ display: 'block' }) && (profile__avatar.src = data.photo_url);
            if (data.theme_color) {
                document.body.style.setProperty('--light-blue-300', data.theme_color);
                document.body.style.setProperty('--light-blue-400', data.theme_color);
                document.body.style.setProperty('--light-blue-500', data.theme_color);
                document.body.style.setProperty('--light-blue-600', data.theme_color);
                document.body.style.setProperty('--light-blue-700', data.theme_color);
                document.body.style.setProperty('--light-blue-800', data.theme_color);
                document.body.style.setProperty('--light-blue-a400', data.theme_color+'97');
                document.body.style.setProperty('--light-blue-visited', data.theme_color+'aa');
            }
            if (data.theme_sub_color) document.body.style.setProperty('--color-bg-light', data.theme_sub_color);
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

function encodeVisited(str) {
    return str.replace(/:/g, '&colon;');
}
function decodeVisited(str) {
    return str.replace(/&colon;/g, ':');
}

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

function focusSearch() {
    if (typeof search_wrap != 'undefined') search_wrap?.scrollIntoViewIfNeeded();
    if (typeof search__input != 'undefined') search__input?.focus({ preventScroll: true });
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


async function deleteImgurImg(id, deleteHash, url) {
    const response = await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
        method: 'DELETE',
        headers: {
            Authorization: 'Client-ID cfb9241edbf292e',
            Accept: 'application/json'
        }
    })
    let result = await response.json();
    if (result.status === 200) firebase.resources.delete(id, deleteHash, url).catch(dev.error);
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
                searchParams.set("text", `${document.title}\n#NEMUWIKI #네무위키\n`);
                window.open(`https://twitter.com/intent/tweet?${searchParams.toString()}`, '_blank').focus();
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

function loadStyle(namespace) {
    if (document.querySelectorAll(`link[href*="${namespace}"]`).length > 0) return;
    document.head.append(
        createElement('link').attrs({ rel: 'stylesheet', href: `./css/${namespace}.css?_v=${version}` })
    );
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

let __CallStack__ = {
    categories: [],
    board: []
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
let version = devmode ? new Date().getTime() : 'v2.3.0';
const DOMAIN = 'nemuwiki.com';

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

let html_annotation = '';

window.onload = async function () {
    if (location.href.startsWith(location.origin + OLD_ROOT_PATH)) history.replaceState({}, '', location.href.replace(OLD_ROOT_PATH, ''));

    const module = await import(`./firebase.js?version=${version}`);
    firebase = module.default;

    app = new Router();

    checkLogin();

    await app.load();

    listenBoard();
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

let keyboardStatus = {};
window.addEventListener('keydown', e => {
    keyboardStatus.shift = e.shiftKey;
    keyboardStatus.ctrl = e.shiftKey;

});
window.addEventListener('keyup', e => {
    keyboardStatus.shift = e.shiftKey;
    keyboardStatus.ctrl = e.ctrlKey;
});
window.addEventListener('blur', () => {
    keyboardStatus = {};
});