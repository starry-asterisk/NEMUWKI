
function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

function firebaseLoadCallback() {
    document.body.classList.add('loading');

    firebase.auth.check(async user => {
        user_area.innerHTML = '';
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
        else profile__email.append(createElement('span', { innerHTML: '인증하기', styles: { 'font-size': '1.5rem', opacity: 0.8, 'padding-left': '1rem', color: 'var(--accent)', 'white-space': 'nowrap' }, on: { click: () => modal('confirm') } }));

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

        profile__photo__input.onchange = async () => {
            if (profile__photo__input.files.length < 1) return 0;
            let file = profile__photo__input.files[0];
            let result = await uploadByImgur(file);
            if (result.status == 200) {
                let photo_url = result.data.link;
                profile__photo__img.src = photo_url;
                firebase.auth.updateUser(user.uid, { photo_url });
            } else {
                alert('프로필 이미지 업로드에 실패했습니다.');
            }
        }

        profile__input.onchange = async () => {
            if (profile__input.files.length < 1) return 0;
            let file = profile__input.files[0];
            let result = await uploadByImgur(file);
            if (result.status == 200) {
                let banner_url = result.data.link;
                profile.setStyles({ '--background-url': `url("${banner_url}")` });
                firebase.auth.updateUser(user.uid, { banner_url });
            } else {
                alert('프로필 이미지 업로드에 실패했습니다.');
            }
        }

        upload.onclick = () => location.href = `${ROOT_PATH}form${SUFFIX}`;
        logout.onclick = () => {
            firebase.auth.logout()
                .catch(errorHandler);
        }

        // 게시물 로딩

        SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
        let pathFromBoard = board2Path(SuggestList['board'], 2);

        for (let pathname in pathFromBoard) {
            let li = createElement('li');
            li.append(createElement('a', { innerHTML: pathFromBoard[pathname], attrs: { href: `${ROOT_PATH}?keyword=${pathname}&field=board_name_arr&operator=array-contains` } }));
            category_list.append(li);
        }

        main__header__timestamp.innerHTML = new Date().toLocaleString();
        setTimeout(() => {
            setInterval(() => {
                main__header__timestamp.innerHTML = new Date().toLocaleString();
            }, 1000);
        }, 1000 - new Date().getMilliseconds());

        let load_more = createElement('button', { innerHTML: 'load more', attrs: { class: 'normal' }, styles: { margin: 'auto' } });
        let board_list = createElement('div', { attrs: { class: 'board_list_1' } });

        let docs, { next } = await firebase.post.list({ author: user.uid }, false, 'equal');

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

        let docs2, next2 = firebase.post.list({ category: '인물',author: user.uid }, false, 'equal').next;

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

        try {
            for (let str of visited) {
                let [visited_id, title, board_name] = str.split(':');
                let li = createElement('li');
                let li_a = createElement('a', { innerHTML: `${pathFromBoard[board_name] || board_name} : ${title}`, attrs: { href: `${ROOT_PATH}?post=${visited_id}` } });
                li.append(li_a);
                recent_post.append(li);
            }
        } catch (e) {
            errorHandler(e);
        }

        document.body.classList.remove('loading');
    }, () => {
        alert('로그인 상태가 아니면 이용하실 수 없는 페이지입니다.');
        location.href = ROOT_PATH;
    });
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