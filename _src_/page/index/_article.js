class articleIndex extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        let post_id = params.get('post');
        if (post_id) {
            document.title = `${TEXTS.sitename} :: 로딩중`;
            (async () => {
                if (post_id == 'random') post_id = await firebase.search.random();

                let doc = await firebase.post.selectOne(post_id);
                let data = doc.data();

                if (data == undefined) return move(`404?message=${encodeURI('존재하지 않는 문서입니다.')}&url=${location.href}`, true);
                if (data.deleted) return move(`404?message=${encodeURI('삭제된 문서입니다.')}&url=${location.href}`, true);
                if (data.hidden && data.author != app.user?.uid) return move(`403?message=${encodeURI('타인의 숨긴 문서는 조회가 불가합니다.')}&url=${location.href}`, true);

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
                    createElement('div').css({ 'text-align': 'left' }).css({ 'line-height': '2rem' })
                ];

                appendList[3].append(
                    createElement('a').attrs({ class: 'tag', href: `/?field=category&operator=equal&keyword=${data.category}` }).props({ innerHTML: `카테고리:${data.category}` }).css({ display: 'inline-block', 'line-height': 1.2 }),
                    createElement('a').attrs({ class: 'tag', href: `/?field=board_name_arr&operator=array-contains&keyword=${data.board_name}` }).props({ innerHTML: `분류:${data.board_name_arr?.join(' > ') || data.board_name}` }).css({ display: 'inline-block', 'line-height': 1.2 }),
                    createElement('a').attrs({ class: 'tag', href: `/profile?uid=${data.author}` }).props({ innerHTML: `사용자 페이지` }).css({ display: 'inline-block', 'line-height': 1.2 })
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
                            innerHTML: `${info.index_str} `, id: `_${info.index_str.split('.').join('_')}`,
                            onclick(e) { e.preventDefault(); }
                        })
                        .attrs({ href: '#summury' }));
                });

                for (let sumurry of summuryList) {
                    sumurry.append.apply(sumurry, t_infos.map(
                        info =>
                            createElement('a').attrs({ href: `#_${info.index_str.split('.').join('_')}` })
                                .props({ innerHTML: `${info.index_str} <span>${info.title}</span>`, onclick(e) { e.preventDefault(); } })
                                .css({ 'margin-left': `${info.depth * 1.5}rem` })
                    ))
                }


                if (html_annotation.length > 0) {
                    let annotation = createElement('div').addClass('content', 'annotation', 'flex-vertical');
                    annotation.innerHTML = html_annotation;
                    html_annotation = '';
                    appendList.push(annotation);
                }

                appendList.push(footer);

                article.append.apply(article, appendList);
            })();
        } else {

            let keyword = params.get('keyword') || '';
            let field = params.get('field') || 'title_arr';
            let operator = params.get('operator') || 'contains';

            if(keyword){
                document.title = `${keyword} :: ${TEXTS.search_result_title} - ${TEXTS.sitename}`;

                article.append(
                    this.createContent('zoom'),
                    this.createContent('main_header', undefined, { text: TEXTS.search_result_title, permission: FINAL.PERMISSION.R }),
                    this.createContent('sub_header', 'c_timestamp', { text: new Date().toLocaleString() }),
                    this.createContent('title', 'title_all', { text: TEXTS.all_document }),
                    this.createContent('list', 'list_all', { style: 'table', page_offset: 5, keyword, field, operator, searchData: { hidden: { op: 'equal', key: false } } }),
                    footer
                );
    
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
                this.data.Board.proceed();
            } else {
                document.title = `${TEXTS.sitename} :: ${TEXTS.site_index}`;

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
                    this.createContent('list', 'list_all', { style: 'table', page_offset: 5, keyword, field, operator, searchData: { hidden: { op: 'equal', key: false } } }),
                    this.createContent('title', 'title_dialog', { text: TEXTS.dialog_document }),
                    this.createContent('list', 'list_dialog', { style: 'table', page_offset: 5, keyword: '대화', field: 'category', operator: 'equal', searchData: { hidden: { op: 'equal', key: false } }, preview: true }),
                    this.createContent('title', 'title_character', { text: TEXTS.character_document }),
                    this.createContent('list', 'list_character', { style: 'galery', keyword: '인물', field: 'category', operator: 'equal', searchData: { hidden: { op: 'equal', key: false } } }),
                    footer
                );
    
                this.components.title_all.wrap.addClass('fold');
                this.components.list_all.wrap.addClass('hide');

                this.components.title_dialog.wrap.addClass('fold');
                this.components.list_dialog.wrap.addClass('hide');
    
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
                this.data.Board.bind(this.components['list_dialog']);
                this.data.Board.bind(this.components['list_character']);
                this.data.Board.proceed();
            }
        }
    }

    destroy() {
        if (this.timeout_timer) clearTimeout(this.timeout_timer);
        if (this.interval_timer) clearInterval(this.interval_timer);
    }
}