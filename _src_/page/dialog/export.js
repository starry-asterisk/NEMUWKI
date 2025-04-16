const IndexContent = {
    ...ContentBase,
    list: {
        async initialize(id, wrap, model) {
            let { page_offset } = model;
            let docs, { next } = await firebase.dialogIndex.list();
            let cardMode = model.style == 'galery';
            let itemFlexClass = cardMode ? 'flex-vertical' : 'flex-horizontal';
            docs = await next();
            if (docs.length == 0) return;
            let doc_data = docs[0].data();
            var list = doc_data.list;
            let load = async () => {
                let count = -1;
                list__footer.disabled = true;


                for (let data of list) {
                    if (data.deleted) continue;
                    count++;
                    if (count > page_offset) break;
                    let row = createElement('span').addClass('list__item', itemFlexClass);
                    let dialog_anchor = createElement('a').attrs({ class: 'list__item__title', href: `/dialog/?dialog=${data.id}` }).props({ innerHTML: data.title });

                    let img, img_alt = createElement('div').addClass('list__item__alt').props({ onclick });
                    if (data.thumbnail && data.thumbnail != 'undefined') {
                        img = createElement('img').attrs({ class: 'list__item__img' }).props({ onerror() { this.replaceWith(img_alt); } });
                        img.src = data.thumbnail.startsWith('http') ? imgurThumb(data.thumbnail, 'm') : firebase.storage.getStaticUrl(data.thumbnail);
                    }

                    if (cardMode) {
                        img && img.props({ onclick() { move(dialog_anchor.href); } })
                        row.append(img || img_alt, dialog_anchor);
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
                            dialog_anchor.append(preview);
                        }
                        row.append(dialog_anchor);
                    }
                    wrap.append(row);

                }

                if (count < (model.page_offset || 25)) list__footer.remove();

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
    main_header: {
        initialize(id, wrap, model) {
            let title = createElement('span').addClass('main_header__title', 'flex-horizontal').props({ innerHTML: model.text });
            let buttons = createElement('div').attrs({ class: `main_header__buttons buttons` });

            model.permission >= FINAL.PERMISSION.R && buttons.append(createElement('button').props({ innerHTML: TEXTS.share, onclick: () => goShare('twitter') }));
            model.permission >= FINAL.PERMISSION.RW && buttons.append(createElement('button').props({ innerHTML: TEXTS.edit, onclick: () => move(`write?dialog=${model.dialog_id}`) }));
            model.permission >= FINAL.PERMISSION.RWD && buttons.append(createElement('button').props({ innerHTML: TEXTS.delete, onclick: function () { remove(this, model.dialog_id, model.doc_index); } }));

            wrap.addClass('fold-end', 'flex-horizontal').append(title, buttons);
        }
    },
}

function remove(button, dialog_id, doc_index, isTemplate) {
    if (!Notify.confirm('정말로 삭제 하시겠습니까?') || !Notify.confirm('안내 : 삭제 이후 5일 이상이 경과하면 삭제가 불가할 수 있습니다')) return;
    button.setAttribute('disabled', true);
    firebase.dialog.deleteTemporary(dialog_id, undefined, isTemplate)
        .then(async () => {
            let { next } = firebase.dialogIndex.list();
            let docs = await next();
            if (docs.length > 0) {
                console.log('docs', docs);
                var chunk_data = await docs[0].data();
                chunk_data.list[doc_index] = { deleted: true };
                await firebase.dialogIndex.set(docs[0].id, chunk_data);
            }
            move(ROOT_PATH + 'dialog', true);
        })
        .catch(firebaseErrorHandler);
}

const DIALOG_TEXTS = {
    title: '네무로그'
}

export { asideIndex as aside, articleIndex as article };