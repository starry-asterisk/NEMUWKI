async function createVisited() {
    for (let str of visited) {
        let [visited_id, title, board_name] = str.split(':');
        let li = createElement('li');
        let li_a = createElement('a', { innerHTML: `${SuggestList['board2Path_2'][board_name] || board_name} : ${title}`, attrs: { href: `${ROOT_PATH}?post=${visited_id}` } });
        li.append(li_a);
        recent_post.append(li);
    }
}

async function createCategories(pathFromBoard = SuggestList['board2Path_2']) {
    for (let pathname in pathFromBoard) {
        let li = createElement('li');
        li.append(createElement('a', { innerHTML: pathFromBoard[pathname], attrs: { href: `${ROOT_PATH}?keyword=${pathname}&field=board_name_arr&operator=array-contains` } }));
        category_list.append(li);
    }
}

function loadNotice() {
    firebase.notice.getNewest().then(ref => {
        for (let doc of ref.docs) {
            createNotice(doc.data());
            break;
        }
    }).catch(firebaseErrorHandler);
}

function createProfile(user) {
    let profile = createElement('div', { attrs: { class: 'profile' } });
    let profile__input = createElement('input', { attrs: { type: 'file' } });
    let profile__label = createElement('label');
    let profile__photo = createElement('span', { attrs: { class: 'profile__photo' } });
    let profile__photo__img = createElement('img');
    let profile__photo__input = createElement('input', { attrs: { type: 'file' } });
    let profile__photo__label = createElement('label');
    let profile__email = createElement('div', { innerHTML: user.email, attrs: { class: 'profile__email' } });

    profile.append(profile__label);
    profile__label.append(profile__input);
    profile.append(profile__photo);
    profile__photo.append(profile__photo__img);
    profile__photo__label.append(profile__photo__input);
    profile__photo.append(profile__photo__label);
    user_area.append(profile);
    user_area.append(profile__email);

    if (user.emailVerified) profile__email.append(createElement('span', { attrs: { class: 'mdi mdi-check-decagram ' }, styles: { color: 'var(--clr-primary-base)' } }));
    else profile__email.append(createElement('span', { innerHTML: '인증하기', styles: { 'font-size': '1.5rem', opacity: 0.8, 'padding-left': '1rem', color: 'var(--clr-primary-base)', 'white-space': 'nowrap' }, on: { click: () => modal('emailConfirm') } }));

    let upload = createElement('button', { innerHTML: '문서 작성', attrs: { class: 'normal' } });
    let logout = createElement('button', { innerHTML: '로그아웃', attrs: { class: 'normal' }, styles: { 'margin-top': '1rem' } });
    let button_container = createElement();
    button_container.append(upload);
    button_container.append(logout);
    user_area.append(button_container);

    firebase.auth.getUser().then(user => {
        let data = user.data();
        if (data.banner_url) profile.setStyles({ '--background-url': `url("${data.banner_url}")` });
        if (data.photo_url) profile__photo__img.src = data.photo_url;
    });

    profile__photo__input.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        modal('addImg', photo_url => {
            profile__photo__img.src = photo_url;
            firebase.auth.updateUser(user.uid, { photo_url });
        });
    }

    profile__input.onclick = e => {
        e.preventDefault();
        e.stopPropagation(); 
        modal('addImg', banner_url => {
            profile.setStyles({ '--background-url': `url("${banner_url}")` });
            firebase.auth.updateUser(user.uid, { banner_url });
        });
    }

    upload.onclick = () => location.href = `${ROOT_PATH}form${SUFFIX}`;
    logout.onclick = () => {
        firebase.auth.logout()
            .catch(firebaseErrorHandler);
    }
}

function createLoginForm() {
    let loginMode = true;
    let email = createElement('input', { attrs: { type: 'text', name: 'email', placeholder: '이메일' } });
    let password = createElement('input', { attrs: { type: 'password', name: 'password', placeholder: '비밀번호' } });
    let password_re = createElement('input', { attrs: { type: 'password', name: 'password_re', placeholder: '비밀번호 재입력' } });

    let email_container = createElement('div', { attrs: { class: 'input_container' } });
    let password_container = email_container.cloneNode();
    let password_container_re = email_container.cloneNode();

    let button_container = createElement();

    let submit_login = createElement('button', { innerHTML: '로그인', attrs: { class: 'normal' } });
    let submit_signup = createElement('button', { innerHTML: '가입하기', styles: { display: 'none' }, attrs: { class: 'normal' } });
    let a_signup = createElement('a', {
        innerHTML: '가입하기',
        attrs: { href: '#user_area' },
        styles: { 'text-align': 'center' },
        on: {
            click: () => {
                loginMode = !loginMode;
                submit_login.setStyles({ display: loginMode ? 'block' : 'none' });
                submit_signup.setStyles({ display: loginMode ? 'none' : 'block' });
                password_container_re.setStyles({ display: loginMode ? 'none' : 'block' });
                a_signup.innerHTML = loginMode ? '가입하기' : '로그인';
            }
        }
    });
    let a_find_password = createElement('a', {
        innerHTML: '비밀번호 찾기',
        attrs: { href: '#' },
        styles: { 'text-align': 'center' },
        on: {
            click: () => modal('emailPrompt')
        }
    });

    submit_login.onclick = () => {
        if (!validate(email, undefined, 'email')) return;
        if (!validate(password, undefined, 'password')) return;
        firebase.auth.login(email.value, password.value)
            .catch(firebaseErrorHandler);
    }
    submit_signup.onclick = () => {
        if (!validate(email, undefined, 'email')) return;
        if (!validate(password, undefined, 'password')) return;
        if (!validate(password, password_re, 'password')) return;
        firebase.auth.signup(email.value, password.value)
            .then(creditional => creditional && alert('회원 가입완료 되었습니다.'))
            .catch(firebaseErrorHandler);
    }

    email_container.append(email);
    password_container.append(password);
    password_container_re.append(password_re);

    button_container.append(submit_login);
    button_container.append(submit_signup);

    user_area.append(email_container);
    user_area.append(password_container);
    user_area.append(password_container_re);
    user_area.append(button_container);
    user_area.append(a_signup);
    user_area.append(a_find_password);

    password_container_re.setStyles({ display: 'none' });

    password_re.oninput = () => validate(password_re, password, 'password');
}

