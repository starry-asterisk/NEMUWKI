/**
* Project: draw.io
* Version: 0.0.1 | development
* Author: @NEMUWIKI
* Date: 2024-10-19
* Description: personal canvas project for NEMU
*/

let $TAG_PREFIX = 'nemu';

function createNewWindow(winId, buildFn, styleObj = {}) {
    let win = Utils.createElement(`${$TAG_PREFIX}-window`).css(styleObj);
    let root = win.shadowRoot;

    if (!nemu._windows[winId]) nemu._windows[winId] = {};
    nemu._windows[winId].el = win;

    buildFn.call(win, root);

    return win;
}

function toolsWindow() {
    function toggleMode(newMode) {
        let oldMode = nemu.layerWrap.dataset.mode;

        nemu.layerWrap.dataset.mode = oldMode == newMode ? null : newMode;
    }
    return createNewWindow('tools', (root) => {
        Utils.createIconBtn('\u{F0328}').appendTo(root).props({
            onclick() {
                nemu.toggleWindow('layers', nemu.isOpened('layers'));
            }
        });
        Utils.createIconBtn('\u{F00E3}').appendTo(root).props({
            onclick() {
                let toggle = nemu.isOpened('brusheSetting');
                nemu.toggleWindow('brusheSetting', toggle);
                nemu.toggleWindow('brushes', toggle);
                nemu.toggleWindow('erasers', toggle);
            }
        });
        Utils.createIconBtn('\u{F0E46}').appendTo(root).props({
            onclick() { toggleMode('drag'); }
        });
        Utils.createIconBtn('\u{F099B}').appendTo(root).props({
            onclick() { 
                nemu.layerWrap.rotate(false); 
                nemu.layerWrap.applyTrans(); 
                nemu.displayScale(nemu.layerWrap.scale);
            }
        });
        Utils.createIconBtn('\u{F0453}').appendTo(root).props({
            onclick() { 
                nemu.layerWrap.rotate(true); 
                nemu.layerWrap.applyTrans(); 
                nemu.displayRotate(nemu.layerWrap._rotation);

            }
        });

        Utils.createIconBtn('\u{F18F4}').appendTo(root).props({
            onclick() {
                nemu.layerWrap.scale = 1;
                nemu.layerWrap.rotation = 0;
                nemu.layerWrap._rotation = 0;
                nemu.layerWrap.applyTrans();
                nemu.displayScale(1);
                nemu.displayRotate(0);
                nemu.layerWrap.scrollIntoView({ block:'center', inline:'center' });
            }
        });
        Utils.createIconBtn('\u{F034B}').appendTo(root).props({
            onclick() { 
                nemu.layerWrap.zoom(true); 
                nemu.layerWrap.applyTrans();
                nemu.displayScale(nemu.layerWrap.scale);
             }
        });
        Utils.createIconBtn('\u{F034A}').appendTo(root).props({
            onclick() { 
                nemu.layerWrap.zoom(false); 
                nemu.layerWrap.applyTrans();
                nemu.displayScale(nemu.layerWrap.scale);
             }
        });
        let undo_btn = Utils.createIconBtn('\u{F054D}').appendTo(root).props({
            disabled: true,
            onclick() { nemu.layerWrap.undo() }
        });
        let redo_btn = Utils.createIconBtn('\u{F044F}').appendTo(root).props({
            disabled: true,
            onclick() { nemu.layerWrap.redo() }
        });
        Utils.createIconBtn('\u{F0207}').appendTo(root).props({
            onclick() { layerWrap.export(); }
        });
        Utils.createElement('input').attrs({ type: 'color' }).props({
            onchange() {
                layerWrap.brushColor = parseColor(this.value);
            }
        }).appendTo(root);

        nemu.onHistoryChange = ({ undoable, redoable }) => {
            undo_btn.disabled = !undoable;
            redo_btn.disabled = !redoable;
        };
    }, {
        flex: 20,
        width: '82px'
    });
}

function brushSettingWindow() {
    return createNewWindow('brusheSetting', (root) => {
        let selected_pen, useMinOpacity, useMinSize;
        let opacity_input = Utils.createSlider('불투명도', '%').props({
            onchange(v) {
                selected_pen.opacity = v / 100;
                if (!useMinOpacity) {
                    selected_pen.minOpacity = selected_pen.opacity;
                    min_opacity_input.value = v;
                }
                parseInt(min_opacity_input.value) > parseInt(v) && (min_opacity_input.value = v);
            }
        }).appendTo(root);
        let min_opacity_input = Utils.createSlider('최소', '%').props({
            onchange(v) {
                console.log(v, min_opacity_input.value, opacity_input.value);
                selected_pen.minOpacity = v / 100;
                parseInt(v) > parseInt(opacity_input.value) && (min_opacity_input.value = opacity_input.value);
            }
        }).appendTo(root);
        let size_input = Utils.createSlider('크기', 'px', 1, 300).props({
            onchange(v) {
                selected_pen.size = Math.round(v / 2);
                if (!useMinSize) {
                    selected_pen.minSize = selected_pen.size;
                    min_size_input.value = v;
                }
                parseInt(min_size_input.value) > parseInt(v) && (min_size_input.value = v);
            }
        }).appendTo(root);
        let min_size_input = Utils.createSlider('최소', 'px', 1, 300).props({
            onchange(v) {
                selected_pen.minSize = Math.round(v / 2);
                parseInt(v) > parseInt(size_input.value) && (min_size_input.value = size_input.value);
            }
        }).appendTo(root);

        nemu.displayBrush = (pen, use_min_opacity, use_min_size) => {
            useMinOpacity = use_min_opacity, useMinSize = use_min_size;
            selected_pen = pen;

            opacity_input.value = parseInt(pen.opacity * 100);
            min_opacity_input.value = parseInt(pen.minOpacity * 100);
            size_input.value = parseInt(pen.size * 2);
            min_size_input.value = parseInt(pen.minSize * 2);

            min_opacity_input.css({ display: useMinOpacity ? 'grid' : 'none' });
            min_size_input.css({ display: useMinSize ? 'grid' : 'none' });
        }
    }, {
        flex: 5,
        width: '200px',
        'min-height': 'fit-content',
    });

}

function createBrushIem(item) {
    return Utils.createElement('li').addClass('brush-item').props({
        innerHTML: `${item.text}`,
        onclick() {
            layerWrap.pen = item.pen;
            nemu.displayBrush(item.pen, item.useOpacityMin, item.useSizeMin);
            for (let li of nemu.pens) li.removeClass('focus');
            this.addClass('focus');
        },
        item
    })
}

