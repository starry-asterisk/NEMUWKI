
function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    location.href = `${ROOT_PATH}?keyword=${search_input.value || ''}`
}

function firebaseLoadCallback() {
    loading(0);
    firebase.auth.check(async user => {
        loading(0.3);
        const { createVisited, createCategories, createProfile, createList1, createList2 } = await import(`../util-post.js?timestamp=${new Date().getTime()}`);
        user_area.innerHTML = '';
        createProfile(user);
        document.body.classList.remove('non-auth');

        SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
        SuggestList['board2Path_1'] = board2Path(SuggestList['board'], 1);
        SuggestList['board2Path_2'] = board2Path(SuggestList['board'], 2);
        loading(0.4);

        createCategories();

        createVisited();

        /*
        main__header__timestamp.innerHTML = new Date().toLocaleString();
        setTimeout(() => {
            setInterval(() => {
                main__header__timestamp.innerHTML = new Date().toLocaleString();
            }, 1000);
        }, 1000 - new Date().getMilliseconds());
        */
        let uid = params.get('uid') || user.uid;
        firebase.auth.getUser(uid).then(user_data => {
            history.pushState({}, null, `${location.origin}/wiki/profile${SUFFIX}?uid=${uid}`);
            let data = user_data.data();
            if (data.banner_url) document.querySelector('.main__profile').setStyles({'background-image':`url(${data.banner_url})`});
            self_description.innerHTML = `<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${data.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>`;
        });

        document.body.classList.remove('loading');

        await createList1(uid, 'author', 'equal');
        loading(0.7);
        await createList2(uid);

        loading(1);
    }, () => {
        alert('로그인 상태가 아니면 이용하실 수 없는 페이지입니다.');
        location.href = ROOT_PATH;
    });
}