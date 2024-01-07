let _random = '?' + Math.random();


importScripts('./util/Variables.js' + _random);
importScripts('./util/Animation.js' + _random);
importScripts('./ItemManager.js' + _random);
importScripts('./enemy/BasicEnemy.js' + _random);
importScripts('./enemy/BasicPlay.js' + _random);
importScripts('./enemy/NoWaitPlay.js' + _random);
importScripts('./enemy/FollowPlay.js' + _random);
importScripts('./enemy/PlayManager.js' + _random);






importScripts('./bullet.js' + _random);

importScripts('./storyBoard.js' + _random);





// 3D 좌표를 2D 좌표로 변환하는 함수
const project3Dto2D = (x, y, z) => {
    const focalLength = 500; // 초점 거리
    const scale = focalLength / (focalLength + z);
    const canvasCenterX = rWidth / 2;
    const canvasCenterY = rHeight / 2;

    // 원근법을 적용한 2D 좌표 계산
    const projectedX = x * scale + canvasCenterX;
    const projectedY = y * scale + canvasCenterY;

    return { x: projectedX, y: projectedY };
}

// 삼각 평면을 그리는 함수
const drawTriangle = (vertices, color) => {
    context.beginPath();
    context.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
        context.lineTo(vertices[i].x, vertices[i].y);
    }

    context.closePath();
    context.fillStyle = color;
    context.fill();
}

const get2DtrianglePattern = (x1, x2, y1, y2, h_unit_cnt, margin = 5) => {
    let arr = [];

    let w = x2 - x1;

    let trim_w = w - h_unit_cnt * margin + margin;
    let unit_w = trim_w / h_unit_cnt;
    let unit_h = 1.4 * unit_w;

    let x = x1;
    let y = y1;

    let cnt = 0;

    while (x < x2) {
        y = y1 - unit_h * 0.5 - 5 * cnt * margin;
        while (y < y2) {
            arr.push(new_tri(x, x, x + unit_w, y, y + unit_h, y + unit_h * 0.5));
            arr.push(new_tri(x + unit_w, x + unit_w, x, y + unit_h * 0.5 + margin, y + unit_h * 1.5 + margin, y + unit_h + margin));
            y += unit_h + margin * 2;
        }
        x += unit_w + margin;
    }

    return arr;

    function new_tri(x1, x2, x3, y1, y2, y3) {
        return [
            { x: x1, y: y1, z: get_z(x1, y1) },
            { x: x2, y: y2, z: get_z(x2, y2) },
            { x: x3, y: y3, z: get_z(x3, y3) }
        ]
    }

    function get_z(x, y) {
        let d1 = 0.45;
        let d2 = -0.35;
        return x * d1 + y * d2;
    }
}

let ratio = 0.8;
vectors_3D_tri_pattern = get2DtrianglePattern(-rWidth * ratio, rWidth * ratio, -rHeight * ratio, rHeight * ratio, 7, 0);