function brushesWindow() {
    nemu.pens = [];
    const items = [
        {
            text: '기본 펜 (필압 적용 X)',
            pen: new BaseBrush(5, 5, 1, 1),
            useOpacityMin: false,
            useSizeMin: false,
        },
        {
            text: '기본 펜 (선 두께)',
            pen: new BaseBrush(10, 2, 1, 1),
            useOpacityMin: false,
            useSizeMin: true,
        },
        {
            text: '기본 펜 (투명도)',
            pen: new BaseBrush(15, 15, 1, 0),
            useOpacityMin: true,
            useSizeMin: false,
        },
        {
            text: '기본 펜 (필압 O)',
            pen: new BaseBrush(20, 10, 0.7, 0.35),
            useOpacityMin: true,
            useSizeMin: true,
        },
        {
            text: '에어 브러시',
            pen: new AirBrush(30, 9, 1, 0.5),
            useOpacityMin: true,
            useSizeMin: true,
        },
    ];
    return createNewWindow('brushes', (root) => {
        let ul = Utils.createElement('ul').addClass('brush-list').appendTo(root);
        for (let item of items) {
            let li = createBrushIem(item).appendTo(ul);
            nemu.pens.push(li);
        }
    }, {
        flex: 20,
        width: '200px'
    });
}

function erasersWindow() {
    const items = [
        {
            text: '지우개',
            pen: new EraseBrush(25, 8, 1, 0.5),
            useOpacityMin: true,
            useSizeMin: true,
        },
        {
            text: '하드 지우개',
            pen: new HardEraseBrush(25, 8, 1, 1),
            useOpacityMin: false,
            useSizeMin: false,
        }
    ];
    return createNewWindow('erasers', (root) => {
        let ul = Utils.createElement('ul').addClass('brush-list').appendTo(root);
        for (let item of items) {
            let li = createBrushIem(item).appendTo(ul);
            nemu.pens.push(li);
        }
    }, {
        flex: 20,
        width: '200px'
    });
}

function layersWindow() {
    let cnt = 0;
    let ul, mode_select, opacity_input;
    nemu.focusLayer = function (layer) {
        nemu.layerWrap.focusedLayer?.li?.removeClass('focus');
        nemu.layerWrap.focusedLayer = layer;
        layer.li.addClass('focus');
        mode_select.value = layer.blendMode;
        opacity_input.value = parseInt(layer.opacity * 100);
    }
    nemu.registLayer = function (old_layer, index, isFocus = true, icon = '\u{F01DE}') {
        if (old_layer.li) return;
        old_layer.icon = old_layer.icon || icon;
        old_layer.name = old_layer.name || `레이어 ${cnt++}`;
        old_layer.li = Utils.createElement('li').addClass('layer-item');
        old_layer.li.props({ onclick() { nemu.focusLayer(old_layer); } });
        Utils.createIconBtn('\u{F0208}').props({
            onclick(e) {
                e.preventDefault();
                e.stopPropagation();
                old_layer.visibility = !old_layer.visibility
                this.innerHTML = old_layer.visibility ? '\u{F0208}' : '\u{F0209}';
            }
        }).appendTo(old_layer.li);
        Utils.createElement('span').props({ innerHTML: `${old_layer.icon}` }).addClass('icon').appendTo(old_layer.li);
        let name_span = Utils.createElement('span').props({ innerHTML: `${old_layer.name}` }).appendTo(old_layer.li);
        old_layer.setName = text => {
            old_layer.name = text;
            name_span.props({ innerHTML: text });
        }
        if (index !== undefined) ul.children[index].after(old_layer.li);
        else old_layer.li.appendTo(ul);
        if (isFocus) nemu.focusLayer(old_layer);
    }
    nemu.registForeignLayer = function (clientId) {
        let index = nemu.layerWrap.getFocusedIndex();
        let new_layer = nemu.layerWrap.addLayer(index + 1, clientId);
        new_layer.name = `다른 사용자 ${clientId}`;
        new_layer.editable = false;
        nemu.registLayer(new_layer, index, false, '\u{F0011}');
        return new_layer;
    }
    nemu.drawForeign = function (layer, img, data) {
        if (layer) {
            layer.ctx.clearRect(data.minX, data.minY, data.w, data.h);
            layer.ctx.drawImage(img, 0, 0, data.w, data.h, data.minX, data.minY, data.w, data.h);
        }
    }
    nemu.removeLayer = function (old_layer, isHistory) {
        if (nemu.layers.length < 2) return;
        let index = nemu.layerWrap.getFocusedIndex();
        old_layer.li.remove();
        old_layer.li = null;
        nemu.layerWrap.removeLayer(old_layer, isHistory);
        nemu.focusLayer(nemu.layers[index] || nemu.layers[nemu.layers.length - 1]);
    }
    nemu.addLayer = function () {
        let index = nemu.layerWrap.getFocusedIndex();
        let new_layer = nemu.layerWrap.addLayer(index + 1);
        nemu.registLayer(new_layer, index);
    }
    return createNewWindow('layers', (root) => {
        Utils.createIconBtn('\u{F0E4D}').appendTo(root).props({ onclick() { nemu.addLayer(); } }).appendTo(root);
        Utils.createIconBtn('\u{F0E4E}').appendTo(root).props({ onclick() { nemu.removeLayer(nemu.layerElement); } }).appendTo(root);
        mode_select = Utils.createElement('select').css({ display: 'block' }).props({ onchange() { nemu.layerElement.applyBlend(this.value); }, value: blendModes[0].type }).appendTo(root);
        blendModes.filter(mode => mode.use !== false).forEach(mode => Utils.createElement('option').props({ innerHTML: mode.name }).attrs({ value: mode.type }).appendTo(mode_select));
        opacity_input = Utils.createSlider('불투명도', '%').props({ oninput(v) { nemu.layerElement.applyOpacity(v / 100); } }).appendTo(root);
        ul = Utils.createElement('ul').addClass('layer-list').appendTo(root);
    }, {
        flex: 20,
        width: '200px'
    });
}

function canvasWindow() {
    const wrap = new LayerWrapElement();
    const _layerElementDescriptor = { get() { return wrap.focusedLayer; } };

    Object.defineProperty(nemu, 'layerElement', _layerElementDescriptor);
    Object.defineProperty(window, 'layerElement', _layerElementDescriptor);

    nemu.layers = wrap.layers;
    nemu.layerWrap = wrap;
    window.layerWrap = wrap;

    return wrap;
}

const _brushCache = {}; // 브러쉬 모양에 대한 캐시
const _DistanceCache = {}; // 픽셀 간 거리 계산 캐시

