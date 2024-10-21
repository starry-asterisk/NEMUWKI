/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-21
* Description: personal canvas project for NEMU
*/

function openDialog(isModal, cb = (frag, root) => { }) {
    let frag = document.createDocumentFragment();
    let dialog = Utils.createElement('dialog');
    cb(frag, dialog);
    dialog.append(frag);
    dialog.appendTo(document.body);
    if(isModal) {
        dialog.showModal();
    } else {
        Utils.createElement('button').addClass('close').props({onclick(){dialog.close();dialog.remove();}}).appendTo(dialog);
        dialog.showModal();
    }
}

export function modalInit() {
    openDialog(false, (frag, root) => {
        Utils.createElement('h3').props({innerHTML:'캔버스 설정'}).appendTo(frag);
        let error;
        let txt_w_container = Utils.createElement('div').addClass('justify').props({innerHTML:'<label>폭 (width)</label>'}).appendTo(frag);
        let txt_w = Utils.createElement('input').attrs({type: 'number', min: 1, step: 1, value: nemu.layerWrap.width}).appendTo(txt_w_container);
        let txt_h_container = Utils.createElement('div').addClass('justify').props({innerHTML:'<label>높이 (height)</label>'}).appendTo(frag);
        let txt_h = Utils.createElement('input').attrs({type: 'number', min: 1, step: 1, value: nemu.layerWrap.height}).appendTo(txt_h_container);
        let btn_container = Utils.createElement('div').addClass('justify').appendTo(frag);
        Utils.createElement('button').addClass('button').props({innerHTML:'취소', onclick(){ root.close();root.remove(); }}).appendTo(btn_container);
        Utils.createElement('button').addClass('button').props({innerHTML:'적용', onclick(){
            if(error) {
                error.remove();
                error = null;
            }
            let w = parseInt(txt_w.value);
            let h = parseInt(txt_h.value);
            if(isNaN(w) || !w) {
                error = Utils.createElement('div').props({innerHTML: '폭을 제대로 입력하세요.'}).css({color: 'red'});
                return btn_container.before(error);
            }
            if(isNaN(h) || !h) {
                error = Utils.createElement('div').props({innerHTML: '높이를 제대로 입력하세요.'}).css({color: 'red'});
                return btn_container.before(error);
            }
            nemu.layerWrap.resizeCanvas(w, h);
            nemu.resetScroll();
            nemu.displaySize(w, h);
            root.close();
            root.remove();
        }}).appendTo(btn_container);
    });
}

export function modalExport() {
    openDialog(false, (frag, root) => {
        Utils.createElement('h3').props({innerHTML:'이미지로 저장'}).appendTo(frag);
        let txt_container = Utils.createElement('div').addClass('justify').props({innerHTML:'<label>파일명</label>'}).appendTo(frag);
        let txt = Utils.createElement('input').attrs({type: 'text'}).appendTo(txt_container);
        let check_container = Utils.createElement('div').addClass('justify').props({innerHTML:'<label>투명 배경 적용</label>'}).appendTo(frag);
        let check = Utils.createElement('input').attrs({type: 'checkbox'}).appendTo(check_container);
        let btn_container = Utils.createElement('div').addClass('justify').appendTo(frag);
        Utils.createElement('button').addClass('button').props({innerHTML:'취소', onclick(){ root.close();root.remove(); }}).appendTo(btn_container);
        Utils.createElement('button').addClass('button').props({innerHTML:'적용', onclick(){
            layerWrap.export(txt.value || undefined, undefined, !check.checked);
            root.close();
            root.remove();
        }}).appendTo(btn_container);
    });
}

