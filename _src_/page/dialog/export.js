const IndexContent = {
    ...ContentBase,
    list: {
        async initialize(id, wrap, model) {
            let { page_offset } = model;
            let docs, { next } = await firebase.dialogIndex.list();
            let cardMode = model.style == 'galery';
            let itemFlexClass = cardMode ? 'flex-vertical' : 'flex-horizontal';
            let load = async () => {
                list__footer.disabled = true;

                docs = await next();

                for (let doc of docs) {
                    let data = doc.data();

                    let row = createElement('span').addClass('list__item', itemFlexClass);
                    let post_anchor = createElement('a').attrs({ class: 'list__item__title', href: `/dialog/?post=${doc.id}` }).props({ innerHTML: data.title });

                    let img, img_alt = createElement('div').addClass('list__item__alt').props({ onclick });
                    if (data.thumbnail && data.thumbnail != 'undefined') {
                        img = createElement('img').attrs({ class: 'list__item__img' }).props({ onerror() { this.replaceWith(img_alt); } });
                        img.src = data.thumbnail.startsWith('http') ? imgurThumb(data.thumbnail, 'm') : firebase.storage.getStaticUrl(data.thumbnail);
                    }

                    if (cardMode) {
                        img && img.props({ onclick() { move(post_anchor.href); } })
                        row.append(img || img_alt, post_anchor);
                    } else {
                        if (img) {
                            let preview = createElement('span').addClass('list__item__preview', 'icon', 'icon-image').props({
                                onmouseover(e) {
                                    img.css({
                                        top: (e.clientY - 10) + 'px',
                                        left: (e.clientX - 10) + 'px',
                                    })
                                }
                            });
                            preview.append(img);
                            post_anchor.append(preview);
                        }
                        row.append(post_anchor);
                    }
                    wrap.append(row);

                }

                if (docs.length < (model.page_offset || 25)) list__footer.remove();

                list__footer.disabled = false;
                if (this.data.Board) this.data.Board.proceed();
            }

            let list__footer = createElement('button').props({ innerHTML: TEXTS.load_more, onclick: load }).addClass('list__footer', 'b_button', itemFlexClass);

            if (cardMode) wrap.addClass(model.style).append(list__footer);
            else {
                let list__header = createElement('span').addClass('list__header', 'flex-horizontal');
                list__header.append(
                    createElement('a').attrs({ class: 'list__item__title' }).props({ innerHTML: TEXTS.title })
                );
                wrap.addClass('flex-vertical', model.style).append(list__header, list__footer);
            }

            await load();
        }
    },
}

const DIALOG_TEXTS = {
    title: '네무로그'
}

export { asideIndex as aside, articleIndex as article };