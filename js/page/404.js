class asideForm extends asideBase {
    constructor() {
        super();
    }
}
class articleForm extends articleBase {
    constructor() {
        super();
        this.contentBase = FormContent;
        article.append(
            createElement('h1').props({innerHTML: '404 원하시는 페이지를 찾을 수 없습니다.'})
        )
    }

    destroy() {}
}

const FormContent = {
    ...ContentBase
}

export { asideForm as aside, articleForm as article };