class Mob {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        // 몸통의 반지름입니다.
        this.r = 28;
        // 몸통을 그릴 X좌표
        this.x = 100;
        // 몸통을 그릴 Y좌표
        this.y = 100;
    };
    
    // 실제 몸과 눈을 그릴 함수입니다.
    render = () => {
        // 몸통그리기 
        this.drawBody();
        // 눈 그리기
        this.drawEyes();
    };
    
    drawBody = () => {
        // 선을 그리기 시작합니다.
        this.context.beginPath();
        // arc 함수는 원을 그립니다. 각 인자값의 의미는 다음과 같습니다.
        // 호의 x좌표, 호의 y좌표, 호의 반지름, 호의 시작 앵글, 호의 종료 앵글, 원을 그릴 방향
        // 이때 앵글값은 360도 각도가 아닌 라디안값을 사용합니다.
        this.context.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
        // 원의 색을 설정하고 채웁니다.
        // fill함수 호출시 자동으로 선의 시작/종료 지점이 이어집니다.
        this.context.fillStyle = '#5FAA23';
        this.context.fill();
        // 몸통의 외곽선을 그립니다.
        this.context.strokeStyle = "rgba(0, 0, 255, 0.5)";
        this.context.stroke();
        // 선 그리기를 종료합니다.
        this.context.closePath();
    };
    
    drawEyes = () => {
        let { x, y } = this;
        this.context.beginPath();
        this.context.arc(x-13, y-10, 7, 0, Math.PI*2, false);
        this.context.arc(x+13, y-10, 7, 0, Math.PI*2, false);
        this.context.fillStyle = '#b4ddfc';
        this.context.fill();


        this.context.beginPath();
        this.context.arc(x-11, y-13, 2, 0, Math.PI*2, false);
        this.context.arc(x+11, y-13, 2, 0, Math.PI*2, false);
        this.context.fillStyle = '#200e09';
        this.context.fill();

    };

}
/*
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let x = 25, y = 25, r = 25;

let render = () => {
	// 원을 그리기전 캔버스 전체를 지워줍니다.
	context.clearRect(0, 0, canvas.width, canvas.height);
  // 원을 그립니다.
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2, false);
  context.fillStyle = '#2E2225';
  context.fill();
  context.closePath();
  // 다음 render시 그릴 원의 위치를 계산합니다.
  x += 3;
  if (x+r > canvas.width) {
  	x = 25;
    y += 20;
    if (y + r > canvas.height) {
    	y = 25;
    }
  }
  // 다음 프레임에 다시 render 함수를 실행하도록 설정합니다.
  requestAnimationFrame(render);
};

render();*/



class Game {
    _container = null;
    constructor(){
        this._container = document.querySelector('.gameContainer');
        let lizard = new Mob(this._container);
        lizard.render();
    }
}