class BaseBrush {
    constructor(size, minSize = 1, opacity = 1, minOpacity = 1) {
        this.size = size; // 브러쉬 크기
        this.minSize = minSize; // 최소 크기
        this.maxSize = 300; // 최대 크기
        this.opacity = opacity; // 투명도
        this.minOpacity = minOpacity; // 최소 투명도
    }

    get layerData() { return layerElement.layerData; /* 포커싱된 레이어 */}

    // 브러쉬로 그리는 메소드
    paint(x, y, pressure) {
        let distance, diff_x, diff_y, dy, dx, point;
        let _layerData = this.layerData;
        let yMin = Math.max(Math.min(y - this.size, _layerData.width), 0), // 최소 y 범위
            yMax = Math.max(Math.min(y + this.size, _layerData.height), 0); // 최대 y 범위
        let xMin = Math.max(Math.min(x - this.size, _layerData.width), 0), // 최소 x 범위
            xMax = Math.max(Math.min(x + this.size, _layerData.width), 0); // 최대 x 범위
        let calcPressure = pressure * (this.opacity - this.minOpacity) + this.minOpacity; // 압력 계산
        let maxDistance = Math.floor(this.getMaxDistance(pressure)); // 최대 거리 계산
        let chacheName = `B_${this.constructor.name}${maxDistance}`; // 캐시 키 이름 설정

        if (!_brushCache[chacheName]) {
            // 브러쉬 캐시에 해당 모양이 없으면 생성
            _brushCache[chacheName] = [];
            for (dy = yMin; dy < yMax; dy++) {
                diff_y = dy - y;
                for (dx = xMin; dx < xMax; dx++) {
                    diff_x = dx - x;
                    distance = this.calcDistance(diff_x, diff_y); // 거리 계산
                    if (this.shape(distance, maxDistance)) {
                        // 모양이 맞으면 캐시에 추가
                        _brushCache[chacheName].push({
                            distance, diff_x, diff_y
                        });
                        this.processPixel(dx, dy, calcPressure, distance, maxDistance); // 픽셀 처리
                    }
                }
            }
        } else {
            // 캐시된 브러쉬 모양 사용
            for (point of _brushCache[chacheName]) {
                let dx = point.diff_x + x, dy = point.diff_y + y;
                if (xMin > dx || dx > xMax || yMin > dy || dy > yMax) continue; // 범위 밖이면 무시
                this.processPixel(dx, dy, calcPressure, point.distance, maxDistance); // 캐시된 거리로 처리
            }
        }

        _layerData.setMinMax(xMin, yMin, xMax, yMax);
    }

    // 두 점 사이를 이어서 그리기
    paintPointToPoint(x1, y1, pressure1, x2, y2, pressure2) {
        if (x1 === undefined) return this.paint(x2, y2, pressure2); // 시작점이 없으면 바로 그리기
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); // 두 점 사이 거리 계산
        const steps = Math.ceil(distance); // 필요한 스텝 수 계산

        for (let i = 0; i <= steps; i++) {
            const t = i / steps; // 보간 비율
            const intermediateX = Math.round(x1 + (x2 - x1) * t); // 중간 x 좌표
            const intermediateY = Math.round(y1 + (y2 - y1) * t); // 중간 y 좌표
            const interpolatedPressure = pressure1 + (pressure2 - pressure1) * t; // 압력 보간
            this.paint(intermediateX, intermediateY, interpolatedPressure); // 각 중간점에 대해 그리기
        }
    }

    // 브러쉬 색상 처리 로직
    processColor(brushData, orgData) {
        return blendColorsWithAlpha(brushData, orgData); // 기존 색상과 새로운 색상을 혼합
    }

    // 기존 압력과 새로운 압력을 반영한 최종 압력을 결정한다.
    processPressure(oldP, newP) {
        return Math.max(oldP, newP);
    }

    // 각 픽셀을 처리하는 로직
    processPixel(x, y, calcPressure, distance, maxDistance) {
        const _layerData = this.layerData;
        const orgData = _layerData.getOrgData(x, y); // 원래의 픽셀 데이터
        const pressure = this.processPressure(_layerData.getPressure(x, y), this.smooth(calcPressure, distance, maxDistance)); // 압력 계산
        this.color[3] = parseInt(pressure * 255);
        const newData = this.processColor(this.color, orgData); // 새 데이터 생성
        _layerData.setData(x, y, ...newData); // 레이어에 데이터 설정
        _layerData.setPressure(x, y, pressure); // 레이어에 압력 설정
    }

    // 브러쉬 모양 정의 (거리와 최대 거리 비교)
    shape(distance, maxDistance) {
        return Math.round(distance) <= maxDistance;
    }

    // 압력을 계산할 때 부드럽게 처리하는 메소드 (기본적으로 그대로 반환)
    smooth(calcPressure, distance, maxDistance) {
        return calcPressure;
    }

    getMaxDistance(pressure) {
        // 압력에 따른 브러쉬 크기 계산
        return (this.size - this.minSize) * pressure + this.minSize;
    }

    // 거리 계산을 캐싱하여 중복 계산 방지
    calcDistance(diff_x, diff_y) {
        let key = `${diff_x},${diff_y}`;
        return _DistanceCache[key] || (_DistanceCache[key] = Math.sqrt(diff_x ** 2 + diff_y ** 2));
    }

    // 브러쉬로 그린 후 캔버스에 반영
    draw(ctx, x, y, pressure, prev_x, prev_y, prev_pressure) {
        if (prev_x === false) {
            // 첫 점일 때
            this.paint(x, y, pressure);
            prev_x = x, prev_y = y, prev_pressure = pressure;
        } else this.paintPointToPoint(prev_x, prev_y, prev_pressure, x, y, pressure); // 이전 점과 이어서 그리기

        const _layerData = this.layerData;
        const minX = Math.min(prev_x, x) - this.size;
        const minY = Math.min(prev_y, y) - this.size;
        const maxX = Math.max(prev_x, x) + this.size;
        const maxY = Math.max(prev_y, y) + this.size;
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        const imageData = new ImageData(_layerData.getDatas(), _layerData.width, _layerData.height); // 그린 영역의 이미지 데이터를 생성

        // 캔버스에 이미지 데이터 그리기
        ctx.putImageData(imageData, 0, 0, minX, minY, width, height);

        return { minX, minY, width, height };
    }

    // 그리기 시작 시 레이어 초기화
    startDraw() {
        this.color = layerWrap.brushColor; // 브러쉬 색상 설정
        this.layerData.startModify(); // 레이어 수정 시작
    }

    // 그리기 종료 시 처리
    endDraw() {
        this.color = undefined;
        return this.layerData.endModify(true); // 레이어 수정 종료
    }
}

