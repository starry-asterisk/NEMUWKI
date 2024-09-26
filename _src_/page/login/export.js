function loginCallback() {
    if (app && app.state) return app.state = null;
    Notify.alert(TEXTS.warn.login_already);
    move('./');
}

const IndexContent = {
    ...ContentBase,
    notice: {
        async initialize(id, wrap) {
            wrap.style.display = 'none';
            let snaps = await firebase.notice.getNewest();
            let doc = snaps.docs[0];

            if (!doc) return;

            let data = doc.data();

            let n_title = this.components[id].title = createElement('span').attrs({ class: "notice__title icon icon-bullhorn-variant" }).props({ innerHTML: data.title, onclick() { wrap.toggleClass('open'); } });
            let n_timestamp = this.components[id].timestamp = createElement('span').attrs({ class: "notice__timestamp" }).props({ innerHTML: new Date(data.timestamp.seconds * 1000).toLocaleDateString() });
            let n_content = this.components[id].content = createElement('span').attrs({ class: "notice__content" }).props({ innerHTML: markdown(data.content) });

            wrap.addClass('flex-vertical').append(n_title, n_timestamp, n_content);
            wrap.style.removeProperty('display');
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

            wrap.addClass('flex-vertical');

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
                                    Notify.toast(TEXTS.alert.login);
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

export { asideLogin as aside, articleLogin as article, loginCallback };