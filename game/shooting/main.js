'use strict';
class ShootingGame {
    rootPath;
    worker;
    offscreen;
    container;
    constructor(container, rootPath = '/game/shooting') {
        this.container = container;
        this.rootPath = rootPath;

        let canvas = document.createElement('canvas');
        canvas.setAttribute('height', 600);
        canvas.setAttribute('width', 400);

        this.container.appendChild(canvas);

        this.offscreen = canvas.transferControlToOffscreen();

        this.worker = new Worker(`${this.rootPath}/worker.js?${Math.random()}`);

        this.worker.onmessage = this.onmessage;

        document.addEventListener('keydown', this.onKeyEvent('keydown'), false);
        document.addEventListener('keyup', this.onKeyEvent('keyup'), false);
    }

    onmessage = event => {
        switch (event.data.type) {
            case 'ready':
                this.worker.postMessage({ type: 'init', canvas: this.offscreen, rootPath: this.rootPath }, [this.offscreen]);
                break;
            case 'score':
                document.querySelector('.topMenu__score').innerHTML = event.data.score;
                break;
            case 'message':
                let message_container = document.createElement('div');
                message_container.classList.add(`gameContainer__message_${event.data.position}`);
                message_container.innerHTML = event.data.html;
                this.container.appendChild(message_container);
                setTimeout(() => {
                    message_container.remove();
                }, event.data.time);
            default:
                console.log(event.data);
                break;
        }
    }

    onKeyEvent = eventName => event => {
        switch (event.key) {
            case "Down": // IE/Edge에서 사용되는 값
            case "ArrowDown":
                // "아래 화살표" 키가 눌렸을 때의 동작입니다.
                this.worker.postMessage({ type: 'keyDirect', eventName: eventName, key: 'down' });
                break;
            case "Up": // IE/Edge에서 사용되는 값
            case "ArrowUp":
                // "위 화살표" 키가 눌렸을 때의 동작입니다.
                this.worker.postMessage({ type: 'keyDirect', eventName: eventName, key: 'up' });
                break;
            case "Left": // IE/Edge에서 사용되는 값
            case "ArrowLeft":
                // "왼쪽 화살표" 키가 눌렸을 때의 동작입니다.
                this.worker.postMessage({ type: 'keyDirect', eventName: eventName, key: 'left' });
                break;
            case "Right": // IE/Edge에서 사용되는 값
            case "ArrowRight":
                // "오른쪽 화살표" 키가 눌렸을 때의 동작입니다.
                this.worker.postMessage({ type: 'keyDirect', eventName: eventName, key: 'right' });
                break;
            case "Enter":
                this.worker.postMessage({ type: 'keyInput', eventName: eventName, key: 'enter' });
                // "enter" 또는 "return" 키가 눌렸을 때의 동작입니다.
                break;
            case "w":
            case "W":
                this.worker.postMessage({ type: 'keyInput', eventName: eventName, key: 'w' });
                break;
            case "Esc": // IE/Edge에서 사용되는 값
            case "Escape":
                // "esc" 키가 눌렸을 때의 동작입니다.
                break;
            default:
                return; // 키 이벤트를 처리하지 않는다면 종료합니다.
        }
    }

    break = () => {
        if (typeof worker == 'object') {
            this.worker.terminate();
            this.worker = null;
        }
        for (child of this.container.children) child.remove();
    }
}