// AirBrush 클래스 - BaseBrush를 상속하고 압력에 따른 부드러움 처리 로직이 추가됨
class AirBrush extends BaseBrush {
    smooth(calcPressure, distance, maxDistance) {
        return calcPressure * SmoothUtils.custom(1 - distance / maxDistance); // 거리와 최대 거리에 따른 부드럽게 처리
    }

    processPressure(oldP, newP) {
        return Math.min(1, 1 - (1 - oldP) * (1 - newP));
    }
}

// EraseBrush 클래스 - BaseBrush를 상속하고 색상 처리 로직이 변경됨
class EraseBrush extends BaseBrush {
    processColor(brushData, orgData) {
        // 기존 색상에서 투명도를 줄이는 방식으로 지우기
        return [orgData[0], orgData[1], orgData[2], Math.max(0, orgData[3] - brushData[3])];
    }
}

// HardEraseBrush 클래스 - BaseBrush를 상속하고 색상 처리 로직이 변경됨
class HardEraseBrush extends BaseBrush {
    processColor(brushData, orgData) {
        // 기존 색상에서 투명도를 줄이는 방식으로 지우기
        return [orgData[0], orgData[1], orgData[2], 0];
    }
}

class SmoothUtils {
    // 선형 보간
    static linear(t) {
        return t; // t는 0에서 1 사이의 값
    }

    // ease-in 보간
    static easeIn(t) {
        return t * t; // t^2
    }

    // ease-out 보간
    static easeOut(t) {
        return t * (2 - t); // t * (2 - t)
    }

    // ease-in-out 보간
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // t < 0.5 ? 2t^2 : -1 + (4 - 2t)t
    }

    // cubic ease-in 보간
    static easeInCubic(t) {
        return t * t * t; // t^3
    }

    // cubic ease-out 보간
    static easeOutCubic(t) {
        return (t - 1) * (t - 1) * (t - 1) + 1; // (t-1)^3 + 1
    }

    // cubic ease-in-out 보간
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (4 * t - 4) + 1; // t < 0.5 ? 4t^3 : (t-1)(4t - 4) + 1
    }

    // 비선형 보간 (예: sine)
    static easeInSine(t) {
        return 1 - Math.cos((t * Math.PI) / 2); // 1 - cos(t * π / 2)
    }

    static easeOutSine(t) {
        return Math.sin((t * Math.PI) / 2); // sin(t * π / 2)
    }

    static easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2; // - (cos(πt) - 1) / 2
    }

    // quadratic ease-in
    static easeInQuad(t) {
        return t * t; // t^2
    }

    // quadratic ease-out
    static easeOutQuad(t) {
        return t * (2 - t); // t(2 - t)
    }

    // quadratic ease-in-out
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // t < 0.5 ? 2t^2 : -1 + (4 - 2t)t
    }

    // 사용자 정의
    static custom(t) {    
        return this.easeInOutQuad(t); // t < 0.5 ? 2t^2 : -1 + (4 - 2t)t
    }
}

// 3. 수채화 (Watercolor)

// 5. 손가락 (Finger) - 수정됨

// 6. 블러 (Blur) - 수정됨

// 7. 비트맵 브러쉬 (BitmapBrush)

let blendModes = [
    { name: '보통', type: "normal", flavor: "기본 설정으로, 새로운 도형이 원래 도형 위에 그려집니다." },
    { name: '', use: false, type: "source-over", flavor: "기본 설정으로, 새로운 도형이 원래 도형 위에 그려집니다." },
    { name: '', use: false, type: "source-in", flavor: "새로운 도형이 원래 도형과 겹치는 부분에만 그려지며, 나머지는 투명하게 설정됩니다." },
    { name: '', use: false, type: "source-out", flavor: "새로운 도형이 원래 도형과 겹치지 않는 부분에만 그려집니다." },
    { name: '', use: false, type: "source-atop", flavor: "새로운 도형이 원래 도형과 겹치는 부분에만 그려집니다." },
    { name: '', use: false, type: "destination-over", flavor: "새로운 도형이 원래 도형 아래에 그려집니다." },
    { name: '', use: false, type: "destination-in", flavor: "원래 도형 중 새로운 도형과 겹치는 부분이 유지되며, 나머지는 투명하게 설정됩니다." },
    { name: '', use: false, type: "destination-out", flavor: "원래 도형 중 새로운 도형과 겹치지 않는 부분이 유지됩니다." },
    { name: '', use: false, type: "destination-atop", flavor: "원래 도형 중 새로운 도형과 겹치는 부분만 유지됩니다. 새로운 도형은 원래 도형 아래에 그려집니다." },
    { name: '', use: false, type: "lighter", flavor: "두 도형이 겹치는 곳의 색상이 두 색상값을 합한 값으로 결정됩니다." },
    { name: '', use: false, type: "copy", flavor: "새로운 도형만 그려집니다." },
    { name: '', use: false, type: "xor", flavor: "두 도형이 겹치는 곳이 투명하게 변하며, 나머지는 평범하게 그려집니다." },
    { name: '곱셈', type: "multiply", flavor: "위쪽 레이어의 픽셀값이 아래쪽 레이어의 해당하는 픽셀값과 곱해지며, 결과적으로 어두운 이미지가 생성됩니다." },
    { name: '스크린', type: "screen", flavor: "픽셀값을 뒤집고 곱한 다음 도로 뒤집습니다. 결과적으로 밝은 이미지가 생성됩니다(multiply의 반대)." },
    { name: '오버레이', type: "overlay", flavor: "multiply와 screen의 조합입니다. 아래쪽 레이어의 어두운 부분은 더 어두워지고, 밝은 부분은 더 밝아집니다." },
    { name: '비교 (암)', type: "darken", flavor: "두 레이어 중 어두운 픽셀값을 취합니다." },
    { name: '비교 (명)', type: "lighten", flavor: "두 레이어 중 밝은 픽셀값을 취합니다." },
    { name: '닷지', type: "color-dodge", flavor: "아래쪽 레이어의 픽셀값을 위쪽 레이어의 뒤집힌 픽셀값으로 나눕니다." },
    { name: '번', type: "color-burn", flavor: "아래쪽 레이어의 뒤집힌 픽셀값을 위쪽 레이어의 픽셀값으로 나누고, 그 값을 도로 뒤집습니다." },
    { name: '하드 라이트', type: "hard-light", flavor: "overlay와 같이 multiply와 screen의 조합이지만, 위아래 레이어의 순서가 바뀐 상태입니다." },
    { name: '소프트 라이트', type: "soft-light", flavor: "조금 더 부드러운 hard-light입니다. 완전한 검은색/흰색에서 무조건 완전한 검은색/흰색이 나오지 않습니다." },
    { name: '빼기', type: "difference", flavor: "한쪽 레이어의 픽셀값에서 다른 쪽 레이어의 픽셀값을 뺍니다. 빼는 순서는 결과값이 양수가 나오는 순서입니다." },
    { name: '나누기', type: "exclusion", flavor: "difference와 비슷하지만 대비가 덜합니다." },
    { name: '색상', type: "hue", flavor: "아래쪽 레이어의 채도(chroma)와 명도(luma)를 보존하고 위쪽 레이어의 색상(hue)을 적용합니다." },
    { name: '채도', type: "saturation", flavor: "아래쪽 레이어의 색상과 명도를 보존하고 위쪽 레이어의 채도를 적용합니다." },
    { name: '컬러', type: "color", flavor: "아래쪽 레이어의 명도를 보존하고 위쪽 레이어의 색상과 채도를 적용합니다." },
    { name: '휘도', type: "luminosity", flavor: "아래쪽 레이어의 색상과 채도를 보존하고 위쪽 레이어의 명도를 적용합니다." },
]


