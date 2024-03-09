

function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

async function firebaseLoadCallback() {
    const {createVisited, createCategories, loadNotice, createProfile, createLoginForm, createList1, createList2, buildPost} = await import('../util-post.js');
    let main__header__toolbox = document.querySelector('.main__header__toolbox');

    firebase.auth.check(user => {
        user_area.innerHTML = '';
        createProfile(user);
        document.body.classList.remove('non-auth');
    }, () => {
        user_area.innerHTML = '';
        createLoginForm();
        document.body.classList.add('non-auth');
    });

    SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
    SuggestList['board2Path_1'] = board2Path(SuggestList['board'], 1);
    SuggestList['board2Path_2'] = board2Path(SuggestList['board'], 2);

    createCategories();

    createVisited();

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
        main__header__toolbox.append(createElement('button', {
            attrs: {
                class: 'edit'
            },
            innerHTML: '수정', on: {
                click: () => {
                    location.href = `${ROOT_PATH}form${SUFFIX}?post=${post_id}`;
                }
            }
        }));
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

        search_input.value = keyword;

        createList1(keyword, field, operator);

        createList2();

        loadNotice();
    }

    document.body.classList.remove('loading');
}