for (let idx in vectors_3D_tri_pattern) {

    let shape = vectors_3D_tri_pattern[idx];

    let c = {
        x: (shape[0].x + shape[1].x + shape[2].x) / 3,
        y: (shape[0].y + shape[1].y + shape[2].y) / 3,
        z: (shape[0].z + shape[1].z + shape[2].z) / 3,
    }

    let new_shape = [];

    for(point of shape){
        new_shape.push(
            {
                ...c,
                x_r: (c.x - point.x),
                y_r: (c.y - point.y),
                z_r: (c.z - point.z),
            }
        );
    }

    vectors_3D_tri_pattern[idx] = new_shape;

}
const test = () => {
    let t_length = vectors_3D_tri_pattern.length;
    let t_w = 7;
    let w_center = Math.ceil(t_w / 2);
    let t_h = Math.ceil(t_length / t_w);
    let h_center = Math.ceil(t_h / 2);

    let colors = [
        '#BCFFFF',
        '#F7FFFF',
        '#EEFFFF',
        '#1587F722',
        '#BCFFFF',
        '#F7FFFF',
        '#F7FFFF99',
        '#BCFFFF',
        '#BCFFFF99',
        '#1587F777',
        '#1587F755',
        '#1587F700',
    ]

    let offset = openingIndex / max_openingIndex;

    let str = [];

    for (let idx in vectors_3D_tri_pattern) {

        let shape = vectors_3D_tri_pattern[idx];

        let cnt = parseInt(idx) + 1;

        let w = Math.ceil(cnt / t_h);
        let h = cnt % t_h;
        if(h == 0) h = t_h;

        let w_diff = Math.abs(w - w_center);
        let h_diff = Math.abs(h - h_center);

        let distance = Math.max(w_diff, h_diff);

        str[h - 1] = str[h - 1] == null ? [distance]:[...str[h - 1], distance];

        let color_index = Math.min(Math.max(Math.floor(25 * offset) - distance, 0), colors.length - 1);
        let p = 1 - Math.max(offset - 0.1, 0) * 0.4;

        context.globalAlpha = 0.8;

        drawTriangle([
            project3Dto2D(shape[0].x - shape[0].x_r * p, shape[0].y - shape[0].y_r * p, shape[0].z - shape[0].z_r * p),
            project3Dto2D(shape[1].x - shape[1].x_r * p, shape[1].y - shape[1].y_r * p, shape[1].z - shape[1].z_r * p),
            project3Dto2D(shape[2].x - shape[2].x_r * p, shape[2].y - shape[2].y_r * p, shape[2].z - shape[2].z_r * p)
        ], colors[color_index]);

        if (color_index < colors.length - 1) {
            context.globalAlpha = 0.5;
            context.filter = 'blur(7px)';
            context.globalCompositeOperation = "lighter";

            drawTriangle([
                project3Dto2D(shape[0].x, shape[0].y, shape[0].z),
                project3Dto2D(shape[1].x, shape[1].y, shape[1].z),
                project3Dto2D(shape[2].x, shape[2].y, shape[2].z)
            ], '#1587F7aa');
        }

        context.globalAlpha = 1;
        context.filter = `none`;
        context.globalCompositeOperation = 'source-over';
    }
    let r = '';
    for(let line of str) {
        r += line.join(' ')+'\n';
    }

}


const randomInt = (min, max, random_float = Math.random()) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random_float * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
};

const randomInt2 = (min, max, num = frameIndex) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random(num) * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함

    function random(num) {
        return (cos(num, 1, 1) + cos(num, 2, 7) + cos(num, 3, 2) + cos(num, 4, 8) + cos(num, 5, 9)) / 15;
    }

    function cos(x, max_height = 1, step = 1) {
        return Math.cos(Math.PI * 2 * x / step) * max_height;
    }
}

const isCollisionWithBullet = (arc, bullet) => {
    let top = bullet.y - bullet.r - arc.r;
    if (arc.y < top) {
        return false;
    }

    let left = bullet.x - bullet.r - arc.r;
    let right = bullet.x + bullet.r + arc.r;
    return arc.x >= left && arc.x <= right;
};

const isCollisionArc = (arc1, arc2) => {
    let x = Math.pow(Math.abs(arc1.x - arc2.x), 2);
    let y = Math.pow(Math.abs(arc1.y - arc2.y), 2);
    return Math.sqrt(x + y) <= arc1.r + arc2.r;
};

const isCollisionSector = (sector, point) => {
    let y = sector.y - point.y;
    let x = point.x - sector.x;
    let angle = Math.atan2(y, x);
    let r = x / Math.cos(angle);
    angle = angle / Math.PI;
    if (angle < 0) angle *= -1;
    else angle = 2 - angle;
    if (r < sector.inner_r | r > sector.outer_r | angle < sector.s_angle | angle > sector.e_angle) return false;
    return true;
}

const renderBoom = (fillStyle, x, y, r) => {
    let h = r / 2;
    context.beginPath();
    context.moveTo(x - r, y);
    context.arcTo(x, y, x - h, y + h, r);
    context.arcTo(x, y, x, y + r, r);
    context.arcTo(x, y, x + h, y + h, r);
    context.arcTo(x, y, x + r, y, r);

    context.arcTo(x, y, x + h, y - h, r);
    context.arcTo(x, y, x, y - r, r);
    context.arcTo(x, y, x - h, y - h, r);
    context.arcTo(x, y, x - r, y, r);
    context.fillStyle = fillStyle;
    context.fill();
    context.closePath();
};