class LayerElement extends BaseElement {

    // 스타일시트 반환
    stylesheet() {
        return `
        :host {
            display:block;
        }
        canvas {
            display: block;
            touch-action: none;
        }
        `;
    }

    // 렌더링 후 초기화
    postRender(wrap, clientId) {
        this._uid = clientId || Utils.randomID();
        this.wrap = wrap;
        this.opacity = 1;
        this.blendMode = blendModes[0].type;
        this.prev = undefined; // 이전 좌표 초기화
        this.coords = [];
        this.editable = true;
        this._visibility = true;
    }

    get smoothingFactor() { return this.wrap.smoothingFactor; }
    get scale() { return this.wrap.scale; }
    get rotation() { return this.wrap.rotation; }
    get _rotation() { return this.wrap._rotation; }
    get sin() { return this.wrap.sin; }
    get cos() { return this.wrap.cos; }
    get pen() { return this.wrap.pen; }
    get width() { return this.wrap.width; }
    get height() { return this.wrap.height; }
    get visibility() { return this._visibility; }
    set visibility(v) {
        this.toggleClass('not-visible', !v);
        return this._visibility = !!v;
    }

    // 초기 캔버스와 컨텍스트 설정
    initContext() {
        this.canvas = Utils.createElement('canvas').props({ width: this.width, height: this.height });
        this.ctx = this.canvas.getContext('2d');
        this.off_canvas = new OffscreenCanvas(this.width, this.height);
        this.off_ctx = this.off_canvas.getContext('2d');
        this.layerData = new LayerData(this.width, this.height, this.wrap);

        return [this.canvas, this.ctx, this.off_canvas, this.off_ctx, this.layerData];
    }

    // 캔버스 컨텍스트 반환
    get Context() {
        return [
            this.canvas,
            this.ctx,
            this.off_canvas,
            this.off_ctx,
            this.layerData
        ];
    }

    // 변환 적용 (확대/축소와 회전)
    applyTrans() {
        this.css({ transform: `rotate(${-this._rotation}deg) scale(${this.scale})` });
    };

    // 블렌딩 모드 적용
    applyBlend(blendMode = this.blendMode) {
        this.blendMode = blendMode;
        this.css({ 'mix-blend-mode': this.blendMode });
    }

    // 좌표 변환 (캔버스 내부 좌표로 변환)
    transCoords = (canvas, rect, e) => {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let translatedX = e.clientX - rect.left - centerX;
        let translatedY = e.clientY - rect.top - centerY;

        // 회전 변환 적용
        let rotatedX = translatedX * this.cos - translatedY * this.sin;
        let rotatedY = translatedX * this.sin + translatedY * this.cos;

        // 축소 변환 적용
        let scaledX = rotatedX / this.scale + (canvas.width / 2);
        let scaledY = rotatedY / this.scale + (canvas.height / 2);

        return [scaledX, scaledY];
    };

    // 부드러운 좌표 계산
    smoothCoords(current, prev = current) {
        return [
            Math.round(prev[0] + (current[0] - prev[0]) * this.smoothingFactor),
            Math.round(prev[1] + (current[1] - prev[1]) * this.smoothingFactor)
        ];
    };

    // 좌표 가져오기
    getCoord(transCoords, e) {
        return [
            ...this.smoothCoords(transCoords, this.prev),
            e.pressure ?? 0.5
        ];
    }

    // 포인터 이동 핸들러
    pointermoveHandler(e, transCoords) {
        this.event = e;
        this.coords.push(this.getCoord(transCoords, e))
        this.dataChanged = true;
    }

    requestDraw() {
        requestAnimationFrame(() => {
            if (!this.activePainting) return;
            if (!this.dataChanged) return this.requestDraw();
            if (this.animationFrameRequested) return this.requestDraw();
            this.animationFrameRequested = true;
            this.dataChanged = false;
            this.preventDefault(this.event);
            for (let coord of this.coords) this.draw(...coord);
            this.coords = [];
            this.animationFrameRequested = false;
            this.requestDraw();
        })
    }

    // 그리기 시작
    startDraw(e, transCoords) {
        if (!this.editable) return;
        this.preventDefault(e);
        this.activePainting = true;
        const [x, y, pressure] = this.getCoord(transCoords, e);
        this.coords = [[x, y, pressure]];
        this.prev = [x, y, pressure];
        this.pen.startDraw();
        this.requestDraw();

    }

    // 그리기 종료
    endDraw() {
        this.activePainting = false;
        this.prev = undefined;
        return this.pen.endDraw();
    }

    // 그리기
    draw(x, y, pressure) {
        if (!this.activePainting) return;

        const [canvas, ctx, off_canvas, off_ctx] = this.Context;
        const [prev_x, prev_y, prev_pressure] = this.prev;

        const { minX, minY, width, height } = this.pen.draw(off_ctx, x, y, pressure, prev_x, prev_y, prev_pressure);

        // ctx.clearRect(minX, minY, width, height);
        // ctx.drawImage(off_canvas, minX, minY, width, height, minX, minY, width, height);
        
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(off_canvas, 0, 0, this.width, this.height);


        this.prev = [x, y, pressure];
    }

    // 그리기
    drawHistory({ imageData, minX, minY, maxX, maxY }) {
        ctx.putImageData(imageData, minX, minY, minX, minY, maxX - minX + 1, minY - maxY + 1);
    }

