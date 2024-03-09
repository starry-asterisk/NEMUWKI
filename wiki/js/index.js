
function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

async function firebaseLoadCallback() {
    document.body.classList.add('loading');

    let main__header__toolbox = document.querySelector('.main__header__toolbox');
    let toolbox__editButton;

    firebase.auth.check(user => {
        user_area.innerHTML = '';
        createProfile(user);
        document.body.classList.remove('non-auth');
        if (post_id) {
            if(toolbox__editButton == undefined) toolbox__editButton = createElement('button', {
                innerHTML: '수정', on: {
                    click: () => {
                        location.href = `${ROOT_PATH}form${SUFFIX}?post=${post_id}`;
                    }
                }
            });
            main__header__toolbox.append(toolbox__editButton);
        }
    }, () => {
        user_area.innerHTML = '';
        createLoginForm();
        document.body.classList.add('non-auth');
        if(toolbox__editButton) toolbox__editButton.remove();
    });

    SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
    let pathFromBoard = board2Path(SuggestList['board'], 2);

    createCategories(pathFromBoard);

    if (post_id) {
        main__contents.innerHTML = '';
        let doc = await firebase.post.selectOne(post_id);
        let data = doc.data();

        if (data == undefined) return NetErrorHandler(404);

        document.title = `${PAGE_PREFIX}${data.board_name} - ${data.title}`;

        let old_visited_index = visited.indexOf(`${post_id}:${data.title}:${data.board_name}`);
        if (old_visited_index > -1) visited.splice(old_visited_index, 1);
        visited.unshift(`${post_id}:${data.title}:${data.board_name}`);
        visited.splice(VISITED_MAX);
        localStorage.setItem('visited', visited);

        buildPost(data);
        document.querySelector('.main__header__toolbox').style.display = 'flex';
    } else {
        main__header__timestamp.innerHTML = new Date().toLocaleString();
        setTimeout(() => {
            setInterval(() => {
                main__header__timestamp.innerHTML = new Date().toLocaleString();
            }, 1000);
        }, 1000 - new Date().getMilliseconds());

        let keyword = params.get('keyword') || '';
        let field = params.get('field') || 'title';
        let operator = params.get('operator') || 'contains';
        let load_more = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
        let board_list = createElement('div', { attrs: { class: 'board_list_1' } });

        let docs, { next } = await firebase.post.list({ [field]: keyword }, false, operator);

        search_input.value = keyword;

        load_more.onclick = async () => {
            docs = await next();
            load();
        }

        total.after(board_list);
        board_list.after(load_more);
        await load_more.onclick();

        function load() {
            for (let doc of docs) {
                let data = doc.data();
                data.board_name = pathFromBoard[data.board_name] || data.board_name;
                board_list.append(createType1Item(data, doc.id));
            }
            if (docs.length < 25) load_more.setStyles({ display: 'none' });
        }

        let load_more2 = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
        let board_list_2 = createElement('div', { attrs: { class: 'board_list_2' } });

        let docs2, next2 = firebase.post.list({ category: '인물' }, false, 'equal').next;

        load_more2.onclick = async () => {
            docs2 = await next2();
            load2();
        }

        people.after(board_list_2);
        board_list_2.after(load_more2);

        await load_more2.onclick();

        function load2() {
            for (let doc of docs2) {
                let data = doc.data();
                board_list_2.append(createType2Item(data, doc.id));
            }
            if (docs2.length < 25) load_more2.setStyles({ display: 'none' });
        }

        firebase.notice.getNewest().then(ref => {
            for (let doc of ref.docs) {
                createNotice(doc.data());
                break;
            }
        }).catch(firebaseErrorHandler);
    }

    try {
        for (let str of visited) {
            let [visited_id, title, board_name] = str.split(':');
            let li = createElement('li');
            let li_a = createElement('a', { innerHTML: `${pathFromBoard[board_name] || board_name} : ${title}`, attrs: { href: `${ROOT_PATH}?post=${visited_id}` } });
            li.append(li_a);
            recent_post.append(li);
        }
    } catch (e) {
        firebaseErrorHandler(e);
    }

    document.body.classList.remove('loading');
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

    if (user.emailVerified) profile__email.append(createElement('span', { attrs: { class: 'mdi mdi-check-decagram ' }, styles: { color: 'var(--accent)' } }));
    else profile__email.append(createElement('span', { innerHTML: '인증하기', styles: { 'font-size': '1.5rem', opacity: 0.8, 'padding-left': '1rem', color: 'var(--accent)', 'white-space': 'nowrap' }, on: { click: () => modal('emailConfirm') } }));

    let upload = createElement('button', { innerHTML: '글쓰기', attrs: { class: 'normal' } });
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

    profile__photo__input.onchange = changeImage(profile__photo__input, photo_url => {
        profile__photo__img.src = photo_url;
        firebase.auth.updateUser(user.uid, { photo_url });
    });

    profile__input.onchange = changeImage(profile__input, banner_url => {
        profile.setStyles({ '--background-url': `url("${banner_url}")` });
        firebase.auth.updateUser(user.uid, { banner_url });
    });

    upload.onclick = () => location.href = `${ROOT_PATH}form${SUFFIX}`;
    logout.onclick = () => {
        firebase.auth.logout()
            .catch(firebaseErrorHandler);
    }

    function changeImage(input, callback) {
        return async () => {
            if (input.files.length < 1) return 0;
            let file = input.files[0];
            let result = await uploadByImgur(file);
            if (result.status == 200) {
                callback(result.data.link);
            } else {
                alert('프로필 이미지 업로드에 실패했습니다.');
            }
        }
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
        attrs: { href: '#' },
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

function createCategories(pathFromBoard) {
    for (let pathname in pathFromBoard) {
        let li = createElement('li');
        li.append(createElement('a', { innerHTML: pathFromBoard[pathname], attrs: { href: `${ROOT_PATH}?keyword=${pathname}&field=board_name_arr&operator=array-contains` } }));
        category_list.append(li);
    }
}

function createType1() {

}

function createType1Item(data, id) {
    return createElement('div', {
        attrs: { board_name: data.board_name, title: data.title },
        on: {
            click: () => {
                location.href = `${ROOT_PATH}?post=${id}`;
            }
        }
    });
}

function createType2() {

}

function createType2Item(data, id) {
    let item = createElement('div', {
        innerHTML: `${data.board_name}<br>${data.title}`,
        on: {
            click: () => {
                location.href = `${ROOT_PATH}?post=${id}`;
            }
        }
    });
    let img = createElement('img');

    item.prepend(img);

    let urlObj = data.contents.find(content => content.type == 'image');
    if (urlObj?.value) {
        if (urlObj.value.startsWith('http')) img.src = urlObj.value;
        else firebase.storage.getUrl(urlObj.value).then(url => img.src = url);
    }
    else img.src = '[ no image ]';

    return item;
}

function buildPost(data) {
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        contents
    } = data;

    let path_arr = board_name_arr || board2Path(SuggestList['board']).find(row => row.name == board_name)?.path_arr || [board_name];


    let main__document_info = createElement('div', { attrs: { class: 'main__document_info' } });
    for (let path of path_arr) {
        main__document_info.append(createElement('a', { attrs: { href: `${ROOT_PATH}?field=board_name_arr&operator=array-contains&keyword=${path}` }, innerHTML: path }));
    }

    main__document_info.append(createElement('a', { attrs: { href: `${ROOT_PATH}?field=category&keyword=${category}`, class: 'category' }, innerHTML: category }));

    document.querySelector('.main__header').after(main__document_info);

    main__header__title.innerHTML = title;
    main__header__timestamp.innerHTML = new Date(1000 * timestamp.seconds).toLocaleString();

    let component_list = {};

    for (let content of contents) {
        if (component_list[content.type] == undefined) component_list[content.type] = [];
        let div = createElement('div', { attrs: { class: content.type } });
        div.append(COMPONENT_SPEC[content.type](content.value));
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
                    innerHTML: `${[...prefix_arr, sub_index].join('.')}. <span style="color:black;">${data.text}</span>`,
                    attrs: { href: `#title_${index}` },
                    styles: { 'margin-left': `${depth * 2}rem` },
                    on: {
                        click: e => {
                            e.preventDefault();
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
    }
}


const COMPONENT_SPEC = {
    textbox: (value) => {
        let frag = document.createDocumentFragment();
        let tpl = createElement('template');
        tpl.innerHTML = value;
        frag.appendChild(tpl.content);
        return frag;
    },
    image: (value, mediaTytpe = 'img') => {
        let media = createElement(mediaTytpe, { attrs: { controls: mediaTytpe != 'img' } });

        if (value.startsWith('http')) media.src = value;
        else firebase.storage.getUrl(value).then(url => media.src = url);

        return media;
    },
    audio: (value) => COMPONENT_SPEC.image(value, 'audio'),
    video: (value) => COMPONENT_SPEC.image(value, 'video'),
    table: (value) => {
        let { cells, header, rowcount } = value;
        let table = createElement('editable-table');
        table.rowcount = rowcount;
        table.colcount = header.length;
        table.loadData(cells);
        table.readonly = true;
        for (let index in header) {
            let input = table.headers.children[index].firstChild;
            input.value = parseFloat(header[index]);
            input.oninput();
        }
        return table;
    },
    title: (value) => document.createTextNode(value.text),
    seperator: () => document.createDocumentFragment(),
    summury: () => document.createDocumentFragment(),
    caption: (value) => {
        let frag = document.createDocumentFragment();

        return frag;
    }
}