const contextScale = () => {
    let ratioX = canvas.width / rWidth;
    let ratioY = canvas.height / rHeight;
    context.scale(ratioX, ratioY);
};

const clear = () => {
    context.clearRect(0, 0, rWidth, rHeight);
};

const drawObject = (namespace, { x, y, r }) => {
    r += 5;
    let aspect_ratio = imageSet[namespace].height / imageSet[namespace].width;
    context.drawImage(imageSet[namespace], x - r, y - (r * aspect_ratio), 2 * r, 2 * r * aspect_ratio);
}

const drawHpGauge = ({ x, y, r }, hp_ratio, color = '#64E9F8') => {
    y -= r;
    let hp_width = Math.floor(hp_ratio * 48);
    context.beginPath();
    context.moveTo(x - 24, y - 17);
    context.lineTo(x + 26, y - 17);
    context.lineTo(x + 24, y - 7);
    context.lineTo(x - 26, y - 7);
    context.lineTo(x - 23, y - 19);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    context.fillStyle = '#51516B';
    context.stroke();
    context.fill();
    context.beginPath();
    context.moveTo(x - 23, y - 16);
    context.lineTo(x - 23 + hp_width, y - 16);
    context.lineTo(x - 25 + hp_width, y - 8);
    context.lineTo(x - 25, y - 8);
    context.lineTo(x - 23, y - 16);
    context.fillStyle = color;
    context.fill();
    context.beginPath();
    context.moveTo(x + 1, y - 16);
    context.lineTo(x - 1, y - 8);
    context.moveTo(x + 13, y - 16);
    context.lineTo(x + 11, y - 8);
    context.moveTo(x - 11, y - 16);
    context.lineTo(x - 13, y - 8);
    context.strokeStyle = '#51516B';
    context.lineWidth = 1;
    context.stroke();
    context.closePath();
}

const drawPixelParticle = (x, y, p) => {
    let w = 2;
    let p2;
    context.beginPath();
    if (p < 0.5) {
        p2 = p * 2;
        context.rect(x - w, y - w, w * 2, w * 2);
        context.rect(x - w * 5, y - w, w * 2, w * 2);
        context.rect(x + w * 3, y - w, w * 2, w * 2);
        context.rect(x - w, y - w * 5, w * 2, w * 2);
        context.rect(x - w, y + w * 3, w * 2, w * 2);
    } else {
        p2 = (1 - p) * 2
        context.rect(x - w * 3, y - w, w * 6, w * 2);
        context.rect(x - w, y - w * 3, w * 2, w * 6);

    }
    context.fillStyle = `rgba(255, 255, 255, ${p2})`;
    context.fill();
    context.closePath();
}

const drawDemage = (x, y, num, p) => {
    context.fillStyle = '#FFDC20';
    context.strokeStyle = '#7D3A00';
    context.lineWidth = 2;

    context.globalAlpha = p * 3;
    context.font = `italic bold 20px main`;
    context.strokeText(num, x + 5 - 5 * p, y - 5 + 5 * p);
    context.fillText(num, x + 5 - 5 * p, y - 5 + 5 * p);
    context.globalAlpha = 1;
}

let pixelCircleStock = {};
const createPixelArtCircle = (r) => {
    if (pixelCircleStock[r]) return pixelCircleStock[r];
    // 캔버스 엘리먼트 가져오기

    let pixels = [];

    function new_pixel(x, y) {
        pixels.find(pixel => pixel.x == x && pixel.y == y) ? null : pixels.push({ x, y });
    }

    // 반지름에 따른 픽셀아트 원 그리기
    for (var angle = 0; angle < 90; angle++) {
        // 라디안으로 변환
        var radians = angle * (Math.PI / 180);
        new_pixel(Math.round(r * Math.cos(radians)), Math.round(r * Math.sin(radians)));
    }

    pixelCircleStock[r] = (cx, cy) => {
        cx -= pixelSize / 2;
        cy -= pixelSize / 2;
        for (let pixel of pixels) {
            let x = pixel.x * pixelSize;
            let y = pixel.y * pixelSize;
            context.rect(cx + x, cy + y, pixelSize, pixelSize);
            context.rect(cx + x, cy - y, pixelSize, pixelSize);
            context.rect(cx - x, cy - y, pixelSize, pixelSize);
            context.rect(cx - x, cy + y, pixelSize, pixelSize);
        }
    }

    return pixelCircleStock[r];
}

