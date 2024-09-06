class asideForm extends asideBase {
    constructor() {
        super();
    }
}
class articleForm extends articleBase {
    constructor() {
        super();
        this.contentBase = FormContent;
    }

    destroy() {}
}

const FormContent = {
    ...ContentBase
}

export { asideForm as aside, articleForm as article };