    // 기본 이벤트 방지
    preventDefault(e) {
        if (!e) return Utils.error(e);
        e.preventDefault();
    }

    // 캔버스 크기 조정
    resizeCanvas(newWidth, newHeight, centerX = this.canvas.width / 2, centerY = this.canvas.height / 2) {
        // 트리밍할 시작 좌표 계산
        const startX = Math.floor(centerX - newWidth / 2);
        const startY = Math.floor(centerY - newHeight / 2);

        // 새로운 너비와 높이를 기준으로 트리밍할 이미지의 경계
        const trimmedImageData = this.off_ctx.getImageData(startX, startY, newWidth, newHeight);

        // 캔버스를 새 크기로 설정
        this.off_canvas.width = newWidth;
        this.off_canvas.height = newHeight;

        // 트리밍된 이미지를 오프스크린 캔버스에 다시 그립니다.
        this.off_ctx.putImageData(trimmedImageData, 0, 0);
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
    };

    applyOpacity(opacity) {
        this.opacity = Math.min(Math.max(opacity, 0), 1);
        this.canvas.css({ opacity: this.opacity });
    }

    // 생성자
    constructor() {
        super(...arguments);
    }

    // 렌더 메서드
    render() {
        const [canvas] = this.initContext();

        this.applyTrans();

        this.applyBlend();

        return canvas;
    }

    restoreHistory(history, isForward) {
        if(isForward) {
            //redo
            switch(history.type){
                case 'draw':
                    history.el._restore_image(history);
                    break;
                case 'add':
                    history.el._restore_add(history);
                    break;
                case 'remove':
                    history.el._restore_remove(history);
                    break;
            }
        } else {
            //undo
            let next = history.next, before = history;
            switch(next.type){
                case 'draw':
                    while(before.before) {
                        if(before.el === next.el) break;
                        before = before.before;
                    }
                    next.el._restore_image(before);
                    break;
                case 'add':
                    next.el._restore_remove(next);
                    break;
                case 'remove':
                    next.el._restore_add(next);
                    break;
            }
        }
    }

    _restore_image(history) {
        this.layerData.data = history.imageData;

        const [canvas, ctx, off_canvas, off_ctx] = this.Context;

        const imageData = new ImageData(history.imageData, history.width, history.height);

        ctx.putImageData(imageData, 0, 0, 0, 0, history.width, history.height);
        off_ctx.putImageData(imageData, 0, 0, 0, 0, history.width, history.height);
    }

    _restore_remove(history) {
        nemu.removeLayer(history.el, true);
        history.el.li = null;

    }

    _restore_add(history) {
        this.wrap.addLayer(history.index, undefined, history.el);
        nemu?.registLayer(history.el, history.index - 1);
    }
}

// 커스텀 엘리먼트 정의
customElements.define(`${$TAG_PREFIX}-layer`, LayerElement);

class LayerData {
    constructor(width, height, wrap) {
        this.width = width;
        this.height = height;
        this.wrap = wrap;

        // RGBA 데이터를 하나의 배열로 통합
        this.data = new Uint8ClampedArray(width * height * 4); // 4 = R, G, B, A
        this.isModifying = false;
        this.clear();
    }

    // 인덱스 계산 메서드
    getIndex(x, y) {
        return (y * this.width + x);
    }

    // 수정 시작
    startModify() {
        if (!this.isModifying) {
            this.isModifying = true;
            this.tempData = new Uint8ClampedArray(this.data);
            this.minX = this.width;
            this.minY = this.height;
            this.maxX = 0;
            this.maxY = 0;
        }
    }

    // 변경 종료
    endModify(adjust) {
        if (this.isModifying) {
            if (adjust) this.commit();
            this.clear();
            this.isModifying = false;
            return true;
        }
        return false;
    }

    commit() {
        this.data = this.tempData;
        this.wrap.addHistory({
            type: 'draw',
            el: nemu.layerElement,
            data: this,
            imageData: this.data,
            minX: this.minX,
            minY: this.minY,
            maxX: this.maxX,
            maxY: this.maxY,
            width: this.width,
            height: this.height,
        });
    }

    // 색상 및 불투명도 설정
    setData(x, y, r, g, b, a) {
        const index = this.getIndex(x, y) * 4; // 4는 RGBA
        this.tempData[index] = r;     // R
        this.tempData[index + 1] = g; // G
        this.tempData[index + 2] = b; // B
        this.tempData[index + 3] = a; // A
    }

    // 색상 가져오기
    getData(x, y) {
        const index = this.getIndex(x, y) * 4;
        return [
            this.tempData[index] ?? 0,
            this.tempData[index + 1] ?? 0,
            this.tempData[index + 2] ?? 0,
            this.tempData[index + 3] ?? 0
        ];
    }

    getDatas() {
        return this.tempData;
    }

    // 원본 색상 가져오기
    getOrgData(x, y) {
        const index = this.getIndex(x, y) * 4;
        return [
            this.data[index] ?? 0,
            this.data[index + 1] ?? 0,
            this.data[index + 2] ?? 0,
            this.data[index + 3] ?? 0
        ];
    }

    // 원본 색상 가져오기
    getPressure(x, y) {
        return this.pressure[this.getIndex(x, y)] ?? 0;
    }

    // 원본 색상 가져오기
    setPressure(x, y, pressure) {
        return this.pressure[this.getIndex(x, y)] = pressure;
    }

    // 좌표 업데이트
    setMinMax(x1, y1, x2, y2) {
        if (x1 < this.minX) this.minX = x1;
        if (y1 < this.minY) this.minY = y1;
        if (x2 > this.maxX) this.maxX = x2;
        if (y2 > this.maxY) this.maxY = y2;
    }

    clear() {
        this.tempData = null;
        this.pressure = new Float32Array(this.width * this.height);
    }

    clearData() {
        this.data.fill(0);
    }

    resize(newWidth, newHeight, startX, startY) {

    }
}

function createBrushPointer(pen) {
    return Utils.createElement(`${$TAG_PREFIX}-pointer`).css({ width: `${pen.size * 2}px`, height: `${pen.size * 2}px`, transform: `translate(-${pen.size}px, -${pen.size}px)`, border: '1px solid grey', 'border-radius': '50%', position: 'fixed', 'pointer-events': 'none' });
}

class LayerWrapElement extends BaseElement {

