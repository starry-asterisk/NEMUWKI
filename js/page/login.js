class asideIndex extends asideBase {
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
                li.append(createElement('a').attrs({ href: `./index?${params.toString()}`, class: 'tag' }).props({ innerHTML: data.path }));
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
                    createElement('a').attrs({ href: `./index?${params.toString()}`, class: 'tag', 'data-board': board_name }).props({ innerHTML: board_name }),
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
            this.createBlock('btn_upload', `<button class="s_button" onclick=" move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`)
        );

        this.components.Board.ul.addClass('type2');
    }

    createSearch(id, param) {
        let wrap = createElement('div').addClass('f_block').css({marginBottom: 'var(--spacing-large)'});
        let fold_btn = createElement('button').attrs({ class: 'menu_fold icon' }).props({ onclick(){ aside.toggleClass('fold') } });
        let input = this.createInput(id).addClass('icon');
        let input_run = createElement('button').attrs({ class: 'input_run icon' }).props({ onclick(){search();} });
        input.firstChild.attrs({ placeHolder: TEXTS.search_i }).props({ onkeydown(e){e.keyCode == 13 && search(e);}, value: (param.get('keyword')) });

        function search(e){
            if(e) e.preventDefault();
            move(`./?keyword=${input.firstChild.value}`);
        }
        
        wrap.append(fold_btn, input);
        input.append(input_run);

        return wrap;
    }
}
class articleIndex extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        document.title = `${TEXTS.sitename} :: ${TEXTS.form.login}`;
        let callbackUrl = params.get('callbackUrl');
        if (app.user) {
            Notify.alert(TEXTS.warn.login_already);
            move('./');
        } else {
            article.append(
                this.createContent('notice'),
                this.createContent('login', undefined, { callbackUrl }),
                footer
            );
        }
    }

    destroy() { }
}

function loginCallback() {
    if (app && app.state) return app.state = null;
    Notify.alert(TEXTS.warn.login_already);
    move('./');
}

const IndexContent = {
    ...ContentBase,
    notice: {
        async initialize(id, wrap) {
            let snaps = await firebase.notice.getNewest();
            let doc = snaps.docs[0];

            if (!doc) return;

            let data = doc.data();

            let n_title = this.components[id].title = createElement('span').attrs({ class: "notice__title icon icon-bullhorn-variant" }).props({ innerHTML: data.title, onclick() { wrap.toggleClass('open'); } });
            let n_timestamp = this.components[id].timestamp = createElement('span').attrs({ class: "notice__timestamp" }).props({ innerHTML: new Date(data.timestamp.seconds * 1000).toLocaleDateString() });
            let n_content = this.components[id].content = createElement('span').attrs({ class: "notice__content" }).props({ innerHTML: markdown(data.content) });

            wrap.append(n_title, n_timestamp, n_content);
        }
    },
    login: {
        async initialize(id, wrap, model) {
            let wrap_i_id = createElement('div').addClass('b_input').attrs({ placeholder: TEXTS.form.id });
            let wrap_i_password = createElement('div').addClass('b_input').attrs({ placeholder: TEXTS.form.pw });
            let wrap_i_password_re = createElement('div').addClass('b_input').attrs({ placeholder: TEXTS.form.re });

            wrap_i_id.append(createElement('input').props({ id: 'input_id' }).attrs({ placeholder: TEXTS.empty }));
            wrap_i_password.append(createElement('input').props({ id: 'input_pw', type: 'password' }).attrs({ placeholder: TEXTS.empty }));
            wrap_i_password_re.append(createElement('input').props({ id: 'input_pw_re', type: 'password' }).attrs({ placeholder: TEXTS.empty }));

            if (app.now == '/login') {
                wrap.append(
                    createElement('h1').props({ innerHTML: TEXTS.form.login }),
                    wrap_i_id,
                    wrap_i_password,
                    createElement('button').addClass('f_button').props({
                        innerHTML: TEXTS.form.login, onclick() {
                            if (!validate(input_id, undefined, 'email')) return Notify.alert(TEXTS.warn.email_pattern);
                            if (!validate(input_pw, undefined, 'password')) return Notify.alert(TEXTS.warn.password_short);
                            this.disabled = true;
                            app.state = 1;
                            firebase.auth.login(input_id.value, input_pw.value)
                                .then(() => {
                                    Notify.alert(TEXTS.alert.login);
                                    if (model.callbackUrl) move(model.callbackUrl);
                                    else move('./');
                                })
                                .catch(firebaseErrorHandler)
                                .finally(()=>{this.disabled = false;});
                        }
                    }),
                    createElement('a').attrs({ href: 'signup' }).props({ innerHTML: TEXTS.form.signup }),
                    createElement('a').attrs({ href: 'javascript:modal("emailPrompt")' }).props({ innerHTML: TEXTS.form.find }),
                );
            } else {
                wrap.append(
                    createElement('h1').props({ innerHTML: TEXTS.form.signup }),
                    wrap_i_id,
                    wrap_i_password,
                    wrap_i_password_re,
                    createElement('button').addClass('f_button').props({
                        innerHTML: TEXTS.form.signup, onclick() {
                            if (!validate(input_id, undefined, 'email')) return Notify.alert(TEXTS.warn.email_pattern);
                            if (!validate(input_pw, undefined, 'password')) return Notify.alert(TEXTS.warn.password_short);
                            if (!validate(input_pw, input_pw_re, 'password')) return Notify.alert(TEXTS.warn.password_mismatch);
                            this.disabled = true;
                            app.state = 1;
                            firebase.auth.signup(input_id.value, input_pw.value)
                                .then(creditional => {
                                    creditional && Notify.alert(TEXTS.alert.signup);
                                    if (model.callbackUrl) move(model.callbackUrl);
                                    else move('./');
                                })
                                .catch(firebaseErrorHandler)
                                .finally(()=>{this.disabled = false;});

                        }
                    }),
                    createElement('a').attrs({ href: 'login' }).props({ innerHTML: TEXTS.form.login }),
                );
            }
        }
    },
}

export { asideIndex as aside, articleIndex as article, loginCallback };