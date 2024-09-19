async function makeKeyword(id, data) {
    if (data.deleted) return await firebase.search.unset(id);
    if (data.board_name == 'template') return await firebase.search.unset(id);
    let {
        title,
        board_name,
        board_name_arr,
        category,
        timestamp,
        updated_timestamp,
        author,
        contents,
        hidden
    } = data
    let fullText = data.title.replace(/\s+/g, '');
    let title_arr = [];

    for (let start = 0; start < fullText.length; start++) {
        let max_length = fullText.length - start;
        for (let length = 1; length <= max_length; length++) {
            title_arr.push(fullText.substr(start, length))
        }
    }

    title_arr = [...new Set(title_arr)];

    let keyword_data = {
        title,
        title_arr,
        board_name,
        board_name_arr,
        category,
        timestamp,
        author,
        hidden
    }

    let thumbnail, regex_result;
    for (let content of contents) {
        switch (content.type) {
            case 'image':
                if (thumbnail && !content.value.isThumb) break;
                thumbnail = content.value.src;
                break;
            case 'table':
                if (thumbnail) break;
                if (content.value.cells) for (let cell of content.value.cells) {
                    REGEX.image.lastIndex = 0;
                    regex_result = REGEX.image.exec(cell.value);
                    if (regex_result) {
                        thumbnail = regex_result[1];
                        break;
                    }
                }
                break;
            case 'textbox':
                if (thumbnail) break;
                REGEX.image.lastIndex = 0;
                regex_result = REGEX.image.exec(content.value);
                if (regex_result) {
                    thumbnail = regex_result[1];
                    break;
                }
                break;
        }
    }
    if (thumbnail) keyword_data.thumbnail = thumbnail;
    if (updated_timestamp) keyword_data.updated_timestamp = updated_timestamp;

    await firebase.search.set(id, keyword_data);
}
function logoutCallback() {
    Notify.alert(TEXTS.warn.login_neccesary);
    history.back();
}

function loginCallback() {
    let params = new URLSearchParams(location.search);
    app_article.showTab(params.get('menu') || 'default');
    app_aside.activate(params.get('menu') || undefined, true);
}

window.cb = {};
window.modifyRecord = function (doc_id, task, data, isTemplate) {
    switch (task) {
        case 'open':
            move(`./index?post=${doc_id}`);
            break;
        case 'edit':
            move(`./form?post=${doc_id}`);
            break;
        case 'deletehash':
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return;
            deleteImgurImg(doc_id, data.deletehash, data.link).then(result => {
                if (result.status === 200) {
                    Notify.alert('삭제가 완료 되었습니다.');
                    app_article.showTab('resource');
                } else {
                    Notify.alert('Imgur사이트 파일 삭제에 실패했습니다.');
                }
            }).catch(firebaseErrorHandler);
            break;
        case 'del':
            if (!Notify.confirm('정말로 삭제 하시겠습니까?')) return;
            firebase.post.deleteTemporary(doc_id, undefined, true).then(() => {
                Notify.alert('삭제가 완료 되었습니다.');
                app_article.showTab('template');
            }).catch(firebaseErrorHandler);
            break;
        case 'recover':
            if (!Notify.confirm('복구 하시겠습니까?')) return;
            firebase.post.recover(doc_id, undefined, isTemplate).then(async () => {
                if (!isTemplate) await makeKeyword(doc_id, data);
                Notify.alert('복구가 완료 되었습니다.');
                move(`./index?post=${doc_id}`);
            }).catch(firebaseErrorHandler);
            break;
    }
};

function parseField(setting, value, doc_id, data) {
    let span = createElement('span').css({ 'max-width': setting.width, 'min-width': setting.minWidth });
    let isTemplate = data.board_name == 'deleted-template';
    switch (setting.type) {
        case 'timestamp':
            span.attrs({ title: '시각' }).props({ innerHTML: new Date(value.seconds * 1000).toLocaleDateString() });
            break;
        case 'button':
            let cb_id = `cb${randomId()}`;
            while (typeof cb[cb_id] == 'function') cb_id = `cb${randomId()}`;
            cb[cb_id] = () => {
                modifyRecord(doc_id, setting.name, data, isTemplate);
            }
            span.attrs({ title: setting.name }).addClass('setting__li__button', `icon-${setting.name}`).attrs({ onclick: `cb.${cb_id}()` });
            break;
        case 'board_name':
            span.attrs({ title: data.board_name }).toggleClass('setting__li__tag', isTemplate).props({ innerHTML: isTemplate ? '템플릿' : data.board_name });
            break;
        case 'image':
            span.attrs({ title: data.board_name }).props({ innerHTML: `<img src="${imgurThumb(value, 'm')}"/>` });
            break;
        case 'size':
            span.attrs({ title: '가로 × 세로' }).props({ innerHTML: `${data.width} × ${data.height}` });
            break;
        case 'volume':
            span.attrs({ title: '용량' }).props({ innerHTML: displayVolume(value) });
            break;
        default:
            span.attrs({ title: value }).props({ innerHTML: value });
            break;
    }
    return span.outerHTML;
}