async function createList1(keyword, field, operator, targetHeader = total, searchData = {}) {
    let load_more = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
    let board_list = createElement('div', { attrs: { class: 'content board_list_1' } });

    let docs, { next } = await firebase.search.list({ [field]: keyword, ...searchData }, operator);

    load_more.onclick = async () => {
        load_more.disabled = true;
        docs = await next();
        load();
    }

    targetHeader.after(board_list);
    board_list.after(load_more);
    await load_more.onclick();

    function load() {
        load_more.disabled = false;
        for (let doc of docs) {
            let data = doc.data();
            data.board_name = SuggestList['board2Path_2'][data.board_name] || data.board_name;
            board_list.append(createElement('div', {
                attrs: { board_name: data.board_name, title: data.title },
                on: {
                    click: () => {
                        location.href = `${ROOT_PATH}?post=${doc.id}`;
                    }
                }
            }));
        }
        if (docs.length < 25) load_more.setStyles({ display: 'none' });
    }
}

async function createList2(keyword = '', field = 'author', operator = 'equal', targetHeader = people, searchData = {}) {

    let load_more = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
    let board_list_2 = createElement('div', { attrs: { class: 'content board_list_2' } });

    let docs, next = firebase.search.list({ category: '인물', [field]: keyword, ...searchData }, operator).next;

    load_more.onclick = async () => {
        load_more.disabled = true;
        docs = await next();
        load();
    }

    targetHeader.after(board_list_2);
    board_list_2.after(load_more);

    await load_more.onclick();

    function load() {
        load_more.disabled = false;
        for (let doc of docs) {
            let data = doc.data();
            board_list_2.append(createList2Item(data, doc.id));
        }
        if (docs.length < 25) load_more.setStyles({ display: 'none' });
    }

    function createList2Item(data, id) {
        let item = createElement('div', {
            innerHTML: `<span class="sub">${data.board_name}</span><span>${data.title}</span>`,
            on: {
                click: () => {
                    location.href = `${ROOT_PATH}?post=${id}`;
                }
            }
        });
        let img = createElement('img');

        item.prepend(img);

        if (data.thumbnail) {
            if (data.thumbnail.startsWith('http')) img.src = data.thumbnail;
            else firebase.storage.getUrl(data.thumbnail).then(url => img.src = url);
        }
        else img.src = '[ no image ]';

        return item;
    }
}

