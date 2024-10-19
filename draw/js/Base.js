/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-19
* Description: personal canvas project for NEMU
*/

import * as Utils from './Utils.js?_=2';
window.Utils = Utils;

class BaseElement extends HTMLElement {
    static _essentialAttrCallbacks = {
        id(newValue, oldValue) {
            this._id = newValue;
            window[newValue] = this;
            if (window[oldValue] == this) window[oldValue] = undefined;
        }
    }
    static _attrCallbacks = {}

    constructor() {
        super();
        this.initId();

        // Shadow DOM 사용 (optional)
        this.attachShadow({ mode: 'open' });

        // 스타일시트 로드 후 콘텐츠 렌더링
        this.postRender(...arguments);
        this.renderContent();
    }

    get id() {
        return this._id;
    }

    postRender() {}

    initId() {
        do {
            this._id = Utils.randomID(this.constructor.name);
        } while (window[this.id]);
        window[this.id] = this;
    }

    static get observedAttributes() {
        return Object.keys({ ...this._attrCallbacks, ...this._essentialAttrCallbacks });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (typeof this.constructor._essentialAttrCallbacks[name] === 'function') {
            this.constructor._essentialAttrCallbacks[name].call(this, newValue, oldValue);
        } else if (typeof this.constructor._attrCallbacks[name] === 'function') {
            this.constructor._attrCallbacks[name].call(this, newValue, oldValue);
        } else {
            console.warn(`UnKnown Attribute ${name} has changed in ${this.id}`);
        }
    }

    connectedCallback() {
        console.log(`${this.id} added to page.`);
        // 추가적인 연결 이벤트 처리 가능
    }

    disconnectedCallback() {
        console.log(`${this.id} removed from page.`);
        // 연결 해제 시 추가 처리
        this.destroy(); // 메모리 누수를 방지하기 위해 destroy 호출
    }

    adoptedCallback() {
        console.log(`${this.id} moved to new page.`);
    }

    // 스타일시트 로드 메서드 (Promise 사용)
    loadStylesheet(styleTag) {
        styleTag.textContent += `
        button, input, select, li {
            cursor: pointer;
        }

        button:disabled {
            opacity: 0.5;
            pointer-events: none;
        }

        .icon {
            font-family:"Material Design Icons";
            font-size: var(--fs-icon);
        }

        icon {
            font-family:"Material Design Icons";
            font-size: 1.6em;
            vertical-align: bottom;
        }

        .icon_text {
            font-family:"Material Design Icons", Arial, sans-serif;
        }
        
        button.icon {
            width: 40px;
            height: 40px;
            padding: 0;
            border: 0;
            background-color: transparent;
            color: white;
        }
            
        ::-webkit-scrollbar {
            width: var(--gap-small);
            height: var(--gap-small);
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #00000044;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #00000077;
        }

        ::-webkit-scrollbar-thumb:active {
            background: #00000088;
        }
            
        input[type="color"] {
            background: transparent;
            border: 0;
            padding: 0;
            width: 40px;
            height: 40px;
        }`;
    }

    // DOM 구조를 생성하고 shadowRoot에 추가
    renderContent() {
        // <style> 태그 생성
        const style = document.createElement('style');
        this.loadStylesheet(style);
        style.textContent += this.stylesheet(this, this.shadowRoot);

        let contents = this.render(this, this.shadowRoot);

        // <div> 콘텐츠 생성
        let contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        if (typeof contents == 'string') contentDiv.innerHTML = contents; // 렌더링 메서드의 결과 삽입
        else contentDiv = contents;

        // Shadow DOM에 추가
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(contentDiv);
    }

    // 컴포넌트 스타일 메서드 (자식 클래스에서 구현)
    stylesheet() {
        return `
            :host {
                display: block;
                font-family: Arial, sans-serif;
            }
        `;
    }

    // 렌더링 메서드 (자식 클래스에서 구현)
    render() {
        return 'Default content. Override in subclasses.';
    }
}
window.BaseElement = BaseElement;

customElements.define('base-element', BaseElement);

export { BaseElement };