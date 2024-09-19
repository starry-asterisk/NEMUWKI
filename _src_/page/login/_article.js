class articleLogin extends articleBase {
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