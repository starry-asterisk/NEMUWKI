
function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

function firebaseLoadCallback() {
    firebase.auth.check(async user => {
        const { createVisited, createCategories, createProfile, createList1, createList2 } = await import('../util-post.js');
        user_area.innerHTML = '';
        createProfile(user);
        document.body.classList.remove('non-auth');

        SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
        SuggestList['board2Path_1'] = board2Path(SuggestList['board'], 1);
        SuggestList['board2Path_2'] = board2Path(SuggestList['board'], 2);

        createCategories();

        createVisited();

        main__header__timestamp.innerHTML = new Date().toLocaleString();
        setTimeout(() => {
            setInterval(() => {
                main__header__timestamp.innerHTML = new Date().toLocaleString();
            }, 1000);
        }, 1000 - new Date().getMilliseconds());

        createList1(user.uid, 'author', 'equal');

        createList2(user.uid);

        document.body.classList.remove('loading');
    }, () => {
        alert('로그인 상태가 아니면 이용하실 수 없는 페이지입니다.');
        location.href = ROOT_PATH;
    });
}