const drawPixelArtCircle = (r, width, x, y, color = '#ff00ff', color2 = '#ffffffaa') => {
    let r2 = r;
    context.beginPath();
    while (r2 > r - width) {
        createPixelArtCircle(r2)(x, y);
        r2--;
    }
    context.fillStyle = color2;
    context.fill();
    context.filter = 'blur(3px)';
    context.fillStyle = color;
    context.fill();
    context.filter = 'none';
    context.closePath();
}

const drawPixelFont = (x, y, text = '2P', color = '#88ED5B', fontSize = 22) => {
    context.beginPath()
    context.textAlign = "center";
    context.font = `${fontSize}px pixel`;
    context.lineWidth = 10;
    context.strokeStyle = '#415041';
    context.strokeText(text, x, y);
    context.lineWidth = 5;
    context.strokeStyle = '#000000';
    context.strokeText(text, x, y);
    context.lineWidth = 3;
    context.strokeStyle = '#ffffff';
    context.strokeText(text, x, y);
    context.fillStyle = color;
    context.fillText(text, x, y);
    context.closePath();
}
const drawBoom = (x, y, p) => {
    if (p < 0.75) drawBoomSmoke(x, y, p / 3 * 4);
    if (p > 0.5) drawBoomLight(x, y, (p - 0.5) * 2);

    context.beginPath();
    context.arc(x, y, 35, 0, Math.PI * 2);
    context.globalCompositeOperation = "lighter";
    context.fillStyle = '#FB000055';
    context.filter = `blur(6px)`;
    if (p < 0.25) context.globalAlpha = p * 4;
    context.fill();
    context.closePath();
    context.globalAlpha = 1;
    context.filter = `none`;
    context.globalCompositeOperation = 'source-over';

    if (p < 0.5) {
        let p2 = 1 - p;
        let r = [];
        while (r.length < 6) r.push(random[Math.floor(x + y + 1 + 7 * r.length) % random.length]);
        drawPixelParticle(x + randomInt(r[0]) * p2, y + randomInt(r[1]) * p2, p * 2);
        drawPixelParticle(x + randomInt(r[2]) * p2, y + randomInt(r[3]) * p2, p * 2);
        drawPixelParticle(x + randomInt(r[4]) * p2, y + randomInt(r[5]) * p2, p * 2);

        function randomInt(seed) {
            let v = Math.floor(30 * seed);
            let margin = 20;
            if (seed < 0.5) v = - margin - v;
            else v = margin + v - 15;
            return v;
        }
    }
}
const drawBoomLight = (x, y, p) => {
    context.beginPath();
    if (p < 0.5) {
        p *= 2;
        let r1 = 30;
        let r2 = r1 * (1 - p);
        let offset = r2 * -p / sqrt_2;
        context.arc(x, y, 30, 0, 2 * Math.PI);
        context.arc(x + offset, y + offset, r2, 0, 2 * Math.PI, true);
    } else {
        p -= 0.5;
        context.arc(x, y, 30 * (0.5 - p) * 2, 0, 2 * Math.PI);
    }
    context.fillStyle = '#FFFFFA';
    context.fill();

}
const drawBoomSmoke = (x, y, p) => {
    let p2 = 1 - p;
    x = x - 3 * p2;
    y = y - 3 * p2;
    context.beginPath();
    let arr = [
        { x: -3, y: -7, r: 15 },
        { x: -1, y: 5, r: 15 },
        { x: 12, y: 2, r: 15 },
        { x: -12, y: 17, r: 11 },
        { x: 18, y: 14, r: 11 },
        { x: 9, y: 17, r: 11 },
        { x: 0, y: 19, r: 11 }
    ];
    for (let c of arr) {
        context.arc(x + c.x, y + c.y, c.r, 0, 2 * Math.PI);
    }
    context.fillStyle = '#393939';
    if (p < 0.5) context.globalAlpha = p * 2;
    context.fill();
    context.beginPath();
    for (let c of arr) {
        let r2 = c.r * (0.5 + p / 2);
        let r3 = c.r * p2 / 2;
        let x2 = x + c.x - r3;
        let y2 = y + c.y - r3;
        context.moveTo(x2, y2);
        context.arc(x2, y2, r2, 0, 2 * Math.PI);
    }
    context.fillStyle = '#FBFBAB';
    context.filter = `blur(${Math.floor(3 * p2)}px)`;
    context.fill();
    context.closePath();
    context.globalAlpha = 1;
}

