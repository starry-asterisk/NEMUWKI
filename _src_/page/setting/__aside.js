class asideSetting extends asideBase {
    constructor(params) {
        super();

        let tabs = {};
        let svg = createElement('svg').attrs({ xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" });
        svg.css({ width: "2rem", border: '1px solid var(--blue-gray-400)', fill: "var(--color-bg-light)", background: "var(--blue-gray-800)", padding: "0.2rem", "border-radius": "var(--border-radius-small)", "vertical-align": "middle", "margin-right": "var(--spacing-small)" })
        let path = createElement('path').attrs({ d: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" })
        svg.append(path);
        aside.append(
            createElement('div').props({ innerHTML: `${svg.outerHTML} 설정` }).css({ "text-align": "left", padding: "var(--spacing-medium)" }),
            this.createTab('default', '일반', tabs),
            this.createTab('template', '템플릿', tabs),
            // this.createTab('categories', '카테고리', tabs),
            // this.createTab('board', '문서 분류', tabs),
            this.createTab('resource', '이미지 관리', tabs),
            this.createTab('deleted', '삭제 문서 복구', tabs),
            // this.createTab('delete_user', '회원 탈퇴', tabs).css({color: 'var(--color-invalid)'}),
        )

        this.activate = (id = Object.keys(tabs)[0], isInit) => {
            for (let btn_in in tabs) tabs[btn_in].disabled = false;
            tabs[id]?.onclick(isInit);
        }

        if (app.user) {
            this.activate(params.get('menu') || undefined, true);
        }
    }

    createTab(id = randomId(), name = '', tabs) {
        let wrap = createElement('div').css({ 'text-align': 'left' });
        let button = createElement('button').addClass('s_button').props({
            innerHTML: (name || id), disabled: true, onclick(isInit) {
                for (let btn_in in tabs) tabs[btn_in].removeClass('on');
                this.toggleClass('on');
                history.replaceState('', {}, `?menu=${id}`);
                (isInit !== true) && app_article.showTab(id);
            }
        });
        wrap.append(button);
        tabs[id] = button;
        return wrap;
    }
}