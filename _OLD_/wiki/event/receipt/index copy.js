const barcord_128 = [
  { index: 0, code_a: " ", code_b: " ", code_c: "0", pattern: "11011001100" },
  { index: 1, code_a: "!", code_b: "!", code_c: "1", pattern: "11001101100" },
  { index: 2, code_a: "\"", code_b: "\"", code_c: "2", pattern: "11001100110" },
  { index: 3, code_a: "#", code_b: "#", code_c: "3", pattern: "10010011000" },
  { index: 4, code_a: "$", code_b: "$", code_c: "4", pattern: "10010001100" },
  { index: 5, code_a: "%", code_b: "%", code_c: "5", pattern: "10001001100" },
  { index: 6, code_a: "&", code_b: "&", code_c: "6", pattern: "10011001000" },
  { index: 7, code_a: "", code_b: "", code_c: "7", pattern: "10011000100" },
  { index: 8, code_a: "(", code_b: "(", code_c: "8", pattern: "10001100100" },
  { index: 9, code_a: ")", code_b: ")", code_c: "9", pattern: "11001001000" },
  { index: 10, code_a: "*", code_b: "*", code_c: "10", pattern: "11001000100" },
  { index: 11, code_a: "+", code_b: "+", code_c: "11", pattern: "11000100100" },
  { index: 12, code_a: ",", code_b: ",", code_c: "12", pattern: "10110011100" },
  { index: 13, code_a: "-", code_b: "-", code_c: "13", pattern: "10011011100" },
  { index: 14, code_a: ".", code_b: ".", code_c: "14", pattern: "10011001110" },
  { index: 15, code_a: "/", code_b: "/", code_c: "15", pattern: "10111001100" },
  { index: 16, code_a: "0", code_b: "0", code_c: "16", pattern: "10011101100" },
  { index: 17, code_a: "1", code_b: "1", code_c: "17", pattern: "10011100110" },
  { index: 18, code_a: "2", code_b: "2", code_c: "18", pattern: "11001110010" },
  { index: 19, code_a: "3", code_b: "3", code_c: "19", pattern: "11001011100" },
  { index: 20, code_a: "4", code_b: "4", code_c: "20", pattern: "11001001110" },
  { index: 21, code_a: "5", code_b: "5", code_c: "21", pattern: "11011100100" },
  { index: 22, code_a: "6", code_b: "6", code_c: "22", pattern: "11001110100" },
  { index: 23, code_a: "7", code_b: "7", code_c: "23", pattern: "11101101110" },
  { index: 24, code_a: "8", code_b: "8", code_c: "24", pattern: "11101001100" },
  { index: 25, code_a: "9", code_b: "9", code_c: "25", pattern: "11100101100" },
  { index: 26, code_a: ":", code_b: ":", code_c: "26", pattern: "11100100110" },
  { index: 27, code_a: ";", code_b: ";", code_c: "27", pattern: "11101100100" },
  { index: 28, code_a: "<", code_b: "<", code_c: "28", pattern: "11100110100" },
  { index: 29, code_a: "=", code_b: "=", code_c: "29", pattern: "11100110010" },
  { index: 30, code_a: ">", code_b: ">", code_c: "30", pattern: "11011011000" },
  { index: 31, code_a: "?", code_b: "?", code_c: "31", pattern: "11011000110" },
  { index: 32, code_a: "@", code_b: "@", code_c: "32", pattern: "11000110110" },
  { index: 33, code_a: "A", code_b: "A", code_c: "33", pattern: "10100011000" },
  { index: 34, code_a: "B", code_b: "B", code_c: "34", pattern: "10001011000" },
  { index: 35, code_a: "C", code_b: "C", code_c: "35", pattern: "10001000110" },
  { index: 36, code_a: "D", code_b: "D", code_c: "36", pattern: "10110001000" },
  { index: 37, code_a: "E", code_b: "E", code_c: "37", pattern: "10001101000" },
  { index: 38, code_a: "F", code_b: "F", code_c: "38", pattern: "10001100010" },
  { index: 39, code_a: "G", code_b: "G", code_c: "39", pattern: "11010001000" },
  { index: 40, code_a: "H", code_b: "H", code_c: "40", pattern: "11000101000" },
  { index: 41, code_a: "I", code_b: "I", code_c: "41", pattern: "11000100010" },
  { index: 42, code_a: "J", code_b: "J", code_c: "42", pattern: "10110111000" },
  { index: 43, code_a: "K", code_b: "K", code_c: "43", pattern: "10110001110" },
  { index: 44, code_a: "L", code_b: "L", code_c: "44", pattern: "10001101110" },
  { index: 45, code_a: "M", code_b: "M", code_c: "45", pattern: "10111011000" },
  { index: 46, code_a: "N", code_b: "N", code_c: "46", pattern: "10111000110" },
  { index: 47, code_a: "O", code_b: "O", code_c: "47", pattern: "10001110110" },
  { index: 48, code_a: "P", code_b: "P", code_c: "48", pattern: "11101110110" },
  { index: 49, code_a: "Q", code_b: "Q", code_c: "49", pattern: "11010001110" },
  { index: 50, code_a: "R", code_b: "R", code_c: "50", pattern: "11000101110" },
  { index: 51, code_a: "S", code_b: "S", code_c: "51", pattern: "11011101000" },
  { index: 52, code_a: "T", code_b: "T", code_c: "52", pattern: "11011100010" },
  { index: 53, code_a: "U", code_b: "U", code_c: "53", pattern: "11011101110" },
  { index: 54, code_a: "V", code_b: "V", code_c: "54", pattern: "11101011000" },
  { index: 55, code_a: "W", code_b: "W", code_c: "55", pattern: "11101000110" },
  { index: 56, code_a: "X", code_b: "X", code_c: "56", pattern: "11100010110" },
  { index: 57, code_a: "Y", code_b: "Y", code_c: "57", pattern: "11101101000" },
  { index: 58, code_a: "Z", code_b: "Z", code_c: "58", pattern: "11101100010" },
  { index: 59, code_a: "[", code_b: "[", code_c: "59", pattern: "11100011010" },
  { index: 60, code_a: "\\", code_b: "\\", code_c: "60", pattern: "11101111010" },
  { index: 61, code_a: "]", code_b: "]", code_c: "61", pattern: "11001000010" },
  { index: 62, code_a: "^", code_b: "^", code_c: "62", pattern: "11110001010" },
  { index: 63, code_a: "_", code_b: "_", code_c: "63", pattern: "10100110000" },
  { index: 64, code_a: "NUL", code_b: "`", code_c: "64", pattern: "10100001100" },
  { index: 65, code_a: "SOH", code_b: "a", code_c: "65", pattern: "10010110000" },
  { index: 66, code_a: "STX", code_b: "b", code_c: "66", pattern: "10010000110" },
  { index: 67, code_a: "ETX", code_b: "c", code_c: "67", pattern: "10000101100" },
  { index: 68, code_a: "EOT", code_b: "d", code_c: "68", pattern: "10000100110" },
  { index: 69, code_a: "ENQ", code_b: "e", code_c: "69", pattern: "10110010000" },
  { index: 70, code_a: "ACK", code_b: "f", code_c: "70", pattern: "10110000100" },
  { index: 71, code_a: "BEL", code_b: "g", code_c: "71", pattern: "10011010000" },
  { index: 72, code_a: "BS", code_b: "h", code_c: "72", pattern: "10011000010" },
  { index: 73, code_a: "HT", code_b: "i", code_c: "73", pattern: "10000110100" },
  { index: 74, code_a: "LF", code_b: "j", code_c: "74", pattern: "10000110010" },
  { index: 75, code_a: "VT", code_b: "k", code_c: "75", pattern: "11000010010" },
  { index: 76, code_a: "FF", code_b: "l", code_c: "76", pattern: "11001010000" },
  { index: 77, code_a: "CR", code_b: "m", code_c: "77", pattern: "11110111010" },
  { index: 78, code_a: "SO", code_b: "n", code_c: "78", pattern: "11000010100" },
  { index: 79, code_a: "SI", code_b: "o", code_c: "79", pattern: "10001111010" },
  { index: 80, code_a: "DLE", code_b: "p", code_c: "80", pattern: "10100111100" },
  { index: 81, code_a: "DC1", code_b: "q", code_c: "81", pattern: "10010111100" },
  { index: 82, code_a: "DC2", code_b: "r", code_c: "82", pattern: "10010011110" },
  { index: 83, code_a: "DC3", code_b: "s", code_c: "83", pattern: "10111100100" },
  { index: 84, code_a: "DC4", code_b: "t", code_c: "84", pattern: "10011110100" },
  { index: 85, code_a: "NAK", code_b: "u", code_c: "85", pattern: "10011110010" },
  { index: 86, code_a: "SYN", code_b: "v", code_c: "86", pattern: "11110100100" },
  { index: 87, code_a: "ETB", code_b: "w", code_c: "87", pattern: "11110010100" },
  { index: 88, code_a: "CAN", code_b: "x", code_c: "88", pattern: "11110010010" },
  { index: 89, code_a: "EM", code_b: "y", code_c: "89", pattern: "11011011110" },
  { index: 90, code_a: "SUB", code_b: "z", code_c: "90", pattern: "11011110110" },
  { index: 91, code_a: "ESC", code_b: "{", code_c: "91", pattern: "11110110110" },
  { index: 92, code_a: "FS", code_b: "|", code_c: "92", pattern: "10101111000" },
  { index: 93, code_a: "GS", code_b: "}", code_c: "93", pattern: "10100011110" },
  { index: 94, code_a: "RS", code_b: "~", code_c: "94", pattern: "10001011110" },
  { index: 95, code_a: "US", code_b: "DEL", code_c: "95", pattern: "10111101000" },
  { index: 96, code_a: "FNC 3", code_b: "FNC 3", code_c: "96", pattern: "10111100010" },
  { index: 97, code_a: "FNC 2", code_b: "FNC 2", code_c: "97", pattern: "11110101000" },
  { index: 98, code_a: "Shift B", code_b: "Shift A", code_c: "98", pattern: "11110100010" },
  { index: 99, code_a: "Code C", code_b: "Code C", code_c: "99", pattern: "10111011110" },
  { index: 100, code_a: "Code B", code_b: "FNC 4", code_c: "Code B", pattern: "10111101110" },
  { index: 101, code_a: "FNC 4", code_b: "Code A", code_c: "Code A", pattern: "11101011110" },
  { index: 102, code_a: "FNC 1", code_b: "FNC 1", code_c: "FNC 1", pattern: "11110101110" },
  { index: 103, code_a: "Start Code A", code_b: "", code_c: "", pattern: "11010000100" },
  { index: 104, code_a: "Start Code B", code_b: "", code_c: "", pattern: "11010010000" },
  { index: 105, code_a: "Start Code C", code_b: "", code_c: "", pattern: "11010011100" },
  { index: 106, code_a: "Stop", code_b: "", code_c: "", pattern: "11000111010" },
  { index: '—', code_a: "Reverse Stop", code_b: "", code_c: "", pattern: "11010111000" },
  { index: '—', code_a: "Stop pattern (7 bars/spaces)", code_b: "", code_c: "", pattern: "1100011101011" }
];

const START_CODE_B = barcord_128[104];
const TXT_SPACE = barcord_128[0];

const STOP = barcord_128[108];
const QUITE_ZONE = { pattern: "00000000000" };

function stringTo128Code(str) {
  let char_arr = str.split("");
  let weight = 1;
  let checksum_total = 0;
  let commands = "";
  commands += QUITE_ZONE.pattern;
  commands += START_CODE_B.pattern;
  checksum_total += START_CODE_B.index * weight;
  for (let char of char_arr) {
    let code = barcord_128.find(opt => opt.code_b === char) || TXT_SPACE;
    commands += code.pattern;
    checksum_total += code.index * weight;
    weight++;
  }
  let checksum = barcord_128[checksum_total % 103];
  commands += checksum.pattern;
  commands += STOP.pattern;
  commands += QUITE_ZONE.pattern;
  return commands;
}


function createBarcode(str) {
  let barcode_arr = stringTo128Code(str).split("");
  barcode.innerHTML = '';
  for (let code of barcode_arr) {
    let bar = document.createElement('div');
    bar.classList.add(code == "1" ? 'bar' : 'space');
    barcode.append(bar);
  }
}
