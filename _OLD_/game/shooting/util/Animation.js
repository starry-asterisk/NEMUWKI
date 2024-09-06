class Animation {
    // n 거리동안 r만큼씩 p번 움직이고 싶을때
    static wave = (n, p, r, initY = 0) => x => {
        return (r * Math.sin(x * ((Math.PI*2) * p/n))) + initY;
    }

    static demageDefault = (demage) => ({x, y, r, imageNamespace, randomSeed}, time) => {
        context.filter = filters.demaged;
        drawObject(imageNamespace, {x, y, r});
        context.filter = filters.none;
        drawDemage(x + randomInt(0, 10, randomSeed), y, demage, time/times.demage_animation_duration);
    }
}