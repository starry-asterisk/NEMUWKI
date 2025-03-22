class articleProfile extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        this.formBase = FormContent;
        let uid = params.get('uid');
        document.title = `${TEXTS.sitename} :: ${TEXTS.site_profile}`;

        this.load = async () => {
            if (!uid) {
                if (app.user === null) return move(`400?message=${encodeURI('잘못된 요청입니다.')}&url=${location.href}`, true);
                else if (app.user === false) return move(`403?message=${encodeURI('로그인하지 않은 사용자입니다. 본인 프로필로 이동을 원하시는 경우 로그인을 먼저 진행해 주세요.')}&url=${location.href}`, true);
                else uid = app.user.uid;
            }
            this.load = () => { };
            loading(0.3);

            let user_data = await firebase.auth.getUser(uid);

            let data = user_data.data();
            if (data == undefined) return move(`404?message=${encodeURI('존재하지 않는 페이지입니다.')}&url=${location.href}`, true);

            if (data.banner_url);

            params.set("uid", uid);
            move(`profile?${params.toString()}`, true, false);

            let op = params.get("operator") || "contains";
            let field = params.get("field") || "title_arr";
            let key = params.get("keyword");
            let search = key ? { [field]: { op, key } } : {};

            let permission = app.user?.uid === uid ? FINAL.PERMISSION.RW : FINAL.PERMISSION.R;

            article.append(
                this.createContent('zoom'),
                this.createContent('profile_header', undefined, {
                    uid,
                    banner_url: data.banner_url,
                    permission
                }),
                this.createContent('seperator'),
                this.createContent('textbox', undefined, { uid, permission, text: data.description || `<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${data.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>` }),
                this.createContent('seperator'),
                footer
            );

            loadBoardLists.bind(this)(data.board_setting, uid, search, permission);
            loading(1);
        };
        this.load();
    }


    createForm(type, id = randomId(), model, focusable = false, movable = false) {
        let wrap = createElement('div').attrs({ class: `flex-horizontal form ${type}`, id, tabIndex: (this.tabIndex++), 'data-type': type });

        if (focusable) wrap.addClass('focusable').onfocus = wrap.onfocusin = wrap.onclick = () => this.focusedElement = wrap;

        if (movable) {
            let form__move = createElement('div').addClass('form__move', 'flex-vertical');
            let form__move__up = createElement('button').addClass('form__move__up').props({ onclick() { wrap.prev('.focusable')?.before(wrap) } });
            let fomr__move__down = createElement('button').addClass('form__move__down').props({ onclick() { wrap.next('.focusable')?.after(wrap) } });
            let form__drag = createElement('button').addClass('form__drag');
            let form__del = createElement('button').addClass('form__del');

            form__del.onclick = () => {
                wrap.remove();
                delete this.components[id];
                delete this.data[id];
                if (this.focusedElement == wrap) this.focusedElement = null;
            };

            form__drag.ontouchstart = form__drag.onmousedown = e1 => {
                e1.preventDefault();
                wrap.addClass('dragging');
                wrap.focus();
                let rect = wrap.getBoundingClientRect();
                let last_touch, first_touch = e1.touches ? e1.touches[0] : e1;
                let placeHolder = createElement('span').addClass('form__placeholder');
                window.ontouchmove = window.onmousemove = e2 => {
                    e2.preventDefault();
                    last_touch = e2.touches ? e2.touches[0] : e2;
                    wrap.css({ transform: `translate(${parseInt(last_touch.pageX - first_touch.pageX)}px, ${parseInt(last_touch.pageY - first_touch.pageY)}px)` });

                    let now_pos, last_pos = rect.y + (rect.height * 0.5);
                    let last_el;

                    for (let el of Array.from(article.querySelectorAll('.focusable')).filter(el => el != wrap)) {
                        rect = el.getBoundingClientRect();
                        now_pos = rect.y + (rect.height * 0.5);
                        if (Math.abs(now_pos - last_touch.clientY) > Math.abs(last_pos - last_touch.clientY)) continue;
                        last_pos = now_pos;
                        last_el = el;
                    }

                    if (last_el) {
                        if (last_pos < last_touch.clientY) last_el.after(placeHolder);
                        else last_el.before(placeHolder);
                    }
                }
                window.onmouseleave = window.onmouseup = window.ontouchend = () => {
                    window.onmouseleave = window.onmouseup = window.ontouchend = window.onmousemove = window.ontouchmove = null;
                    wrap.style.removeProperty('transform');
                    wrap.removeClass('dragging');
                    if (!last_touch) return;
                    placeHolder.replaceWith(wrap);
                    wrap.focus();
                }
            }

            form__move.append(form__move__up, form__drag, fomr__move__down);
            wrap.append(form__move, form__del);
        }

        this.components[id] = { wrap };
        this.data[id] = model;
        if (this.formBase[type]) { this.formBase[type].initialize.call(this, id, wrap, model); }
        return wrap;
    }

    destroy() {
        if (this.timeout_timer) clearTimeout(this.timeout_timer);
        if (this.interval_timer) clearInterval(this.interval_timer);
    }
}