    // 스타일시트 반환
    stylesheet() {
        return `
        :host {
            position: relative;
            margin: 100%;
            width: fit-content;
            height: fit-content;
        }
        main {
            position: absolute;
            top: 0;
            isolation: isolate;
        }
        ${$TAG_PREFIX}-layer-back {
            display: block;
            background-color: #e5e5f7;
            background-image:  repeating-linear-gradient(45deg, #ccc  25%, transparent 25%, transparent 75%, #ccc  75%, #ccc ), repeating-linear-gradient(45deg, #ccc  25%, #e5e5f7 25%, #e5e5f7 75%, #ccc  75%, #ccc );
            background-position: 0 0, 10px 10px;
            background-size: 20px 20px;
        }
        ${$TAG_PREFIX}-layer {
            position: absolute;
            top: 0;
            left: 0;
        }
        .not-visible {
            display: none !important;
        }
        `;
    }

    handleGesture(e) {
        let active = e.pointerType == 'touch' || e.shiftKey;
        e.preventDefault();
        e.stopPropagation();
        activeHandle:
        if (active) {
            if (this.focusedLayer.activePainting) {
                this.pointerupHandler(e);
                this.parentNode.onpointerdown(e);
                break activeHandle;
            }
            if (e.type == 'pointerdown') this.parentNode.onpointerdown(e);
            if (typeof window.onpointermove == 'function') window.onpointermove(e, true);
        }

        return !active;
    }

    // 렌더링 후 초기화
    postRender() {
        this.width = 500; // 초기 너비
        this.height = 500; // 초기 높이


        this.smoothingFactor = 0.8; // 손 떨림 보정 비율
        this.scale = 1; // 초기 확대 비율
        this.rotation = this._rotation = 0; // 초기 회전 각도 (라디안)
        this.sin = Math.sin(0);
        this.cos = Math.cos(0);

        this.layers = [new LayerElement(this)];

        this.brushColor = [0, 0, 0]; // 브러시 색상
        this.pen = null; // 브러시 객체 초기화

        this.zoomSpeed = 0.1; // 확대/축소 속도
        this.rotateSpeed = 5; // 회전 속도 (5도 단위)

        this.history = [];
        this.historyIndex = -1;
        this.MAX_HISTORY_SIZE = 50;

    }

    // 변환 적용 (확대/축소와 회전)
    applyTrans() {
        this.cos = Math.cos(this.rotation);
        this.sin = Math.sin(this.rotation);
        for (let layer of this.layers) layer.applyTrans();
        this.back.css({ transform: `rotate(${-this._rotation}deg) scale(${this.scale})` });
    };

    // 포인터 이동 핸들러
    pointermoveHandler(e) {
        let coords = this.transCoords(this.focusedLayer.getBoundingClientRect(), e);
        nemu.displayCoords(coords);
        if (!this.handleGesture(e)) return;
        this.pointer && this.pointer.css({ top: `${e.clientY}px`, left: `${e.clientX}px` });
        this.focusedLayer.pointermoveHandler(e, coords);
    }

    // 포인터 등장 핸들러
    pointeroverHandler(e) {
        if (this.pointer) this.pointer.remove();
        this.pointer = createBrushPointer(this.pen);
        this.pointer.css({ top: `${e.clientY}px`, left: `${e.clientX}px` });
        this.innerwrap.appendChild(this.pointer);
    }

    // 포인터 소멸 핸들러
    pointeroutHandler() {
        this.pointer.remove();
        this.pointer = null;
    }

    pointerupHandler(e) {
        if (e.type == 'pointerup' && window.onpointerup) window.onpointerup(e);
        if (this.focusedLayer.endDraw(e) === false) return;
        this.dispatchEvent(new Event('enddraw', { bubbles: true, cancelable: false }));
    }

    transCoords = (rect, e) => {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let translatedX = e.clientX - rect.left - centerX;
        let translatedY = e.clientY - rect.top - centerY;

        // 회전 변환 적용
        let rotatedX = translatedX * this.cos - translatedY * this.sin;
        let rotatedY = translatedX * this.sin + translatedY * this.cos;

        // 축소 변환 적용
        let scaledX = rotatedX / this.scale + (this.width / 2);
        let scaledY = rotatedY / this.scale + (this.height / 2);

        return [scaledX, scaledY];
    };

    // 휠 핸들러
    wheelHandler(e) {
        e.preventDefault();
        if (e.deltaY == 0) return;

        if (e.shiftKey) this.rotate(e.deltaY > 0);
        else this.zoom(e.deltaY > 0);

        this.applyTrans();
    }

    // 확대/축소 핸들러
    zoom(bool) {
        this.scale += bool ? this.zoomSpeed : -this.zoomSpeed;
        if (this.scale < 0.1) this.scale = 0.1; // 최소 축소 비율 설정
        nemu.displayScale(this.scale);
    }

    // 회전 핸들러
    rotate(bool) {
        this._rotation = (this._rotation + (!bool ? this.rotateSpeed : -this.rotateSpeed)) % 360;
        this.rotation = this._rotation / 180 * Math.PI;

        nemu.displayRotate(this._rotation);
    }