class Player {
    constructor(imageNamespace = 'player_1') {
        this.s = 4;//move step
        this.r = 23;//size of character radius
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
        this.directKey = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.imageNamespace = imageNamespace;
        this.isInputKeyPress = false;
        this.inputKey = undefined;
        this.inputSkill = undefined;
        this.bulletItemList = [new BasicBullet()];
        this.skillList = [
            new hikari_yo(),
            new sector_skill1(),
            new sector_skill2()
        ];
        this.skillList.forEach(this.postSkill);
        this.shuffleSkill(3);
        this.fireTerm = 0;
        this.isLive = true;
        this.isDemaged = false;
        this.hp = this.max_hp = 400;
    };

    init = () => {
        this.hp = this.max_hp;
        this.x = rWidth / 2;
        this.y = rHeight - this.r - 5;
    }

    shuffleSkill = (cnt = 1) => {
        let first_skill = this.skillList.shift();
        this.skillList[this.skillList.length] = first_skill;
        if (cnt > 1) this.shuffleSkill(cnt - 1);
    }

    postSkill = skill => postMessage({
        type: 'skill_set', info: {
            name: skill.name,
            cost: skill.cost,
            image_url: skill.image_url
        }
    });

    onKeyDirectEvent = (eventName, key) => {
        this.directKey[key] = eventName == 'keydown';
    };

    onKeyInputEvent = (eventName, key, skillName) => {
        if (['w', '1', '2', '3'].indexOf(key) == -1) {
            return;
        }
        this.isInputKeyPress = eventName == 'keydown';
        this.inputKey = this.isInputKeyPress ? key : undefined;
        this.inputSkill = skillName;
    };

    calPosition = () => {
        this.moveBody();
        this.fireBullet();
        this.bulletItemList.forEach(bulletItem => bulletItem.calPosition());
    };

    moveBody = () => {
        let { x, y, s, r } = this;
        if (this.directKey.up) this.y = Math.max(y - s, r);
        if (this.directKey.down) this.y = Math.min(y + s, rHeight - r);
        if (this.directKey.left) this.x = Math.max(x - s, r);
        if (this.directKey.right) this.x = Math.min(x + s, rWidth - r);
    };

    fireBullet = () => {
        if (this.fireTerm > 0) {
            this.fireTerm--;
            return;
        }

        if (this.isInputKeyPress && this.inputKey == 'w') {
            this.currentBulletItem().registOne(this.x, this.y - this.r - 0.5);
            this.fireTerm = this.currentBulletItem().fireTerm;
        }

        if (['1', '2', '3'].indexOf(this.inputKey) > -1) {
            if (this.isInputKeyPress) {
                this.skillList.find(skill => skill.name == this.inputSkill).regist(this);
                if (this.skillList[0].name == this.inputSkill) this.shuffleSkill();
                this.postSkill(this.skillList[0]);
                this.isInputKeyPress = false;
                this.inputKey = undefined;
                this.inputSkill = undefined;
            }
        }
    };

    currentBulletItem = () => this.bulletItemList.filter(item => !item.isEmpty())[0];

    addBulletItem = (bullet) => {
        let curBullet = this.currentBulletItem();
        if (bullet.constructor.name == curBullet.constructor.name) {
            curBullet.limit += bullet.limit;
        } else {
            this.bulletItemList.forEach(item => item.limit = 0);
            this.bulletItemList.unshift(bullet);
        }
    };

