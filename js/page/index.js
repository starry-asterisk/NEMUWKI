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
            this.createBlock('btn_upload', `<button class="s_button" onclick=" move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`),
            this.createBlock('btn_login', `<button class="s_button" onclick=" move('login')">${TEXTS.form.login}</button>`)
        );

        this.components.Board.ul.addClass('type2');
    }

    createSearch(id, param) {
        let wrap = createElement('div').addClass('f_block').css({ marginBottom: 'var(--spacing-large)' }).props({ id: `${id}_wrap` });
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
class articleIndex extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        let post_id = params.get('post');
        if (post_id) {
            (async () => {
                if (post_id == 'random') post_id = await firebase.search.random();

                let doc = await firebase.post.selectOne(post_id);
                let data = doc.data();

                history.replaceState({}, '', location.href.replace('post=random', `post=${post_id}`));
                app.saveVisited(post_id, data.title, data.board_name);

                document.title = `${TEXTS.sitename} :: ${data.title}`;

                let appendList = [
                    this.createContent('zoom'),
                    this.createContent('main_header', undefined, {
                        text: data.title, permission: (
                            app.user ? app.user.uid === data.author ? FINAL.PERMISSION.RWD : FINAL.PERMISSION.RW : FINAL.PERMISSION.R
                        ), post_id
                    }),
                    this.createContent('sub_header', 'c_timestamp', { text: new Date(1000 * data.timestamp.seconds).toLocaleString() }),
                    createElement('div').css({'text-align':'left'}).css({ 'line-height': '2rem' })
                ];

                appendList[3].append(
                    createElement('a').attrs({class: 'tag', href: `/?field=board_name_arr&operator=array-contains&keyword=${data.category}`}).props({innerHTML: `카테고리:${data.category}`}).css({ display: 'inline-block', 'line-height': 1.2}),
                    createElement('a').attrs({class: 'tag', href: `/?field=board_name_arr&operator=array-contains&keyword=${data.board_name}`}).props({innerHTML: `분류:${data.board_name_arr.join(' > ')}`}).css({ display: 'inline-block', 'line-height': 1.2}), 
                    createElement('a').attrs({class: 'tag', href: `/profile?uid=${data.author}`}).props({innerHTML: `사용자 페이지`}).css({ display: 'inline-block', 'line-height': 1.2})
                );

                let summuryList = [];

                let index = 0;
                let depth = 1;
                let prefix = ''
                let t_infos = [];

                for (let content of data.contents) {
                    let data = content.value;
                    let content_wrap = this.createContent(content.type, undefined, data);
                    let default_;
                    switch (content.type) {
                        case 'title':
                            default_ = { content: content_wrap, title: content_wrap.innerHTML };
                            if (depth < data.depth) {
                                prefix += `${index}.`;
                                t_infos.push({ depth: ++depth, prefix, index_str: prefix + '1.', index: index = 1, ...default_ });
                            } else if (depth == data.depth) {
                                t_infos.push({ depth, prefix, index: ++index, index_str: prefix + `${index}.`, ...default_ });
                            } else {
                                let info = t_infos.findLast(info => info.depth == data.depth);
                                t_infos.push({ depth: depth = data.depth, prefix: prefix = info.prefix, index: index = info.index + 1, index_str: prefix + `${index}.`, ...default_ });
                            }
                            break;
                        case 'summury':
                            summuryList.push(content_wrap);
                            break;
                        case 'textbox':
                            for (let span of Array.from(content_wrap.querySelectorAll('[style*="font-size"]'))) if (span.style.fontSize.endsWith('rem')) span.css({ 'font-size': `${parseFloat(span.style.fontSize) * 10}px` });
                    }
                    appendList.push(content_wrap);
                }

                if (summuryList.length > 0) t_infos.forEach(info => {
                    info.content.prepend(createElement('a')
                        .props({
                            innerHTML: `${info.index_str} `, id: info.index_str.split('.').join('_'),
                            onclick(e) { e.preventDefault(); history.pushState({}, '', '#summury'); summuryList[0].scrollIntoViewIfNeeded(); }
                        })
                        .attrs({ href: '#summury' }));
                });

                for (let sumurry of summuryList) {
                    sumurry.append.apply(sumurry, t_infos.map(
                        info =>
                            createElement('a').attrs({ href: `#${info.index_str.split('.').join('_')}` })
                                .props({ innerHTML: `${info.index_str} <span>${info.title}</span>`, onclick(e) { e.preventDefault(); history.pushState({}, '', `#${info.index_str.split('.').join('_')}`); info.content.scrollIntoViewIfNeeded(); } })
                                .css({ 'margin-left': `${info.depth * 1.5}rem` })
                    ))
                }


                if (html_annotation.length > 0) {
                    let annotation = createElement('div').attrs({ class: 'content annotation' });
                    annotation.innerHTML = html_annotation;
                    html_annotation = '';
                    appendList.push(annotation);
                }

                appendList.push(footer);

                article.append.apply(article, appendList);
            })();
        } else {
            document.title = `${TEXTS.sitename} :: ${TEXTS.site_index}`;

            let keyword = params.get('keyword') || '';
            let field = params.get('field') || 'title_arr';
            let operator = params.get('operator') || 'contains';

            article.append(
                this.createContent('zoom'),
                this.createContent('main_header', undefined, { text: TEXTS.welcome_title, permission: FINAL.PERMISSION.R }),
                this.createContent('sub_header', 'c_timestamp', { text: new Date().toLocaleString() }),
                this.createContent('notice'),
                this.createContent('textbox', undefined, '<br><div style="text-align: center;"><span style="color: #039BE5; font-size: 38px;">환영합니다!</span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 39px; color: #039BE5;">네무위키</span><span style="font-size: 38px;">입니다</span></div><div style="text-align: center;">※ 정확하지 않은 내용이 있을 수있으며</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div><br>'),
                this.createContent('table', undefined, {
                    cellColors: ["", ""],
                    cells: ["%{display:block;text-align:center}처음이라면\n[link:https://www.nemuwiki.com/?post=QFFrhNhkjXqDGnKXdiC8;사용_가이드]%", "%{display:block;text-align:center}익숙하다면\n[link:https://www.nemuwiki.com/profile;사용자_문서]%"],
                    header: [0, 0],
                    innerLineColor: 'var(--clr-primary-base)',
                    outerLineColor: 'transparent',
                    outerLineWidth: '1',
                    rowcount: 1,
                    isFullWidth: true
                }),
                this.createContent('title', 'title_all', { text: TEXTS.all_document }),
                this.createContent('list', 'list_all', { style: 'table', page_offset: 5, keyword, field, operator }),
                this.createContent('title', 'title_character', { text: TEXTS.character_document }),
                this.createContent('list', 'list_character', { style: 'galery', keyword: '인물', field: 'category', operator: 'equal' }),
                footer
            );

            this.components.title_all.wrap.addClass('fold');
            this.components.list_all.wrap.css({ display: 'none' });

            this.timeout_timer = setTimeout(() => {
                this.interval_timer = setInterval(() => {
                    this.components.c_timestamp.wrap.innerHTML = new Date().toLocaleString();
                }, 1000);
            }, 1000 - new Date().getMilliseconds());

            this.data.Board = new Model(
                Options.get('board'),
                null,
                function (datas) {
                    for (let a of article.querySelectorAll('[data-board]')) {
                        let board = datas.find(data => data.value == a.getAttribute('data-board'));
                        if (board) a.innerHTML = board.path;
                    }
                }
            );
            this.data.Board.bind(this.components['list_all']);
            this.data.Board.bind(this.components['list_character']);
            this.data.Board.proceed();
        }
    }

    destroy() {
        if (this.timeout_timer) clearTimeout(this.timeout_timer);
        if (this.interval_timer) clearInterval(this.interval_timer);
    }
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

            wrap.append(n_title, n_timestamp, n_content);
            wrap.style.removeProperty('display');
        }
    },
    list: {
        async initialize(id, wrap, model) {
            let { keyword, field, operator, searchData = {} } = model
            let docs, { next } = await firebase.search.list({ [field]: keyword, ...searchData }, operator, model.page_offset || 25);

            let load = async () => {
                list__footer.disabled = true;

                docs = await next();

                for (let doc of docs) {
                    let data = doc.data();

                    let row = createElement('span').attrs({ class: 'list__item' });
                    let board_anchor = createElement('a').attrs({ class: 'list__item__board_name', 'data-board': data.board_name, href: `./index?field=board_name_arr&operator=array-contains&keyword=${data.board_name}` }).props({ innerHTML: data.board_name });
                    let post_anchor = createElement('a').attrs({ class: 'list__item__title', href: `./?post=${doc.id}` }).props({ innerHTML: data.title });


                    if (model.style == 'galery') {
                        let onclick = function () { move(post_anchor.href); }
                        let img_alt = createElement('div').addClass('list__item__alt').props({ onclick })
                        if (data.thumbnail && data.thumbnail != 'undefined') {
                            let img = createElement('img').attrs({ class: 'list__item__img' }).props({ onerror() { this.replaceWith(img_alt); }, onclick });
                            img.src = data.thumbnail.startsWith('http') ? imgurThumb(data.thumbnail, 'm') : firebase.storage.getStaticUrl(data.thumbnail);
                            row.append(img);
                        } else {
                            row.append(img_alt);
                        }
                    }
                    row.append(board_anchor, post_anchor);
                    wrap.append(row);

                }

                if (docs.length < (model.page_offset || 25)) list__footer.remove();

                list__footer.disabled = false;
                if (this.data.Board) this.data.Board.proceed();
            }

            let list__header = createElement('span').attrs({ class: 'list__header' });
            let list__footer = createElement('button').props({ innerHTML: TEXTS.load_more, onclick: load }).attrs({ class: 'list__footer b_button' });

            list__header.append(
                createElement('a').attrs({ class: 'list__item__board_name' }).props({ innerHTML: TEXTS.document_cate }),
                createElement('a').attrs({ class: 'list__item__title' }).props({ innerHTML: TEXTS.title })
            );

            wrap.addClass(model.style).append(list__header, list__footer);

            await load();
        }
    },
}

export { asideIndex as aside, articleIndex as article };