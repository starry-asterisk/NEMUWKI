// Simple modal replacements for alert / confirm / prompt
(function(){
    const tpl = document.createElement('div');
    tpl.innerHTML = `
        <div id="_app_modal_root" style="display:none;">
            <div class="nm-modal-backdrop" id="nm_modal_backdrop"></div>
            <div class="nm-modal" id="nm_modal">
                <div class="nm-modal-body" id="nm_modal_body"></div>
                <div class="nm-modal-input" id="nm_modal_input" style="display:none; margin-top:8px;"></div>
                <div class="nm-modal-actions" id="nm_modal_actions"></div>
            </div>
        </div>
    `;
    document.body.appendChild(tpl);

    const root = document.getElementById('_app_modal_root');
    const backdrop = document.getElementById('nm_modal_backdrop');
    const modal = document.getElementById('nm_modal');
    const bodyEl = document.getElementById('nm_modal_body');
    const inputEl = document.getElementById('nm_modal_input');
    const actionsEl = document.getElementById('nm_modal_actions');

    // Basic styles
    const style = document.createElement('style');
    style.textContent = `
        .nm-modal-backdrop{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);}
        .nm-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;min-width:280px;max-width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:16px;z-index:10000}
        .nm-modal-body{font-size:15px;color:#222}
        .nm-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
        .nm-modal-actions button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer}
        .nm-modal-actions button.primary{background:#007aff;color:#fff;border-color:transparent}
        .nm-modal-input input{width:100%;padding:8px;border:1px solid #e5e5e5;border-radius:6px}
    `;
    document.head.appendChild(style);

    function showModal({html = '', input=false, buttons = [], defaultValue = ''}){
        return new Promise((resolve) => {
            bodyEl.innerHTML = html;
            inputEl.style.display = input ? '' : 'none';
            if (input) {
                const inp = document.createElement('input');
                inp.id = 'nm_modal_text_input';
                inp.value = defaultValue;
                inputEl.innerHTML = '';
                inputEl.appendChild(inp);
            } else inputEl.innerHTML = '';
            actionsEl.innerHTML = '';
            buttons.forEach(btn => {
                const b = document.createElement('button');
                b.textContent = btn.label || 'OK';
                if (btn.class) b.className = btn.class;
                b.addEventListener('click', () => {
                    hide();
                    resolve(btn.value);
                });
                actionsEl.appendChild(b);
            });
            root.style.display = '';
            backdrop.style.display = '';
            modal.style.display = '';
            const inp = document.getElementById('nm_modal_text_input');
            if (inp) { inp.focus(); inp.select(); }
        });
    }

    function hide(){
        root.style.display = 'none';
        backdrop.style.display = 'none';
        modal.style.display = 'none';
    }

    window.Notify = window.Notify || {};
    window.Notify.alert = async function(message){
        await showModal({html: `<div>${escapeHtml(message)}</div>`, buttons: [{ label: '확인', value: true, class: 'primary' }]});
        return true;
    }

    window.Notify.confirm = async function(message){
        const res = await showModal({html: `<div>${escapeHtml(message)}</div>`, buttons: [{ label: '취소', value: false },{ label: '확인', value: true, class: 'primary' } ]});
        return !!res;
    }

    window.Notify.prompt = async function(message, defaultValue=''){
        const val = await showModal({html: `<div>${escapeHtml(message)}</div>`, input: true, defaultValue, buttons: [{ label: '취소', value: null },{ label: '확인', value: 'ok', class: 'primary' } ]});
        if (val === null) return null;
        const inp = document.getElementById('nm_modal_text_input');
        return inp ? inp.value : null;
    }

    function escapeHtml(text) {
        if (text === undefined || text === null) return '';
        return String(text).replace(/[&<>\"]/g, function(m){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]) || m;
        });
    }

})();
