class asideDialogWrite extends asideBase {
    constructor() {
        
        super();
        app.blockMode = true;

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

        aside.append(
            this.createBlockList('components', '컴포넌트', ComponentModel),
            createElement('button').props({ innerHTML: '게시하기', onclick: submit }).addClass('f_button').addClass('submit_btn').css({ 'max-width': '23rem', width: '100%' }),
        );
    }
}