    judgeCollision = (wave) => {
        let collisionList;
        if (this.isLive && (collisionList = (wave.enemyList || []).filter(e => e.isLive).filter(e => isCollisionArc(e, this))).length > 0) {
            for (let e of collisionList) {
                this.hp -= e.demage;
            }
            this.isLive = this.hp > 0;
        }
    };

    render = () => {
        this.bulletItemList.forEach(bulletItem => bulletItem.render());
        drawObject(this.imageNamespace, this);
        drawHpGauge(this, Math.max(this.hp / this.max_hp, 0), '#BAF649');
        this.skillList.forEach(skill => skill.draw(this));

        this.bulletItemList = this.bulletItemList.filter(bulletItem => !bulletItem.outOfView || !bulletItem.isEmpty());
    };
}

class BgCosmos {
    constructor() {
        this.starList = [];
        this.cloudList = [
            [0.76, 0.82, 0.10],
            [0.60, 0.88, 0.10],
            [0.38, 0.80, 0.10],
            [0.25, 0.87, 0.10],
            [0.8, 0.98, 0.10],
            [-0.11, 0.95, 0.14],
            [0.11, 0.95, 0.10],
            [0.43, 0.91, 0.10],
            [0.43, 0.95, 0.20],
            [0.48, 0.88, 0.10],
            [0.89, 0.69, 0.10],
            [1.04, 0.55, 0.12],
            [0.97, 0.63, 0.10],
            [0.89, 0.88, 0.16]
        ];
        for (let i = 0; i < 50; i++) {
            this.addStar(randomInt(0, rHeight));
        }
    };

    addStar = (y = 0) => {
        this.starList[this.starList.length] = {
            x: randomInt(5, rWidth - 5), y: y, r: randomInt(1, 4) / 2
        };
    };

    calStar = () => {
        if (this.starList.length < 50 && randomInt(0, 100) > 75) {
            this.addStar();
        }

        this.starList = this.starList.map(star => {
            star.y += star.r;
            return star;
        })
            .filter(star => star.y - star.r < rHeight);
    };

    drawStar = (x, y, r) => {
        context.moveTo(x - r, y);
        context.arcTo(x, y, x, y + r, r);
        context.arcTo(x, y, x + r, y, r);
        context.arcTo(x, y, x, y - r, r);
        context.arcTo(x, y, x - r, y, r);
    };

    render = () => {
        this.calStar();
        if (this.starList.length <= 0) {
            return;
        }

        context.beginPath();
        context.lineWidth = 0.7;
        this.starList.forEach(star => {
            this.drawStar(star.x, star.y, star.r);
        });
        context.strokeStyle = '#fff';
        context.fillStyle = '#fff';
        context.stroke();
        context.fill();
        context.closePath();

        let wave_offset = Math.cos(Math.PI * frameIndex / 300) * 5;
        context.beginPath();
        this.cloudList.forEach(cloud => {
            context.arc(cloud[0] * rWidth + wave_offset, cloud[1] * rHeight, cloud[2] * rHeight, 0, 2 * Math.PI);
        });
        context.fillStyle = '#ffffff33';
        context.fill();
        context.closePath();

    }
}


class Viewer {
    initialize = () => {
        this.status = ViewerStatus.opening;
        this.itemManager = new ItemManager();
        this.background = new BgCosmos();
        this.deadDuration = this.deadRemain = 30;
    };

    playing = () => {
        this.score = 0;
        this.story = storyBoard.story.concat();
        this.status = ViewerStatus.playing;
        this.player = new Player('player_2');
        this.onKeyDirectEvent = this.player.onKeyDirectEvent;
        this.onKeyInputEvent = this.player.onKeyInputEvent;
        postMessage({ type: 'start' });
        this.toNextStory();
    };

    pause = () => {
        this.status = ViewerStatus.pause; 
        postMessage({ type: 'pause' });
    }

    opening = () => {
        frameIndex++;
        clear();
        this.background.render();
    };

    guide = () => {
        this.status = ViewerStatus.guide;
        clear();
    };

    ending = () => {
    };

    render = () => {
        clear();
        this.background.render();
        if(openingIndex < max_openingIndex){
            openingIndex++;
            test();
            return;
        }
        frameIndex++;
        this.playManager.render();
        this.player.render();
        this.itemManager.render();

        this.calPosition();
        this.judgeCollisionWithSkill();
        this.judgeCollisionWithBullet();
        this.judgeCollisionWithPlayer();
        this.itemManager.judgeCollision(this.player);
        this.judgeToNext();
    };

