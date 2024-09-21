class articleForm extends articleBase {
    constructor(params) {
        super();
        this.contentBase = ContentBase;
        this.formBase = FormContent;
        let _this = this;

        if (app.user === false) {
            app.blockMode = false;
            move(`401?message=${encodeURI(TEXTS.warn.login_neccesary)}&url=${location.href}`, true);
            return;
        }

        let ToolBarModel = new Model(
            [],
            function (namespace) {
                this.wrap.append(ToolBase[namespace](createElement('span').addClass(namespace, 'flex-horizontal'), _this._focusedElement));
            },
            function () { emptyNode(this.wrap) }
        );

        let appendList = [
            this.createForm('toolbar', 'toolbar', ToolBarModel),
            this.createForm('bottomtoolbar'),
            this.createForm('main_header', 'main_header')
        ];

        ToolBarModel.bind(this.components['toolbar']);
        ToolBarModel.proceed();

        let post_id = params.get('post');
        if (post_id) {
            document.title = `${TEXTS.sitename} :: 문서 편집 - 로딩중`;
            (async () => {
                if (post_id == 'random') post_id = await firebase.search.random();

                let doc = await firebase.post.selectOne(post_id);
                let data = doc.data();

                this.BeforeData = { id: doc.id, ...data };

                if (!data) return app.blockMode = false, move(`404?message=${encodeURI('존재하지 않는 문서입니다.')}&url=${location.href}`, true);;
                if (data.deleted) return app.blockMode = false, move(`404?message=${encodeURI('삭제된 문서입니다.')}&url=${location.href}`, true);
                if (data.hidden && data.author != app.user?.uid) return app.blockMode = false, move(`403?message=${encodeURI('타인의 숨긴 문서는 수정이 불가합니다.')}&url=${location.href}`, true);

                if(hidden_chk) hidden_chk.checked = data.hidden;
                if(data.board_name == 'template') template_chk.checked = true;

                document.title = `${TEXTS.sitename} :: 문서 편집 - ${data.title}`;

                if (app_aside) {
                    app_aside.components.board.set(data.board_name);
                    app_aside.components.cate.set(data.category);
                }

                this.components.main_header.wrap.setData(data.title);

                for (let content of data.contents) {
                    let data = content.value;
                    let content_wrap = this.createForm(content.type, undefined, data, true);
                    switch (content.type) {
                        case 'textbox':
                            for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
                    }
                    appendList.push(content_wrap);
                }

                article.append.apply(article, appendList);
            })();
        } else {
            document.title = `${TEXTS.sitename} :: 새로운 문서`;
            article.append.apply(article, appendList);
        }
    }

    createForm(type, id = randomId(), model, focusable = false) {
        let wrap = createElement('div').attrs({ class: `flex-horizontal form ${type}`, id, tabIndex: (this.tabIndex++), 'data-type': type });

        if (focusable) {
            let form__move = createElement('div').addClass('form__move', 'flex-vertical');
            let form__move__up = createElement('button').addClass('form__move__up').props({ onclick() { wrap.prev('.focusable')?.before(wrap) } });
            let fomr__move__down = createElement('button').addClass('form__move__down').props({ onclick() { wrap.next('.focusable')?.after(wrap) } });
            let form__drag = createElement('button').addClass('form__drag');
            let form__del = createElement('button').addClass('form__del');

            wrap.addClass('focusable').onfocus = wrap.onfocusin = wrap.onclick = () => this.focusedElement = wrap;

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

    destroy() { }
}