class asideForm extends asideBase {
    constructor() {
        super();
        let tabs = [];
        aside.append(
            this.createTab(undefined, undefined, tabs),
            this.createTab(undefined, undefined, tabs),
            this.createTab(undefined, undefined, tabs),
            this.createTab(undefined, undefined, tabs),
            this.createTab(undefined, undefined, tabs),
        )
    }

    createTab(id = randomId(), name = '', tabs){
        var wrap = createElement('div').addClass('block').css({'text-align':'left'});
        var button = createElement('button').addClass('s_button').props({innerHTML: (name || id), onclick(){
            tabs.forEach(button=>button.removeClass('on'))
            this.toggleClass('on')
        }});
        wrap.append(button);
        tabs.push(button);
        return wrap;
    }
}
class articleForm extends articleBase {
    constructor() {
        super();
        this.contentBase = FormContent;
        document.title = `${TEXTS.sitename} :: 설정`;

        if (app.user === false) {
            Notify.alert(TEXTS.warn.login_neccesary);
            move('login', true);
            return;
        } else if(app.user) {
            this.init();
        }
    }

    destroy() {}

    init() {
        console.log(app.user);
        alert('초기화!');
    }
}

function logoutCallback() {
    Notify.alert(TEXTS.warn.login_neccesary);
    history.back();
}

function loginCallback() {
    app_article.init();
}

const FormContent = {
    ...ContentBase
}

export { asideForm as aside, articleForm as article, logoutCallback, loginCallback };