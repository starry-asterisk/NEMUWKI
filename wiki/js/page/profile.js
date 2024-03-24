
function search({ key }) {
    if (key.toLowerCase() != 'enter') return;
    let params = new URLSearchParams(document.location.search);
    location.href = `${ROOT_PATH}/profile${SUFFIX}?keyword=${search_input.value || ''}&uid=${params.get('uid')}`
}

async function firebaseLoadCallback() {
    loading(0);
    const { createVisited, createCategories, createProfile, createLoginForm, createList1, createList2 } = await import(`../util-post.js?timestamp=${new Date().getTime()}`);
    loading(0.15);
    firebase.auth.check(async user => {
        user_area.innerHTML = '';
        createProfile(user);
        document.body.classList.remove('non-auth');
        let uid = params.get('uid') || user.uid;
        load(uid, uid == user.uid);
    }, () => {
        user_area.innerHTML = '';
        createLoginForm();
        load(params.get('uid'));
    });

    function NotFound() {
        document.body.classList.add('error');
        document.body.append(createElement('error', {
            attrs: {
                'state-code': 404,
            }, innerHTML: 404
        }));
        document.title = '404 NOT FOUND PAGE';
        document.body.classList.remove('loading');
    }

    async function load(uid, isOwner) {
        load = () => { };
        if (uid == undefined) {
            NotFound();
            return;
        }
        loading(0.3);

        SuggestList['board'] = (await firebase.board.list()).docs.map(doc => doc.data());
        SuggestList['board2Path_1'] = board2Path(SuggestList['board'], 1);
        SuggestList['board2Path_2'] = board2Path(SuggestList['board'], 2);
        loading(0.4);

        createCategories();

        createVisited();

        firebase.auth.getUser(uid).then(user_data => {
            history.pushState({}, null, `${location.origin}/wiki/profile${SUFFIX}?uid=${uid}`);
            let data = user_data.data();
            if (data == undefined) return NotFound();
            if (data.banner_url) document.querySelector('.main__profile').setStyles({ 'background-image': `url(${data.banner_url})` });
            if (data.description) self_description.innerHTML = data.description;
            else self_description.innerHTML = `<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${data.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>`;
        });

        document.body.classList.remove('loading');

        let search = params.get('keyword') == null ? {} : { title: { op: 'contains', key: params.get('keyword') } };

        await createList1(uid, 'author', 'equal', undefined, search);
        loading(0.7);
        await createList2(uid, undefined, undefined, undefined, search);

        loading(1);

        if (isOwner) {
            let editBannerButton = createElement('button', { innerHTML: '수정' });
            let editDescButton = createElement('button', { innerHTML: '수정' });
            let editBoard1Button = createElement('button', { innerHTML: '수정' });
            let editBoard2Button = createElement('button', { innerHTML: '수정' });

            toolbox_1.append(editBannerButton);
            toolbox_2.append(editDescButton);
            //toolbox_3.append(editBoard1Button);
            //toolbox_4.append(editBoard2Button);

            editBannerButton.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                modal('addImg', banner_url => {
                    document.querySelector('.main__profile').setStyles({ 'background-image': `url(${banner_url})` });
                    document.querySelector('.profile').setStyles({ '--background-url': `url(${banner_url})` });
                    firebase.auth.updateUser(uid, { banner_url });
                });
            }

            let editorInitialized = false;
            let completeDescButton, cancelDescButton, container, textBoxOp, textBox;

            editDescButton.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                editDescButton.setStyles({ display: 'none' });
                self_description.setStyles({ display: 'none' });
                if (editorInitialized) {
                    completeDescButton.setStyles({ display: 'block' });
                    cancelDescButton.setStyles({ display: 'block' });
                    container.setStyles({ display: 'block' });
                } else {
                    editorInitialized = true;
                    completeDescButton = createElement('button', { innerHTML: '저장' });
                    cancelDescButton = createElement('button', { innerHTML: '취소' });
                    container = createElement('div', { attrs: { class: 'component textbox' } });
                    textBoxOp = createTextboxOpt();
                    textBox = createTextbox({ value: self_description.innerHTML });

                    container.append(textBoxOp);
                    container.append(textBox);
                    self_description.after(container);
                    toolbox_2.append(completeDescButton);
                    toolbox_2.append(cancelDescButton);

                    completeDescButton.onclick = e => {
                        common(e);
                        self_description.innerHTML = textBox.innerHTML;
                        firebase.auth.updateUser(uid, { description: self_description.innerHTML });
                    }

                    cancelDescButton.onclick = common;

                    function common(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        editDescButton.setStyles({ display: 'block' });
                        self_description.setStyles({ display: 'block' });
                        cancelDescButton.setStyles({ display: 'none' });
                        completeDescButton.setStyles({ display: 'none' });
                        container.setStyles({ display: 'none' });

                    }
                }
            }
        }
    }
}


