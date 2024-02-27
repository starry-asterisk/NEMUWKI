

async function firebaseLoadCallback() {
    document.body.classList.add('loading');

    main__contents = document.querySelector('.main__contents');
    let params = new URLSearchParams(document.location.search);

    search.onkeydown = ({ key }) => {
        if (key.toLowerCase() != 'enter') return;
        location.href = `${ROOT_PATH}?keyword=${search.value || ''}`
    }

    firebase.auth.check(user => {
        let upload = createElement('button', { innerHTML: '글쓰기', attrs: { class: 'normal' } });
        let logout = createElement('button', { innerHTML: '로그아웃', attrs: { class: 'normal' }, styles: { 'margin-top': '1rem' } });
        let button_container = createElement('div');
        button_container.append(upload);
        button_container.append(logout);
        user_area.append(button_container);
        upload.onclick = () => location.href = './form.html';
        logout.onclick = () => {
            firebase.auth.logout()
                .then(e => location.reload())
                .catch(errorHandler);
        }
    }, () => {
        let loginMode = true;
        let email = createElement('input', { attrs: { type: 'text', name: 'email', placeholder: '이메일' } });
        let password = createElement('input', { attrs: { type: 'password', name: 'password', placeholder: '비밀번호' } });
        let password_re = createElement('input', { attrs: { type: 'password', name: 'password_re', placeholder: '비밀번호 재입력' } });

        let email_container = createElement('div', { attrs: { class: 'input_container' } });
        let password_container = email_container.cloneNode();
        let password_container_re = email_container.cloneNode();

        let button_container = createElement('div');

        let submit_login = createElement('button', { innerHTML: '로그인', attrs: { class: 'normal' } });
        let submit_signup = createElement('button', { innerHTML: '가입하기', styles: { display: 'none' }, attrs: { class: 'normal' } });
        let a_signup = createElement('a', {
            innerHTML: '가입하기',
            attrs: { href: '#' },
            styles: { display: 'block', 'text-align': 'center' },
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

        submit_login.onclick = () => {
            if (!validate(email, undefined, 'email')) return;
            if (!validate(password, undefined, 'password')) return;
            firebase.auth.login(email.value, password.value)
                .then(e => location.reload())
                .catch(errorHandler);
        }
        submit_signup.onclick = () => {
            if (!validate(email, undefined, 'email')) return;
            if (!validate(password, undefined, 'password')) return;
            if (!validate(password, password_re, 'password')) return;
            firebase.auth.signup(email.value, password.value)
                .then(e => {
                    alert('회원 가입완료 되었습니다. 로그인 해주세요.');
                    location.reload();
                })
                .catch(errorHandler);

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

        password_container_re.setStyles({ display: 'none' });

        password_re.oninput = () => validate(password_re, password, 'password');

        document.body.classList.add('non-auth');
    });

    let tree = getTreeFromBoardList((await firebase.board.list()).docs.map(doc => doc.data()));
    let pathFromBoard = [];

    for (let child of tree || []) stripe(child);

    function stripe(data, prefix = []) {
        prefix.push(data.name);
        pathFromBoard[data.name] =  prefix.join(' > ');
        for (let child of data.child || []) stripe(child, prefix.slice());
    }

    if (params.get("post")) {
        main__contents.innerHTML = '';
        let doc = await firebase.post.selectOne(params.get("post"));
        let data = doc.data();

        let old_visited_index = visited.indexOf(`${post_id}:${data.title}:${data.board_name}`);
        if (old_visited_index > -1) visited.splice(old_visited_index, 1);
        visited.unshift(`${post_id}:${data.title}:${data.board_name}`);
        visited.splice(VISITED_MAX);
        localStorage.setItem('visited', visited);

        buildPost(data);
        document.querySelector('.main__header__toolbox')
            .setStyles({ display: 'flex' })
            .append(createElement('button', {
                innerHTML: '수정', on: {
                    click: () => {
                        location.href = `${ROOT_PATH}form.html?post=${params.get("post")}`;
                    }
                }
            }))
    } else {
        main__header__timestamp.innerHTML = new Date().toLocaleString();
        setTimeout(() => {
            setInterval(() => {
                main__header__timestamp.innerHTML = new Date().toLocaleString();
            }, 1000);
        }, 1000 - new Date().getMilliseconds());

        let keyword = params.get('keyword') || '';
        let load_more = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
        let board_list = createElement('div', { attrs: { class: 'board_list_1' } });

        let { docs, getNext } = await firebase.post.list(keyword);

        search.value = keyword;

        load_more.onclick = async () => {
            docs = await getNext(docs);
            load();
        }

        total.after(board_list);
        board_list.after(load_more);

        load();

        function load() {
            for (let doc of docs) {
                let data = doc.data();
                data.board_name = pathFromBoard[data.board_name];
                board_list.append(addPost(data, doc.id));
            }
            if (docs.length < 25) load_more.setStyles({ display: 'none' });
        }

        let load_more2 = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
        let board_list_2 = createElement('div', { attrs: { class: 'board_list_2' } });

        let people_ = await firebase.post.list('인물', 'category');

        search.value = keyword;

        load_more2.onclick = async () => {
            people.docs = await people_.getNext(people_.docs);
            people_();
        }

        people.after(board_list_2);
        board_list_2.after(load_more2);

        load2();

        function load2() {
            for (let doc of people_.docs) {
                let data = doc.data();
                board_list_2.append(addPost2(data, doc.id));
            }
            if (people_.docs.length < 25) load_more2.setStyles({ display: 'none' });
        }
    }


    for (let str of visited) {
        let [visited_id, title, board_name] = str.split(':');
        let li = createElement('li');
        let li_a = createElement('a', { innerHTML: `${pathFromBoard[board_name]} : ${title}`, attrs: { href: `${ROOT_PATH}?post=${visited_id}` } });
        li.append(li_a);
        recent_post.append(li);
    }

    document.body.classList.remove('loading');
}

function validate(input, input_2, type = 'text') {
    input.setCustomValidity('not valid');
    if (input.value != undefined && input.value != '') {
        if (input_2 == undefined || input.value == input_2.value) {
            switch (type) {
                case 'email':
                    if (/^\S+@\S+$/.test(input.value)) input.setCustomValidity('');
                    break;
                case 'password':
                    if (input.value.length > 7) input.setCustomValidity('');
                    break;
                default:
                    input.setCustomValidity('');
                    break;
            }
        }
    }
    return input.checkValidity();
}

function addPost(data, id) {
    let item = createElement('div', { attrs: { board_name: data.board_name, title: data.title } });
    item.onclick = () => {
        location.href = `${ROOT_PATH}?post=${id}`;
    }
    return item;
}
function addPost2(data, id) {
    let item = createElement('div', { innerHTML: `${data.board_name}<br>${data.title}` });
    let img = createElement('img');

    item.prepend(img);

    let urlObj = data.contents.find(content => content.type == 'image');
    if (urlObj) firebase.storage.getUrl(urlObj.value).then(url => img.src = url);
    else img.src = '[ no image ]';

    item.onclick = () => {
        location.href = `${ROOT_PATH}?post=${id}`;
    }
    return item;
}

function buildPost(data) {
    let {
        title,
        board_name,
        category,
        timestamp,
        contents
    } = data;

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
        summury.setAttribute('id', 'summary');
        let title_list = component_list['title'];
        let title_datas = contents.filter(content => content.type == 'title');
        let depth = 1;
        let depth_info = [];
        let prefix_arr = [];
        let sub_index = 1;
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

        firebase.storage.getUrl(value).then(url => media.src = url);

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

function goRandom() {
    firebase.post.random().then(id => location.href = `${ROOT_PATH}?post=${id}`);
}