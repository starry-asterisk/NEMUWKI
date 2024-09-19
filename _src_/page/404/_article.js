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