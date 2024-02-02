const hangul = {
  q: "ㅂ",
  w: "ㅈ",
  e: "ㄷ",
  r: "ㄱ",
  t: "ㅅ",
  y: "ㅛ",
  u: "ㅕ",
  i: "ㅑ",
  o: "ㅐ",
  p: "ㅔ",
  a: "ㅁ",
  s: "ㄴ",
  d: "ㅇ",
  f: "ㄹ",
  g: "ㅎ",
  h: "ㅗ",
  j: "ㅓ",
  k: "ㅏ",
  l: "ㅣ",
  z: "ㅋ",
  x: "ㅌ",
  c: "ㅊ",
  v: "ㅍ",
  b: "ㅠ",
  n: "ㅜ",
  m: "ㅡ",
  Q: "ㅃ",
  W: "ㅉ",
  E: "ㄸ",
  R: "ㄲ",
  T: "ㅆ",
  Y: "ㅛ",
  U: "ㅕ",
  I: "ㅑ",
  O: "ㅒ",
  P: "ㅖ",
  A: "ㅁ",
  S: "ㄴ",
  D: "ㅇ",
  F: "ㄹ",
  G: "ㅎ",
  H: "ㅗ",
  J: "ㅓ",
  K: "ㅏ",
  L: "ㅣ",
  Z: "ㅋ",
  X: "ㅌ",
  C: "ㅊ",
  V: "ㅍ",
  B: "ㅠ",
  N: "ㅜ",
  M: "ㅡ",
};
const hangul_moeum = [
  "ㅛ",
  "ㅕ",
  "ㅑ",
  "ㅐ",
  "ㅒ",
  "ㅔ",
  "ㅖ",
  "ㅗ",
  "ㅓ",
  "ㅏ",
  "ㅣ",
  "ㅠ",
  "ㅜ",
  "ㅡ",
];
const hangul_moeum_combine = {
  ㅗ: { ㅏ: "ㅘ", ㅐ: "ㅙ", ㅣ: "ㅚ" },
  ㅜ: { ㅓ: "ㅝ", ㅣ: "ㅟ", ㅔ: "ㅞ" },
  ㅡ: { ㅣ: "ㅢ" },
};
const hangul_jaum_combine = {
  ㄱ: { ㅅ: "ㄳ" },
  ㄴ: { ㅈ: "ㄵ", ㅎ: "ㄶ" },
  ㄹ: { ㄱ: "ㄺ", ㅁ: "ㄻ", ㅂ: "ㄼ", ㅅ: "ㄽ", ㅌ: "ㄾ", ㅍ: "ㄿ", ㅎ: "ㅀ" },
  ㅂ: { ㅅ: "ㅄ" },
};
function isMoeum(char) {
  return hangul_moeum.indexOf(char) > -1;
}

function hangulCombine(원자들) {
  const 초성 = 원자들[0] || "";
  const 중성 = 원자들[1] || "";
  const 종성 = 원자들[2] || "";
  if (!중성) {
    return 초성;
  }
  const 중성_유니코드 = 중성.charCodeAt(0);
  const 초성_연결자 = {
    ㄱ: 0,
    ㄲ: 1,
    ㄴ: 2,
    ㄷ: 3,
    ㄸ: 4,
    ㄹ: 5,
    ㅁ: 6,
    ㅂ: 7,
    ㅃ: 8,
    ㅅ: 9,
    ㅆ: 10,
    ㅇ: 11,
    ㅈ: 12,
    ㅉ: 13,
    ㅊ: 14,
    ㅋ: 15,
    ㅌ: 16,
    ㅍ: 17,
    ㅎ: 18,
  };
  const 종성_연결자 = {
    "": 0,
    ㄱ: 1,
    ㄲ: 2,
    ㄳ: 3,
    ㄴ: 4,
    ㄵ: 5,
    ㄶ: 6,
    ㄷ: 7,
    ㄹ: 8,
    ㄺ: 9,
    ㄻ: 10,
    ㄼ: 11,
    ㄽ: 12,
    ㄾ: 13,
    ㄿ: 14,
    ㅀ: 15,
    ㅁ: 16,
    ㅂ: 17,
    ㅄ: 18,
    ㅅ: 19,
    ㅆ: 20,
    ㅇ: 21,
    ㅈ: 22,
    ㅊ: 23,
    ㅋ: 24,
    ㅌ: 25,
    ㅍ: 26,
    ㅎ: 27,
  };
  const 자음_유니코드_시작점 = 12623;
  const 유니코드_한글_시작점 = 44032;
  const 초성_인덱스 = 초성_연결자[초성];
  const 중성_인덱스 = 중성_유니코드 - 자음_유니코드_시작점;
  const 종성_인덱스 = 종성_연결자[종성];
  return String.fromCharCode(
    유니코드_한글_시작점 + 초성_인덱스 * 588 + 중성_인덱스 * 28 + 종성_인덱스
  );
}

let hangul_typing = [];

function inputHangul(hanguel_i) {
  let firedLetter = '';
  if (hangul_typing[0] == undefined) {
    hangul_typing[0] = hanguel_i;
  } else if (hangul_typing[1] == undefined) {
    if (isMoeum(hanguel_i)) {
      if (isMoeum(hangul_typing[0])) {
        if (
          hangul_moeum_combine[hangul_typing[0]] &&
          hangul_moeum_combine[hangul_typing[0]][hanguel_i]
        ) {
          firedLetter = hangul_moeum_combine[hangul_typing[0]][hanguel_i];
          hangul_typing = [];
        } else {
          firedLetter = hangul_typing[0];
          hangul_typing = [hanguel_i];
        }
      } else {
        hangul_typing[1] = hanguel_i;
      }
    } else if (
      hangul_jaum_combine[hangul_typing[0]] &&
      hangul_jaum_combine[hangul_typing[0]][hanguel_i]
    ) {
      firedLetter = hangul_jaum_combine[hangul_typing[0]][hanguel_i];
      hangul_typing = [];
    } else {
      firedLetter = hangul_typing[0];
      hangul_typing = [hanguel_i];
    }
  } else if (hangul_typing[2] == undefined) {
    if (isMoeum(hanguel_i)) {
      if (
        hangul_moeum_combine[hangul_typing[1]] &&
        hangul_moeum_combine[hangul_typing[1]][hanguel_i]
      ) {
        hangul_typing[1] =
          hangul_moeum_combine[hangul_typing[1]][hanguel_i];
      } else {
        firedLetter = hangulCombine(hangul_typing);
        hangul_typing = [hanguel_i];
      }
    } else {
      hangul_typing[2] = hanguel_i;
    }
  } else {
    if (isMoeum(hanguel_i)) {
      let last_typing = hangul_typing.pop();
      firedLetter = hangulCombine(hangul_typing);
      hangul_typing = [last_typing, hanguel_i];
    } else if (
      hangul_jaum_combine[hangul_typing[2]] &&
      hangul_jaum_combine[hangul_typing[2]][hanguel_i]
    ) {
      hangul_typing[2] = hangul_jaum_combine[hangul_typing[2]][hanguel_i];
      firedLetter = hangulCombine(hangul_typing);
      hangul_typing = [];
    } else {
      firedLetter = hangulCombine(hangul_typing);
      hangul_typing = [hanguel_i];
    }
  }

  
}