class articleError extends articleBase {
    constructor(params) {
        super();
        this.contentBase = FormContent;
        let error_code = app.now?.split('/').pop() || '404';
        let buttons = createElement('div').css({ 'margin-bottom': 'auto' });
        buttons.append(
            createElement('button').addClass('s_button').props({ innerHTML: '메인으로', onclick() { move('/') } }),
            createElement('button').addClass('s_button').props({ innerHTML: '이전 페이지로', onclick() { history.back(2); } })
        );
        document.title = `오류 - ${error_code}`;
        article.append(
            createElement('n-error-code').attrs({ 'data-code': error_code }).props({ innerHTML: error_code }),
            createElement('div').props({ innerHTML: `URL - ${params.get('url') || ''}` }),
            createElement('n-error').props({ innerHTML: params.get('message') || '존재하지 않는 페이지 입니다.' }),
            buttons
        )
    }

    destroy() { }
}