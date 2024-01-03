let canvas = undefined;
let context = undefined;
let frameIndex = 0;

const random = [0.38445753628753043,0.20403623390669257,0.5444525318188076,0.93984464544972,0.7187914568823954,0.9339800661008026,0.5538185661948829,0.7595221552444893,0.5899888094256813,0.43782879664681307,0.3834243441022478,0.8729403974804899,0.3091564115413654,0.22030432905068453,0.06520598006397771,0.8822160703356756,0.4620432290861405,0.16261383807041474,0.528381329340222,0.1627929840731963,0.5402192047998506,0.36711978824471747,0.1518433026196362,0.3617021030441079,0.07639889874812611,0.4320289052833979,0.7957435504694488,0.692339072036444,0.5015759444495547,0.750695937065577,0.010313542052390545,0.3273480614935167,0.8529456309996708,0.016290969092223495,0.3753924064382679,0.2028927835628207,0.2663919086266515,0.5276422429910677,0.6203905781444978,0.6248976617264543,0.760725827695385,0.5266264507508087,0.8111131842218753,0.9598841354294572,0.25353449348828616,0.14791590743855965,0.12108045619494368,0.8060212086230341,0.2568926296291376,0.8012193751203651,0.6053785188802423,0.24790423017144048,0.4658322123798766,0.8611798976781724,0.38199922954010423,0.6461339112532605,0.2905051181975491,0.929713368980221,0.2772185665828657,0.26715623427745383,0.9563082411242381,0.44640168685144355,0.4829740511260123,0.17986335228633865,0.7138551338879797,0.7801912273542033,0.7964003956393861,0.7979584634840529,0.2582326260097687,0.3022634700135831,0.0698453330475004,0.9623965820645755,0.025659666016844662,0.28833493269865684,0.8869384137500613,0.029023608979444226,0.9470144612997309,0.7995887071306222,0.5225717700542307,0.7216187649369095,0.8761318759960781,0.1985977190221091,0.19762562217260826,0.38531808689901914,0.002254285209741802,0.8357587716380981,0.20119117521764807,0.8471350961638244,0.8322011522683135,0.3873407165487919,0.42372105752883793,0.6217828469763729,0.20556065802921752,0.24975473636924272,0.18332220875574978,0.24726679097001414,0.14207461010275768,0.7388275443520411,0.40638982572574145,0.7286524416686795];

const rWidth = 400;
const rHeight = rWidth * 1.5;

const imageSet = {};

const ViewerStatus = {
    opening: Symbol('opening'),
    guide: Symbol('guide'),
    playing: Symbol('playing'),
    ending: Symbol('ending'),
    dead: Symbol('dead'),
    pause: Symbol('pause')
};

const BulletStatus = {
    fire: Symbol('fire'),
    collision: Symbol('collision'),
    destroy: Symbol('destroy')
};

const PlayStatus = {
    opening : Symbol('opening'),
    playing : Symbol('playing'),
    ending : Symbol('ending'),
    exit : Symbol('exit')
};

const filters = {
    demaged: "invert(13%) sepia(88%) saturate(7379%) hue-rotate(360deg) brightness(100%) contrast(107%)"
}

const times = {
    demage_animation_duration: 100 
}