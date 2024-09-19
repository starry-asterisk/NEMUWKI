class asideForm extends asideBase {
    constructor() {
        super();
        app.blockMode = true;
        this.data.Board = new Model(
            Options.get('board'),
            function (data) { this.ul.append(createOption({ ...data, value: data.value, text: data.path, is_owner: data.owner == app.user?.uid }, this)) },
            function () { for (let option of Array.from(this.ul.children)) if (option.tagName == 'N-OPTION') option.remove(); }
        );
        this.data.Categories = new Model(
            Options.get('categories'),
            function (data) { this.ul.append(createOption(data, this)) },
            function () { for (let option of Array.from(this.ul.children)) if (option.tagName == 'N-OPTION') option.remove(); }
        );
        let boardSelect = this.components.board = createSelect([], 0, true, '문서 분류').addClass('input', 'flex-horizontal');
        let cateSelect = this.components.cate = createSelect([], 0, true, '카테고리').addClass('input', 'flex-horizontal');
        let templateSelect = this.components.template = createSelect([], 0, true, '템플릿').addClass('input', 'flex-horizontal');
        this.data.Board.bind(boardSelect);
        this.data.Categories.bind(cateSelect);

        boardSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.board.deleteOne(id).catch(firebaseErrorHandler);
            return true;
        }
        boardSelect.ul.append(createElement('button').addClass('n-option-add').props({
            innerHTML: '+ 새로운 분류 추가', onmousedown(e) {
                e.stopPropagation();
                e.preventDefault();
                modal('addMenu');
            }
        }));

        cateSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.categories.deleteOne(id).catch(firebaseErrorHandler);
            return true;
        }
        cateSelect.ul.append(createElement('button').addClass('n-option-add').props({
            innerHTML: '+ 새로운 카테고리 추가', onmousedown(e) {
                e.stopPropagation();
                e.preventDefault();
                modal('addCategory');
            }
        }));
        templateSelect.ondelete = id => {
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return false;
            firebase.post.deleteTemporary(id, undefined, true).catch(firebaseErrorHandler);
            return true;
        }

        let ComponentModel = new Model(
            Object.keys(FormContent),
            function (namespace) {

                if (!FormContent[namespace].text) return;
                let li = createElement('li')
                    .css({ 'font-size': 'var(--font-size-regular)', cursor: 'pointer' })
                    .attrs({ draggable: true })
                    .props({
                        ondragstart(e) {
                            e.dataTransfer.setData("text", `$$nemuwiki$$-${namespace}`);
                            article.ondragover = e2 => {
                                e2.preventDefault();
                            }
                            article.ondrop = e2 => {
                                e2.preventDefault();

                                let rect, now_pos, last_pos = 999;
                                let last_el;

                                for (let el of Array.from(article.querySelectorAll('.focusable'))) {
                                    rect = el.getBoundingClientRect();
                                    now_pos = rect.y + (rect.height * 0.5);
                                    if (Math.abs(now_pos - e2.clientY) > Math.abs(last_pos - e2.clientY)) continue;
                                    last_pos = now_pos;
                                    last_el = el;
                                }

                                let component = app_article.createForm(namespace, undefined, undefined, true);
                                if (last_el) {
                                    if (last_pos < e2.clientY) last_el.after(component);
                                    else last_el.before(component);
                                }
                                else article.append(component);
                                component.scrollIntoViewIfNeeded();
                            }
                        },
                        ondragend() {
                            article.ondrop = article.ondragover = null;
                        }
                    });
                li.append(
                    createElement('span').attrs({ class: 'tag icon' }).addClass(FormContent[namespace].icon).props({ onclick() { article.append(app_article.createForm(namespace, undefined, undefined, true)) } }),
                    createElement('span').attrs({ 'data-type': namespace }).props({ innerHTML: FormContent[namespace].text })
                );
                this.ul.append(li);
            }
        )


        let templateChk = createElement('input').attrs({ type: 'checkbox', class: 'toggle_chk' }).props({ id: 'template_chk', onclick: setTemplate });
        let templateDiv = createElement('div').props({ innerHTML: '템플릿으로 사용' }).addClass('flex-horizontal');

        templateDiv.append(templateChk);

        let hiddenChk = createElement('input').attrs({ type: 'checkbox', class: 'toggle_chk' }).props({ id: 'hidden_chk' });
        let hiddenDiv = createElement('div').props({ innerHTML: '숨긴 문서' }).addClass('flex-horizontal');

        hiddenDiv.append(hiddenChk);

        aside.append(
            cateSelect,
            boardSelect,
            templateSelect,
            this.createBlockList('components', '컴포넌트', ComponentModel),
            createElement('button').props({ innerHTML: '게시하기', onclick: submit }).addClass('f_button').addClass('submit_btn').css({ 'max-width': '23rem', width: '100%' }),
            templateDiv,
            hiddenDiv,
        );

        listenCategories();
        let { next } = firebase.post.list({ board_name: 'template' }, true);
        let datas = {};
        next().then(docs => {
            for (let doc of docs) {
                let data = datas[doc.id] = doc.data();
                templateSelect.ul.append(createOption({ id: doc.id, value: doc.id, text: data.title, is_owner: data.author == app.user?.uid }, templateSelect));
            }
            templateSelect.onselchange = (id) => {
                let { contents } = datas[id];

                let appendList = [];
                for (let content of contents) {
                    let data = content.value;
                    let content_wrap = app_article.createForm(content.type, undefined, data, true);
                    switch (content.type) {
                        case 'textbox':
                            for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
                    }
                    appendList.push(content_wrap);
                }

                article.querySelectorAll('.focusable').forEach(el => el.remove());
                article.append.apply(article, appendList);
            }
            loading(1);
        }).catch(firebaseErrorHandler);
        this.data.Board.proceed();
        this.data.Categories.proceed();
    }
}