    // 캔버스 크기 조정
    resizeCanvas(newWidth, newHeight, centerX, centerY) {
        for (let layer of this.layers) layer.resizeCanvas(newWidth, newHeight, centerX, centerY);
        this.width = newWidth;
        this.height = newHeight;
        this.back.css({ width: `${newWidth}px`, height: `${newHeight}px` });
        this.innerwrap.css({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    addHistory(data) {
        let before = this.history[this.historyIndex];
        if (before) before.next = data;
        data.before = before;
        // 현재 historyIndex 다음의 모든 항목을 삭제
        this.history.splice(this.historyIndex + 1);

        // 최대 히스토리 크기를 초과하면 오래된 데이터를 삭제
        while (this.history.length > this.MAX_HISTORY_SIZE - 1) {
            this.history.shift(); // 첫 번째 요소 제거
        }

        // 현재 인덱스를 히스토리의 길이로 업데이트
        this.historyIndex = this.history.length;

        // 데이터를 추가
        this.history.push(data);

        if ('onHistoryChange' in nemu) nemu.onHistoryChange({ undoable: this.historyIndex > 0, redoable: this.historyIndex < this.history.length - 1 });
    }

    undo() {
        this.historyMove(-1);
    }

    redo() {
        this.historyMove(1);
    }

    historyMove(step) {
        // 유효한 범위 내에서 인덱스 수정
        if ((step < 0 && this.historyIndex < 1) || (step > 0 && this.historyIndex > this.history.length - 2)) {
            return console.warn('not valid range'); // 인덱스가 이미 끝에 도달했으면 종료
        }
        this.historyIndex += step; // 인덱스 업데이트

        // 상태 복원
        let data = this.history[this.historyIndex];
        if (data && data.el) {
            data.el.restoreHistory(data, step > 0);
        }

        if ('onHistoryChange' in nemu) nemu.onHistoryChange({ undoable: this.historyIndex > 0, redoable: this.historyIndex < this.history.length - 1 });
    }

    // 연결된 콜백
    connectedCallback() {
        window.addEventListener('pointermove', this.pointermoveHandler);
        window.addEventListener('pointerup', this.pointerupHandler);
        this.innerwrap.addEventListener('wheel', this.wheelHandler);
        this.innerwrap.addEventListener('pointerout', this.pointeroutHandler);
        this.innerwrap.addEventListener('pointerover', this.pointeroverHandler);
    }

    // 연결 해제된 콜백
    disconnectedCallback() {
        window.removeEventListener('pointermove', this.pointermoveHandler);
        window.removeEventListener('pointerup', this.pointerupHandler);
        this.innerwrap.removeEventListener('wheel', this.wheelHandler);
        this.innerwrap.removeEventListener('pointerout', this.pointeroutHandler);
        this.innerwrap.removeEventListener('pointerover', this.pointeroverHandler);
    }

    // 생성자
    constructor() {
        super();
        this.pointeroutHandler = this.pointeroutHandler.bind(this);
        this.pointeroverHandler = this.pointeroverHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);
    }

    initSetting() {
        nemu.displaySize(this.width, this.height);
        nemu.displayCoords([0, 0]);
        nemu.displayScale(this.scale);
        nemu.displayRotate(this.rotation);
    }

    addLayer(index = this.layers.length, clientId, old_layer) {
        let new_layer = old_layer || new LayerElement(this, clientId);
        this.layers.splice(index, 0, new_layer);
        if (this.innerwrap.children[index]) this.innerwrap.children[index].before(new_layer);
        else new_layer.appendTo(this.innerwrap);
        if (old_layer) return new_layer;
        this.addHistory({
            type: 'add', el: new_layer, index,
            imageData: new_layer.layerData.data,
            width: this.width,
            height: this.height
        });

        return new_layer;
    }

    getLayer(clientId) {
        return this.layers.filter(layer => layer._uid == clientId)[0];
    }

    removeLayer(old_layer, isHistory = false) {
        let index = this.layers.indexOf(old_layer);
        old_layer.remove();
        this.layers = this.layers.filter(layer => layer !== old_layer);
        if (isHistory) return;
        this.addHistory({ type: 'remove', el: old_layer, index });
    }

    getFocusedIndex() {
        return this.layers.indexOf(this.focusedLayer);
    }

    // 렌더 메서드
    render() {
        let frag = Utils.createFragment();
        this.back = Utils.createElement('nemu-layer-back').appendTo(frag);
        this.innerwrap = Utils.createElement('main').appendTo(frag);

        for (let index in this.layers) {
            this.innerwrap.appendChild(this.layers[index]);
            this.addHistory({
                type: 'add', el: this.layers[index], index,
                imageData: this.layers[index].layerData.data,
                width: this.width,
                height: this.height
            });
        }

        this.applyTrans();
        this.resizeCanvas(this.width, this.height);

        this.innerwrap.onpointerdown = e => {
            if (!this.handleGesture(e)) return;
            let coords = this.transCoords(this.focusedLayer.getBoundingClientRect(), e);
            this.focusedLayer.startDraw(e, coords);
        };

        return frag;
    }

    export(fileName = `nemu_export_${(new Date()).getTime()}.png`) {
        if (!confirm('이미지를 저장하시겠습니까?')) return;

        let output_canvas = Utils.createElement('canvas').props({
            width: this.width,
            height: this.height
        });

        let output_ctx = output_canvas.getContext('2d');

        if (!confirm('투명 배경으로 저장하시겠습니까?')) {
            output_ctx.fillStyle = '#FFFFFF';
            output_ctx.fillRect(0, 0, output_canvas.width, output_canvas.height);
        }

        for (let layer of this.layers) {
            if (!layer.visibility) continue;
            output_ctx.globalCompositeOperation = layer.blendMode;
            output_ctx.globalAlpha = layer.opacity;
            output_ctx.drawImage(layer.canvas, 0, 0);
        }

        output_canvas.toBlob(function (blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
        }, 'image/png');

    }
}

// 커스텀 엘리먼트 정의
customElements.define(`${$TAG_PREFIX}-layer-wrap`, LayerWrapElement);

function blendColorsWithAlpha(src, dst) {
    let invSrcAlpha = dst[3] * (1 - src[3] / 255);
    let totalAlpha = src[3] + invSrcAlpha;

    let r = (src[0] * src[3] + dst[0] * invSrcAlpha) / totalAlpha;
    let g = (src[1] * src[3] + dst[1] * invSrcAlpha) / totalAlpha;
    let b = (src[2] * src[3] + dst[2] * invSrcAlpha) / totalAlpha;

    return [
        (r + 0.5) | 0,
        (g + 0.5) | 0,
        (b + 0.5) | 0,
        (totalAlpha + 0.5) | 0
    ];
}

function parseColor(colorStr) {
    let r, g, b;

    if (colorStr.startsWith('#')) {
        if (colorStr.length === 4) {
            r = parseInt(colorStr[1] + colorStr[1], 16);
            g = parseInt(colorStr[2] + colorStr[2], 16);
            b = parseInt(colorStr[3] + colorStr[3], 16);
        } else if (colorStr.length === 7) {
            r = parseInt(colorStr.substring(1, 3), 16);
            g = parseInt(colorStr.substring(3, 5), 16);
            b = parseInt(colorStr.substring(5, 7), 16);
        }
        return [r, g, b];
    }

    if (colorStr.startsWith('rgb')) {
        const rgbValues = colorStr.match(/\d+/g).map(Number);
        r = rgbValues[0];
        g = rgbValues[1];
        b = rgbValues[2];
        return [r, g, b];
    }

    if (colorStr.startsWith('hsl')) {
        const hslValues = colorStr.match(/\d+\.?\d*/g).map(Number);
        const h = hslValues[0];
        const s = hslValues[1] / 100;
        const l = hslValues[2] / 100;

        if (s === 0) {
            r = g = b = Math.round(l * 255);
        } else {
            const hueToRgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 3) return q;
                if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
            g = Math.round(hueToRgb(p, q, h / 360) * 255);
            b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);
        }
        return [r, g, b];
    }

    throw new Error("Invalid color format");
}

export { toolsWindow, brushSettingWindow, brushesWindow, erasersWindow, layersWindow, canvasWindow };