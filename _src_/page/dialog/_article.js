class articleIndex extends articleBase {
    constructor(params) {
        super();
        this.contentBase = IndexContent;
        let dialog_id = params.get('dialog');
        if (dialog_id) {
            document.title = `${DIALOG_TEXTS.title} :: 로딩중`;
            (async () => {
                let doc = await firebase.dialog.selectOne(dialog_id);
                let data = doc.data();

                if (data == undefined) return move(`404?message=${encodeURI('존재하지 않는 문서입니다.')}&url=${location.href}`, true);
                if (data.deleted) return move(`404?message=${encodeURI('삭제된 문서입니다.')}&url=${location.href}`, true);
                if (data.hidden && data.author != app.user?.uid) return move(`403?message=${encodeURI('타인의 숨긴 문서는 조회가 불가합니다.')}&url=${location.href}`, true);

                document.title = `${DIALOG_TEXTS.title} :: ${data.title}`;

                let appendList = [
                    this.createContent('zoom'),
                    this.createContent('main_header', undefined, {
                        text: data.title, permission: (
                            app.user && (['assume.nameless@gmail.com','6507055@gmail.com'].indexOf(app.user.email) > -1) ? FINAL.PERMISSION.RWD : FINAL.PERMISSION.R
                        ), dialog_id, doc_index: data.doc_index
                    }),
                    this.createContent('sub_header', 'c_timestamp', { text: new Date(1000 * data.timestamp.seconds).toLocaleString() }),
                    createElement('div').css({ 'text-align': 'left' }).css({ 'line-height': '2rem' })
                ];

                appendList[3].append(
                    createElement('a').attrs({ class: 'tag', href: `/dialog` }).props({ innerHTML: `목록` }).css({ display: 'inline-block', 'line-height': 1.2 })
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
            document.title = `${DIALOG_TEXTS.title} :: ${TEXTS.site_index}`;

            article.append(
                this.createContent('zoom'),
                this.createContent('main_header', undefined, { text: DIALOG_TEXTS.title, permission: FINAL.PERMISSION.R }),
                this.createContent('sub_header', 'c_timestamp', { text: new Date().toLocaleString() }),
                this.createContent('list', 'list_all', { style: 'table', page_offset: 5 }),
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
        }
    }

    destroy() {
        if (this.timeout_timer) clearTimeout(this.timeout_timer);
        if (this.interval_timer) clearInterval(this.interval_timer);
    }
}