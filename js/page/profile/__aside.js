class asideProfile extends asideBase {
    constructor(param) {
        super();
        aside.addClass('fold');

        let params = new URLSearchParams();
        params.set('field', 'board_name_arr');
        params.set('operator', 'array-contains');

        let BoardModel = new Model(
            Options.get('board'),
            function (data) {
                let li = createElement('li');
                params.set('keyword', data.value);
                li.append(createElement('a').attrs({ href: `./profile?${params.toString()}`, class: 'tag' }).props({ innerHTML: data.path }));
                this.ul.append(li);
            },
            function () { emptyNode(this.ul) }
        );

        let VisitedModel = new Model(
            app.getVisited(),
            function ({ visited_id, title, board_name }) {
                let li = createElement('li');
                params.set('keyword', board_name);
                li.append(
                    createElement('a').attrs({ href: `./profile?${params.toString()}`, class: 'tag', 'data-board': board_name }).props({ innerHTML: board_name }),
                    createElement('a').attrs({ href: `./index?post=${visited_id}` }).props({ innerHTML: title })
                );
                this.ul.append(li);
            }
        )

        aside.append(
            this.createBlock('B000', `<h1><a class="logo s_button" href="./">${TEXTS.sitename}</a></h1>`),
            this.createSearch('search', param),
            this.createBlockList('Visited', TEXTS.recent_document, VisitedModel),
            this.createBlockList('Board', TEXTS.document_cate, BoardModel),
            this.createBlock('btn_upload', `<button class="s_button" onclick=" move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`),
            this.createBlock('btn_login', `<button class="s_button" onclick=" move('login')">${TEXTS.form.login}</button>`)
        );

        this.components.Board.ul.addClass('type2');
    }

    createSearch(id, param) {
        let wrap = createElement('div').addClass('f_block', 'flex-horizontal').css({ marginBottom: 'var(--spacing-large)' }).props({ id: `${id}_wrap` });
        let fold_btn = createElement('button').attrs({ class: 'menu_fold icon' }).props({ onclick() { aside.toggleClass('fold') } });
        let input = this.createInput(id).addClass('icon');
        let input_run = createElement('button').attrs({ class: 'input_run icon' }).props({ onclick() { search(); } });
        input.firstChild.attrs({ placeHolder: TEXTS.search_i }).props({ onkeydown(e) { e.keyCode == 13 && search(e); }, value: (param.get('keyword')) });

        function search(e) {
            if (e) e.preventDefault();
            let params = new URLSearchParams(location.search);
            move(`./profile?keyword=${input.firstChild.value}&uid=${params.get('uid')}`);
        }

        wrap.append(fold_btn, input);
        input.append(input_run);

        return wrap;
    }
}