    dead = () => {
        this.deadRemain--;
        clear();
        this.background.render();
        this.playManager.render();
        this.itemManager.render();

        drawBoom(this.player.x, this.player.y, this.deadRemain / this.deadDuration);
        if (this.deadRemain < 1) {
            this.status = ViewerStatus.closed;
            postMessage({ type: 'message', position: 'dead', html: `<h1 content="DEFEAT"></h1>`, time: 600 });
        }
    }


    calPosition = () => {
        this.player.calPosition();
        this.playManager.calPosition(this.player);
    };

    toNextStory = () => {
        let story = this.story.shift();
        if (!story) {
            this.status = ViewerStatus.ending;
            return;
        }else{
            openingIndex = 0;
            this.player.init();
        }
        this.playManager = new PlayManager(story);
        this.itemManager.itemRule = story.itemRule;
    };

    judgeToNext = () => {
        if (this.playManager.status == PlayStatus.exit) {
            this.toNextStory();
        }
    };

    judgeCollisionWithPlayer = () => {
        if (!this.playManager.currentWave) {
            return;
        }

        this.player.judgeCollision(this.playManager.currentWave);
        if (!this.player.isLive) {
            this.status = ViewerStatus.dead;
        }
    };

    judgeCollisionWithBullet = () => {
        this.player.bulletItemList.forEach(bulletItem => {
            let result = this.playManager.judgeCollision(bulletItem.bulletList.filter(b => b.status == BulletStatus.fire));
            if (result && result.seqList && result.seqList.length > 0) {
                bulletItem.setupCollision(result.seqList);
                this.addScore(result.score);
            }
        });
    };

    judgeCollisionWithSkill = () => {
        let result = this.playManager.judgeCollisionWithSkill(this.player.skillList.filter(skill => skill.isFire));
        if (result && result.score && result.score > 0) this.addScore(result.score);
    };

    addScore = score => {
        let bScore = this.score, aScore = this.score + score;
        this.score = aScore;
        this.itemManager.changeScore(bScore, aScore);

        postMessage({ type: 'score', score: this.score });
    }
}

const viewer = new Viewer();
const render = time => {
    switch (viewer.status) {
        case ViewerStatus.playing:
            viewer.render(); break;
        case ViewerStatus.opening:
            viewer.opening(); break;
        case ViewerStatus.guide:
            viewer.guide(); break;
        case ViewerStatus.ending:
            viewer.ending(); break;
        case ViewerStatus.dead:
            viewer.dead(); break;
    }
    requestAnimationFrame(render);
};

const getImageBitmap = async (url, flip = false) => await createImageBitmap(await (await fetch(url)).blob(), { imageOrientation: flip ? 'flipY' : 'none' });

const __events = {
    init: async event => {
        canvas = event.data.canvas;
        context = canvas.getContext('2d');
        contextScale();
        imageOptions.forEach(
            async option => {
                imageSet[option.namespace] = await getImageBitmap(option.url, option.flip == true);
            }
        )

        viewer.initialize();
        requestAnimationFrame(render);
    },
    keyDirect: event => {
        let { eventName, key } = event.data;
        (viewer.onKeyDirectEvent || function () { })(eventName, key);
    },
    keyInput: event => {
        let { eventName, key, skillName } = event.data;
        if (key == 'enter') {
            if (eventName == 'keydown') return
            __events.nextEvent(viewer);
        } else {
            (viewer.onKeyInputEvent || function () { })(eventName, key, skillName);
        }
    },
    nextEvent: (viewer) => {
        switch (viewer.status) {
            case ViewerStatus.opening: viewer.playing(); break;
            case ViewerStatus.playing: viewer.pause(); break;
            case ViewerStatus.pause: viewer.status = ViewerStatus.playing; postMessage({ type: 'start' }); break;
        }
    }
};


self.onmessage = event => {
    let type = event.data.type;

    if (!type || !__events[type]) {
        return;
    }

    __events[type](event);
};

postMessage({ type: 'ready' });