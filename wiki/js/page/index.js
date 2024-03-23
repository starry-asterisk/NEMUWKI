

function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

async function firebaseLoadCallback() {
    loading(0);
    const {createVisited, createCategories, loadNotice, createProfile, createLoginForm, createList1, createList2, buildPost} = await import(`../util-post.js?timestamp=${new Date().getTime()}`);
    let main__header__toolbox = document.querySelector('.main__header__toolbox');
    loading(0.15);
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
    loading(0.25);
    createCategories();

    createVisited();
    loading(0.45);

    if (post_id) {
        main__contents.innerHTML = '';
        let doc = await firebase.post.selectOne(post_id);
        let data = doc.data();
        loading(0.75);
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
        document.body.classList.remove('loading');
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

        buildPost({
            contents: [
                {
                    type: 'seperator',
                },
                {
                    type: 'textbox',
                    value: '<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;">환영합니다!</span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">네무위키</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 정확하지 않은 내용이 있을 수있으며</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>'
                },
                {
                    type: 'seperator',
                },
                {
                    type: 'table',
                    value: {
                        cellColors: ["",""],
                        cells: ["%{display:block;text-align:center}처음이라면\n[link:http://www.nemuwiki.com/wiki/?post=QFFrhNhkjXqDGnKXdiC8;사용_가이드]%","%{display:block;text-align:center}익숙하다면\n[link:https://www.nemuwiki.com/wiki/profile;사용자_문서]%"],
                        header: [0,0],
                        innerLineColor: 'var(--clr-primary-base)',
                        outerLineColor: 'transparent',
                        outerLineWidth: '1',
                        rowcount: 1,
                        isFullWidth: true
                    }
                },
            ]
        }, false);

        main__contents.append(createElement('div',{attrs:{class: 'content title', id: 'total', onclick: 'fold(this)'}, innerHTML: '전체 문서'}));
        main__contents.append(createElement('div',{attrs:{class: 'content title', id: 'people', onclick: 'fold(this)'}, innerHTML: '인물'}));

        document.body.classList.remove('loading');

        await createList1(keyword, field, operator);
        loading(0.6);
        await createList2(operator == 'equal'?keyword:'');

        loadNotice();
    }
    loading(1);
}