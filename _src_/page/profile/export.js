function loginCallback() {
    app_article.load();
}

function logoutCallback() {
    app_article.load();
}

function parseBoardSetting(str = '0;1;전체 문서;;,1;2;인물;인물;') {
    return str.split(',').map(boardInfo => {
        const [
            order_str, type, title, category, board
        ] = boardInfo.split(';');
        return { order: parseInt(order_str), style: type == '1' ? 'table' : 'galery', type, title, category, board };
    }).sort((a, b) => a.order - b.order);
}

function loadBoardLists(str, uid, search, permission) {
    let appendList = [];
    let editList = []

    this.data.Board = new Model(
        Options.get('board'),
        null,
        function (datas) {
            for (let a of article.querySelectorAll('[data-board]')) {
                let board = datas.find(data => data.value == a.getAttribute('data-board'));
                if (board) a.innerHTML = board.path;
            }
        }
    );

    for (let info of parseBoardSetting(str)) {
        let id = randomId();

        let searchData = { ...search };
        if (info.category) searchData.category = { key: info.category, op: 'equal' };
        if (info.board) searchData.board_name_arr = { key: info.board, op: 'contains' };
        appendList.push(
            this.createContent('title', `title_${id}`, { text: info.title }),
            this.createContent('list', `list_${id}`, { style: info.style, keyword: uid, field: "author", operator: "equal", searchData })
        );
        this.data.Board.bind(this.components[`list_${id}`]);

        if (permission >= FINAL.PERMISSION.RW) {
            listenCategories();
            editList.push(this.createForm('board_setting', `setting_${id}`, info, true, true));
        }
    }

    if (permission >= FINAL.PERMISSION.RW && appendList.length > 0) {
        let buttons = createElement('div').addClass('profile_header__buttons', 'flex-horizontal');
        let button = createElement('button').props({ innerHTML: '목록 수정' }).css({ flex: 1 });
        let button2 = createElement('button').props({ innerHTML: TEXTS.form.cancel });

        button2.onclick = function () {
            if (Notify.confirm('목록 설정을 취소하시겠습니까?')) location.reload();
        }

        let buttons2 = createElement('div').addClass('profile_header__buttons', 'flex-horizontal');
        let button3 = createElement('button').props({ innerHTML: '+ 메뉴 추가' });

        button3.onclick = function () {
            if (document.querySelectorAll('.form.board_setting').length > 4) return Notify.alert('문서 목록은 5개 까지 생성 가능합니다!');
            buttons2.before(app_article.createForm('board_setting', undefined, { type: 1, title: '', category: '', board: '' }, true, true))
        }

        button.onmousedown = e => e.stopPropagation();
        button.onclick = function (e) {
            e => e.stopPropagation();
            button.onclick = save;
            this.innerHTML = TEXTS.form.apply;
            button2.css({ flex: 1 });
            button3.css({ flex: 1 });
            for (let el of appendList) el.remove();
            buttons2.append(button3);
            buttons.append(button2);
            article.append(buttons);
            for (let el of editList) article.append(el);
            article.append(buttons2, footer);
            appendList = [];
        }

        buttons.append(button);
        appendList.unshift(buttons);

        async function save() {
            if (!Notify.confirm('변경사항을 저장 할까요?')) return;
            let settings = document.querySelectorAll('.form.board_setting');
            if (settings.length > 5) return Notify.alert('목록은 5개 까지 생성 가능합니다.');
            await firebase.auth.updateUser(uid, {
                board_setting: Array.from(settings).map((wrap, index) => {
                    let { type, title, category, board } = wrap.getData();
                    return `${index};${type};${title};${category};${board}`;
                }).join(',')
            });
            location.reload();
        }
    }

    appendList.push(footer);

    article.append.apply(article, appendList);

    this.data.Board.proceed();
}


function execBuildVal(command, val) {
    return function () {
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, val || "");
    };
}

function execBuildPrompt(command, prompt_text, conv_fn = v => v) {
    return function () {
        var val = Notify.prompt(prompt_text) || "";
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, conv_fn(val));
    };
}

function execModal(command, modal_type, conv_fn = v => v, option) {
    return modal(modal_type, v => {
        if ('anchorNode' in lastSelection) {
            let selection = window.getSelection();
            let { anchorNode, anchorOffset, focusNode, focusOffset } = lastSelection;
            let range = document.createRange();
            range.setStart(anchorNode, anchorOffset);
            range.setEnd(focusNode, focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        document.execCommand("styleWithCSS", 0, true);
        document.execCommand(command, false, conv_fn(v));
    }, option);
}

export { asideProfile as aside, articleProfile as article, loginCallback, logoutCallback };