function displayVolume(v) {
    v = Number(v);
    let prefix = ['Byte', 'Kb', 'Mb', 'Gb'];
    let prefix_level = 0;
    while (v > 1023) {
        v /= 1024;
        prefix_level++;
    }
    return `${Math.floor(v * 10) / 10} ${prefix[prefix_level]}`;
}

function parsseHeader(field) {
    return createElement('li').addClass('header').props({
        innerHTML: field.map(setting => {
            return createElement('span').css({ 'max-width': setting.width, 'min-width': setting.minWidth }).props({ innerHTML: setting.displayName || setting.name }).outerHTML;
        }).join('')
    });
}

const SettingTabs = {
    default: {
        title: '일반',
        init(wrap, user) {
            let sec1, sec2, sec1_img, sec2_img;
            wrap = createElement('div').addClass('flex-vertical');
            wrap.append(
                sec1 = createElement('div').addClass('setting_default'),
                sec2 = createElement('div').addClass('flex-vertical')
            )

            sec1.append(
                (sec1_img = new Image()).addClass('setting_default_banner'),
                (sec2_img = new Image()).addClass('setting_default_avatar')
            );

            let sec2_buttons = createElement('div');
            sec2_buttons.append(
                createElement('button').addClass('s_button').css({ 'margin-inline': 'auto' }).props({
                    innerHTML: '프로필 사진 변경',
                    onclick: e => {
                        e.preventDefault();
                        e.stopPropagation();
                        modal("addImg", (photo_url) => sec2_img.src = photo_url);
                    }
                }),
                createElement('button').addClass('s_button').css({ 'margin-inline': 'auto' }).props({
                    innerHTML: '배너 사진 변경',
                    onclick: e => {
                        e.preventDefault();
                        e.stopPropagation();
                        modal("addImg", (banner_url) => sec1_img.src = banner_url);
                    }
                }),
            );

            let theme_color = '#039AE5';
            let handler = e => {
                e.preventDefault();
                e.stopPropagation();
                modal('colorPicker',color => {
                    theme_color=color;
                    theme_input.value = color;
                },theme_color)
            }
            let theme_wrap = createElement('div');
            let theme_input_wrap = createElement('div').attrs({ class: 'b_input', placeholder: '테마색상' }).css({ 'margin': '1rem auto 0', display: 'inline-block'}).props({onclick: handler});
            let theme_input = createElement('input').attrs({ placeholder: '', maxlength: 7, readonly: true });
            theme_input_wrap.append(theme_input);
            theme_wrap.append(theme_input_wrap, createElement('button').addClass('s_button').props({
                innerHTML: '초기화',
                onclick: e => {
                    e.preventDefault();
                    e.stopPropagation();
                    theme_color='#039AE5';
                    theme_input.value = '';
                }
            }));

            let theme_sub_color = '#FAFAFA';
            let handler2 = e => {
                e.preventDefault();
                e.stopPropagation();
                modal('colorPicker',color => {
                    theme_sub_color=color;
                    theme_sub_input.value = color;
                },theme_sub_color)
            }
            let theme_sub_wrap = createElement('div');
            let theme_sub_input_wrap = createElement('div').attrs({ class: 'b_input', placeholder: '보조 테마색상' }).css({ 'margin': '1rem auto', display: 'inline-block'}).props({onclick: handler2});
            let theme_sub_input = createElement('input').attrs({ placeholder: '', maxlength: 7, readonly: true });
            theme_sub_input_wrap.append(theme_sub_input);
            theme_sub_wrap.append(theme_sub_input_wrap, createElement('button').addClass('s_button').props({
                innerHTML: '초기화',
                onclick: e => {
                    e.preventDefault();
                    e.stopPropagation();
                    theme_sub_color='#FAFAFA';
                    theme_sub_input.value = '';
                }
            }));

            let sec2_buttons2 = createElement('div');

            sec2_buttons2.append(
                createElement('button').addClass('s_button').css({ 'margin-inline': 'auto' }).props({
                    innerHTML: '취소',
                    onclick: () => {
                        if(!confirm('수정된 내용을 취소하시겠습니까?')) return;
                        app_article.showTab('default')
                    }
                }),
                createElement('button').addClass('s_button').css({ 'margin-inline': 'auto' }).props({
                    innerHTML: '적용',
                    onclick: () => {
                        if(!confirm('수정된 내용을 적용하시겠습니까?')) return;
                        let data = {};
                        if (sec1_img.src) data.banner_url = sec1_img.src;
                        if (sec2_img.src) data.photo_url = sec2_img.src;
                        data.theme_color = theme_input.value == '#039AE5'?'':theme_input.value;
                        data.theme_sub_color = theme_sub_input.value == '#FAFAFA'?'':theme_sub_input.value;
                        console.log(data);
                        firebase.auth.updateUser(user.uid, data).then(()=>{
                            location.reload();
                        });
                    }
                })
            );

            sec2.append(
                createElement('span').addClass('setting_default_email').props({ innerHTML: user.email }),
                sec2_buttons,
                theme_wrap,
                //theme_sub_wrap,
                sec2_buttons2
            );

            
            firebase.auth.getUser().then(user => {
                let data = user.data();
                if (data.banner_url) sec1_img.src = data.banner_url;
                if (data.photo_url) sec2_img.src = data.photo_url;
                if (data.theme_color) theme_input.value = data.theme_color;
                if (data.theme_sub_color) theme_sub_input.value = data.theme_sub_color;
                profile__email.innerHTML = data.email;
            }).catch(firebaseErrorHandler);

            return wrap;
        }
    },
    template: {
        title: '템플릿 관리',
        init(wrap, user) {
            let docs, { next } = firebase.post.list({ board_name: 'template', author: user.uid }, true);
            let field = [
                { displayName: '이름', name: 'title', width: 'auto', minWidth: '10rem', type: 'text' },
                { displayName: '생성 날짜', name: 'timestamp', width: '7rem', minWidth: '7rem', type: 'timestamp' },
                { displayName: '열기', name: 'open', width: '4rem', minWidth: '7rem', type: 'button' },
                { displayName: '수정', name: 'edit', width: '4rem', minWidth: '7rem', type: 'button' },
                { displayName: '삭제', name: 'del', width: '4rem', minWidth: '7rem', type: 'button' },
            ]
            wrap.append(parsseHeader(field));
            let load = async () => {
                docs = await next();
                docs.map(doc => {
                    let data = doc.data();
                    wrap.append(
                        createElement('li').props({ innerHTML: field.map(info => parseField(info, data[info.name], doc.id, data)).join('') })
                    );
                })
            }

            load();

            return wrap;
        }
    },
    categories: {
        title: '카테고리 관리',
        init(wrap, user) {

        }
    },
    board: {
        title: '문서 분류 관리',
        init(wrap, user) {

        }
    },
    resource: {
        title: '이미지 관리',
        init(wrap, user) {
            let field = [
                { displayName: '이미지', name: 'link', width: 'auto', minWidth: '7rem', type: 'image' },
                { displayName: '사이즈', name: '', width: 'auto', minWidth: '10rem', type: 'size' },
                { displayName: '크기', name: 'size', width: 'auto', minWidth: '10rem', type: 'volume' },
                { displayName: '삭제', name: 'deletehash', width: '6rem', minWidth: '6rem', type: 'button' },
            ]
            wrap.append(parsseHeader(field));
            firebase.resources.all().then(r => {
                for (let doc of r.docs) {
                    let data = doc.data();
                    wrap.append(
                        createElement('li').props({ innerHTML: field.map(info => parseField(info, data[info.name], doc.id, data)).join('') }).css({ height: '5rem' })
                    );
                }
            });
            return wrap;
        }
    },
    deleted: {
        title: '삭제된 문서 관리',
        init(wrap, user) {
            let docs, { next } = firebase.post.list({ deleted: true, author: user.uid }, null, 'equal');
            let field = [
                { displayName: '분류', name: 'board_name', width: '7rem', minWidth: '7rem', type: 'board_name' },
                { displayName: '이름', name: 'title', width: 'auto', minWidth: '10rem', type: 'text' },
                { displayName: '생성 날짜', name: 'timestamp', width: '7rem', minWidth: '7rem', type: 'timestamp' },
                { displayName: '삭제 날짜', name: 'deleted_timestamp', width: '7rem', minWidth: '7rem', type: 'timestamp' },
                { displayName: '복구', name: 'recover', width: '4rem', minWidth: '4rem', type: 'button' },
            ]
            wrap.append(parsseHeader(field));
            let load = async () => {
                docs = await next();
                docs.map(doc => {
                    let data = doc.data();
                    wrap.append(
                        createElement('li').props({ innerHTML: field.map(info => parseField(info, data[info.name], doc.id, data)).join('') })
                    );
                })
            }

            load();

            return wrap;
        }
    },
    delete_user: {
        title: '회원 탈퇴',
        init(wrap, user) {

        }
    },
}

export { asideSetting as aside, articleSetting as article, logoutCallback, loginCallback };