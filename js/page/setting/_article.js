class articleSetting extends articleBase {
    constructor(params) {
        super();
        document.title = `${TEXTS.sitename} :: 설정`;
        loadStyle('setting');

        if (app.user === false) {
            Notify.alert(TEXTS.warn.login_neccesary);
            move('login', true);
            return;
        } else if (app.user) {
            this.showTab(params.get('menu') || 'default');
        }
    }

    destroy() { }

    showTab(type) {
        let tabBase = SettingTabs[type] || {};
        emptyNode(article);
        article.append(
            createElement('div').addClass('setting__title').props({ innerHTML: tabBase.title }),
            createElement('hr').css({ width: 'auto', height: '1px', background: 'var(--blue-gray-100)' })
        );
        (typeof tabBase.init == 'function') && article.append(tabBase.init(createElement('div').addClass('setting__wrap'), app.user));
    }
}