const commands = [{
    cmd: "backColor",
    icon: "format-color-highlight",
    val: "#00ffff",
    input: "color",
    desc: "글씨에 형광펜 효과를 줍니다."
},
{},
{
    cmd: "bold",
    icon: "format-bold",
    desc: "굵은 글씨 효과"
},
{
    cmd: "italic",
    icon: "format-italic",
    desc: "기울임 꼴"
},
{
    cmd: "strikeThrough",
    icon: "format-strikethrough",
    desc: "취소선 효과"
},
{
    cmd: "underline",
    icon: "format-underline",
    desc: "밑줄 효과"
},
{},
{
    cmd: "fontSize",
    val: "20",
    input: "number",
    desc: "폰트 사이즈를 지정합니다. 기본값은 20px입니다."
},
{},
{
    cmd: "justifyLeft",
    icon: "format-align-left",
    desc: "좌측 정렬"
},
{
    cmd: "justifyCenter",
    icon: "format-align-center",
    desc: "가운데 정렬"
},
{
    cmd: "justifyRight",
    icon: "format-align-right",
    desc: "우측 정렬"
},
{},
{
    cmd: "formatBlock",
    icon: "format-quote-close",
    val: "<blockquote>",
    desc: "인용 하기"
},
{
    cmd: "createLink",
    icon: "link-variant",
    desc: "링크 생성",
    prompt: '생성할 링크를 입력해 주세요.',
    conv_fn: val => val.startsWith('http') ? val : 'http://' + val
},
{
    cmd: "insertImage",
    icon: "image-plus",
    modal: "addImg",
    desc: "링크 기반 이미지 삽입",
    conv_fn: val => val.startsWith('http') ? val : 'http://' + val
},
{
    cmd: "unlink",
    icon: "link-variant-off",
    desc: "링크 삭제"
},
{
    cmd: "removeFormat",
    icon: "format-clear",
    desc: "서식 지우기"
},
{
    cmd: "selectAll",
    icon: "select-all",
    desc: "전체 선택하기"
},
{
    cmd: "undo",
    icon: "undo",
    desc: "되돌리기"
},
{
    cmd: "redo",
    icon: "redo",
    desc: "다시하기"
}];


let lastSelection;
function createTextbox({ value = '' }) {
    return createElement('div', {
        attrs: { contenteditable: true, placeholder: '여기에 텍스트를 입력하세요' },
        on: {
            ondragstart: e => {
                e.preventDefault();
                e.stopPropagation();
            },
            blur: () => {
                let s = window.getSelection();
                lastSelection = {
                    anchorNode: s.anchorNode,
                    anchorOffset: s.anchorOffset,
                    focusNode: s.focusNode,
                    focusOffset: s.focusOffset,
                };
            },
            paste: e => {
                e.preventDefault();
                document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
            }
        },
        innerHTML: value
    });
}

function createTextboxOpt() {
    let frag = createElement('div', { attrs: { class: 'component__execList' } });

    for (let command of commands) {
        let input;
        if (typeof command.cmd == "undefined") frag.append(createElement('span', { attrs: { class: 'separator' } }))
        if (!document.queryCommandSupported(command.cmd)) continue;
        if (typeof command.input !== "undefined") {
            switch (command.input) {
                case 'number':
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'number',
                            min: 12,
                            step: 1
                        },
                        on: {
                            change: e => {
                                if (e != undefined) {
                                    let selection = window.getSelection();
                                    let { anchorNode, anchorOffset, focusNode, focusOffset } = lastSelection;
                                    let range = document.createRange();
                                    range.setStart(anchorNode, anchorOffset);
                                    range.setEnd(focusNode, focusOffset);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, "7");
                                for (let font of document.querySelectorAll('[style*="xxx-large"]')) {
                                    font.style.fontSize = `${input.value / 10}rem` || "2rem";
                                }
                            }
                        },
                        value: 20
                    });
                    let plusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-plus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) + 1;
                                input.onchange();
                            }
                        }
                    });
                    let minusButton = createElement('button', {
                        attrs: {
                            title: command.desc,
                            class: `mdi mdi-minus-thick`
                        },
                        on: {
                            click: () => {
                                input.value = parseInt(input.value) - 1;
                                input.dispatchEvent(new Event('change'));
                            }
                        }
                    });
                    frag.append(plusButton);
                    frag.append(input);
                    frag.append(minusButton);
                    break;
                case 'color':
                    let label = createElement('label', { attrs: { class: 'mdi mdi-format-color-highlight input_color' } });
                    input = createElement('input', {
                        attrs: {
                            title: command.desc,
                            type: 'color'
                        },
                        on: {
                            input: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            },
                            focus: () => {
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, input.value || command.val);
                            }
                        },
                        value: command.val
                    });
                    label.append(input);
                    frag.append(label);
                    break;
            }
        } else {
            frag.append(createElement('button', {
                attrs: {
                    title: command.desc,
                    class: `mdi mdi-${command.icon}`
                },
                on: {
                    click: () => {
                        val = command.val || "";
                        if (command.modal) {
                            return modal(command.modal, src => {
                                val = command.conv_fn(src);
                                document.execCommand("styleWithCSS", 0, true);
                                document.execCommand(command.cmd, false, val || "");
                            });
                        }
                        if (command.prompt) val = command.conv_fn(prompt(command.prompt));
                        document.execCommand("styleWithCSS", 0, true);
                        document.execCommand(command.cmd, false, val || "");
                    }
                }
            }));
        }
    }

    return frag;
}