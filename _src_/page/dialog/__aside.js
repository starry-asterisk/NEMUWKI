class asideIndex extends asideBase {
    constructor(param) {
        super();
        aside.addClass('fold');

        let params = new URLSearchParams();
        params.set('field', 'board_name_arr');
        params.set('operator', 'array-contains');


        aside.append(
            this.createBlock('B000', `<h1><a class="logo s_button" href="./">${DIALOG_TEXTS.title}</a></h1>`),
            // this.createSearch('search', param),
            this.createBlock('btn_upload', `${(app.user && ['assume.nameless@gmail.com','6507055@gmail.com'].indexOf(app.user.email))?'':('<button class="s_button" onclick="move(\'write\')">'+TEXTS.upload+'</button>')}<button class="s_button" onclick=" move('/profile')">${TEXTS.mypage}</button>`),
            this.createBlock('btn_login', `<button class="s_button" onclick="move('/login')">${TEXTS.form.login}</button>`)
        );
    }

    createSearch(id, param) {
        let wrap = createElement('div').addClass('f_block', 'flex-horizontal').css({ marginBottom: 'var(--spacing-large)' }).props({ id: `${id}_wrap` });
        let fold_btn = createElement('button').attrs({ class: 'menu_fold icon' }).props({ onclick() { aside.toggleClass('fold') } });
        let input = this.createInput(id).addClass('icon');
        let input_run = createElement('button').attrs({ class: 'input_run icon' }).props({ onclick() { search(); } });
        input.firstChild.attrs({ placeHolder: TEXTS.search_i }).props({ onkeydown(e) { e.keyCode == 13 && search(e); }, value: (param.get('keyword')) });

        function search(e) {
            if (e) e.preventDefault();
            move(`./?keyword=${input.firstChild.value}`);
        }

        wrap.append(fold_btn, input);
        input.append(input_run);

        return wrap;
    }
}