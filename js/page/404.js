/**
 * Project: nemuwiki.com
 * Version: 2.3.1
 * Author: NEMUWIKI.com
 * Date: 2024-09-19
 * Description: NEMUWIKI Wiki project, SPA style, MDI includes
 */

class asideForm extends asideBase {
    constructor() {
        super();
    }
}

class articleForm extends articleBase {
    constructor() {
        super();
        this.contentBase = FormContent;
        document.title = `${TEXTS.sitename} :: 오류 - 404`;
        article.append(
            createElement('h1').props({innerHTML: '404 원하시는 페이지를 찾을 수 없습니다.'})
        )
    }

    destroy() {}
}

const FormContent = {...ContentBase}
export { asideForm as aside, articleForm as article };