function buildPost(data, renderInfo = true) {
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        contents
    } = data;

    if (renderInfo) {
        let alter_path_arr = SuggestList['board2Path_1'] || [];
        let path_arr = board_name_arr || alter_path_arr.find(row => row.name == board_name)?.path_arr || [board_name];


        let main__document_info = createElement('div', { attrs: { class: 'main__document_info' } });
        for (let path of path_arr) {
            main__document_info.append(createElement('a', { attrs: { href: `${ROOT_PATH}?field=board_name_arr&operator=array-contains&keyword=${path}` }, innerHTML: path }));
        }

        main__document_info.append(createElement('a', { attrs: { href: `${ROOT_PATH}?field=category&keyword=${category}&operator=equal`, class: 'category' }, innerHTML: category }));

        document.querySelector('.main__header').after(main__document_info);

        main__header__title.innerHTML = title;
        main__header__timestamp.innerHTML = new Date(1000 * timestamp.seconds).toLocaleString();
    }


    let component_list = {};

    for (let content of contents) {
        if (component_list[content.type] == undefined) component_list[content.type] = [];
        let div = createElement('div', { attrs: { class: `content ${content.type}` } });
        div.append(COMPONENT_BUILD_SPEC[content.type](content.value));
        component_list[content.type].push(div);
        main__contents.append(div);
    }

    for (let title of component_list['title'] || []) {
        let toggle = true;
        title.onclick = () => {
            toggle = !toggle;
            toggle ? title.classList.remove('fold') : title.classList.add('fold');
            let next = title.nextElementSibling;
            while (next != undefined && !next.classList.contains('title') && !next.classList.contains('seperator')) {
                next.style.display = toggle ? 'block' : 'none';
                next = next.nextElementSibling;
            }
        }
    }

    let summury = component_list['summury'] ? component_list['summury'][0] : undefined;
    if (summury) {
        let index_div = createElement('div', { attrs: { class: 'index' } });
        let index__hover = createElement('div', { attrs: { class: 'index__hover' } });
        document.body.append(index_div);
        index_div.append(index__hover);
        summury.setAttribute('id', 'summary');
        let title_list = component_list['title'];
        let title_datas = contents.filter(content => content.type == 'title');
        let depth = 1;
        let depth_info = [];
        let prefix_arr = [];
        let sub_index = 1;
        let main_rect = main__contents.getBoundingClientRect();
        for (let index in title_datas) {
            let data = title_datas[index].value;
            if (depth < data.depth) {
                depth++;
                prefix_arr.push(sub_index);
                sub_index = 1;
            } else {
                depth = data.depth;
                prefix_arr = prefix_arr.slice(0, depth - 1);
                let info = depth_info.findLast(info => info.depth == depth);
                sub_index = info?.sub_index || 0;
                sub_index++;
            }
            depth_info.push({ depth, sub_index: sub_index });
            let a = createElement('a',
                {
                    innerHTML: `${[...prefix_arr, sub_index].join('.')}. <span style="color:var(--clr-font)">${data.text}</span>`,
                    attrs: { href: `#title_${index}` },
                    styles: { 'margin-left': `${depth * 2}rem` },
                    on: {
                        click: e => {
                            e.preventDefault();
                            history.pushState({}, "", `#title_${index}`);
                            title_list[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                            return false;
                        }
                    }
                });

            let marginTop = (title_list[index].getBoundingClientRect().y - main_rect.y) / main__contents.scrollHeight * 100;
            index_div.append(createElement('a',
                {
                    styles: { top: `${marginTop}%` },
                    attrs: { href: `#title_${index}`, 'data-tooltip': `${[...prefix_arr, sub_index].join('.')}. ${data.text}` },
                    on: {
                        click: e => {
                            e.preventDefault();
                            title_list[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                            return false;
                        }
                    }
                }));
            let pre_fix = createElement('a', { innerHTML: `${[...prefix_arr, sub_index].join('.')}. `, attrs: { href: `#summary` } });
            title_list[index].prepend(pre_fix);
            title_list[index].setAttribute('id', `title_${index}`)
            summury.append(a);
        }

        let hash_regex = /\#index_(\S+)/;
        if (hash_regex.test(location.hash)) {
            title_list[hash_regex.exec(location.hash)[1]]?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }

    if (html_annotation.length > 0) {
        let annotation = createElement('div', { attrs: { class: 'content annotation' } });
        annotation.innerHTML = html_annotation;
        html_annotation = '';
        main__contents.append(annotation);
    }
}

const COMPONENT_BUILD_SPEC = {
    textbox: (value) => {
        let frag = document.createDocumentFragment();
        let tpl = createElement('template');
        tpl.innerHTML = markdown(value);
        frag.appendChild(tpl.content);
        return frag;
    },
    image: (value, mediaTytpe = 'img') => {
        let media = createElement(mediaTytpe, { attrs: { controls: mediaTytpe != 'img' } });

        if (value.startsWith('http')) media.src = value;
        else firebase.storage.getUrl(value).then(url => media.src = url);

        return media;
    },
    audio: (value) => COMPONENT_BUILD_SPEC.image(value, 'audio'),
    video: (value) => COMPONENT_BUILD_SPEC.image(value, 'video'),
    table: (value) => {
        let { cells, header, rowcount, cellColors = [], outerLineWidth = 1, outerLineColor = '#cccccc', innerLineColor = '#cccccc', isFullWidth } = value;
        let table = createElement('editable-table', {}, {
            rowcount,
            colcount: header.length,
            readonly: true
        });
        table.setHeader(header);
        table.setData(cells);
        table.setCellColors(cellColors);
        table.outerLineWidth = outerLineWidth;
        table.outerLineColor = outerLineColor;
        table.innerLineColor = innerLineColor;
        if (isFullWidth) table.classList.add('fullWidth');
        return table;
    },
    title: (value) => document.createTextNode(value.text),
    seperator: () => document.createDocumentFragment(),
    summury: () => document.createDocumentFragment(),
    caption: (value) => {
        let frag = document.createDocumentFragment();

        return frag;
    },
    youtube: (value)=>{
        let video_id = getYoutubeId(value.link);
        let start = value.start || 0;
        return createElement('iframe',{attrs:{
            title: 'YouTube video player',
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            referrerpolicy: 'strict-origin-when-cross-origin',
            allowfullscreen: true,
            width: 530,
            height: 315,
            src: `//www.youtube.com/embed/${video_id}?start=${start}`
        }})
    }
}

export { createVisited, createCategories, loadNotice, createProfile, createLoginForm, createList1, createList2, buildPost };