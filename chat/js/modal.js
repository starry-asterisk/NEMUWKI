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
        <div id="nm_toast_container"></div>
        <div id="nm_banner_root"></div>
    `;
    document.body.appendChild(tpl);

    const root = document.getElementById('_app_modal_root');
    const backdrop = document.getElementById('nm_modal_backdrop');
    const modal = document.getElementById('nm_modal');
    const bodyEl = document.getElementById('nm_modal_body');
    const inputEl = document.getElementById('nm_modal_input');
    const actionsEl = document.getElementById('nm_modal_actions');
    const toastContainer = document.getElementById('nm_toast_container');
    const bannerRoot = document.getElementById('nm_banner_root');

    const style = document.createElement('style');
    style.textContent = `
        .nm-modal-backdrop{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9999;}
        .nm-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;min-width:280px;max-width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:16px;z-index:10000}
        .nm-modal-body{font-size:15px;color:#222}
        .nm-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
        .nm-modal-actions button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer}
        .nm-modal-actions button.primary{background:#007aff;color:#fff;border-color:transparent}
        .nm-modal-input input, .nm-modal-input textarea{width:100%;padding:8px;border:1px solid #e5e5e5;border-radius:6px;font-size:0.8em;font-family:inherit;}
        .nm-modal-input input:focus, .nm-modal-input textarea:focus{outline: 2px solid #007aff}
        
        /* Toast 스타일 */
        #nm_toast_container { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 11000; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
        .nm-toast { background: rgba(0, 0, 0, 0.75); color: #fff; padding: 10px 20px; border-radius: 20px; font-size: 14px; animation: nm-toast-in 0.3s forwards, nm-toast-out 0.3s 2.7s forwards; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

        /* Banner 스타일 */
        #nm_banner_root { position: fixed; top: 0; left: 0; width: 100%; z-index: 9000; pointer-events: none; }
        .nm-banner { pointer-events: auto; background: #fff4e5; color: #663c00; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 12px; border-bottom: 1px solid #ffd6a8; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); animation: nm-banner-slide 0.3s ease-out; }
        .nm-banner button { background: #d97706; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .nm-banner.error { background: #fee2e2; color: #991b1b; border-bottom-color: #fecaca; }

        @keyframes nm-toast-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nm-toast-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
        @keyframes nm-banner-slide { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    function showModal({html = '', input=false, buttons = [], defaultValue = ''}){
        return new Promise((resolve) => {
            bodyEl.innerHTML = html;
            inputEl.style.display = input ? '' : 'none';
            if (input) {
                const inp = document.createElement('textarea');
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

    function escapeHtml(text) {
        if (text === undefined || text === null) return '';
        return String(text).replace(/[&<>\"]/g, function(m){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]) || m;
        });
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

    window.Notify.toast = function(message) {
        const toast = document.createElement('div');
        toast.className = 'nm-toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // 3. Banner 추가 (수동으로 닫거나 특정 조건까지 유지)
    // options: { type: 'info'|'error', button: { label: '재연결', onclick: fn } }
    window.Notify.banner = function(message, options = {}) {
        // 기존 배너 제거 (배너는 하나만 띄우는 것이 일반적)
        bannerRoot.innerHTML = '';
        
        const banner = document.createElement('div');
        banner.className = `nm-banner ${options.type || 'info'}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        banner.appendChild(text);

        if (options.button) {
            const btn = document.createElement('button');
            btn.textContent = options.button.label;
            btn.onclick = () => {
                options.button.onclick();
                banner.remove();
            };
            banner.appendChild(btn);
        }

        // 닫기 아이콘/버튼 기본 추가 (선택 사항)
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '✖';
        closeBtn.style.cssText = 'cursor:pointer; opacity:0.7;';
        closeBtn.onclick = () => banner.remove();
        banner.appendChild(closeBtn);

        bannerRoot.appendChild(banner);

        return {
            close: () => banner.remove()
        };
    };
})();
