//
// var replaceAll = function (strTemp, strValue1, strValue2){
//   while(1){
//     if( strTemp.indexOf(strValue1) != -1 )
//       strTemp = strTemp.replace(strValue1, strValue2);
//     else
//       break;
//   }
//   return strTemp;
// }
//
// var korToUni = function(str) {
//   return escape(replaceAll(str, "\\", "%"));
// }
//
// var uniToKor = function(str) {
//   return unescape(replaceAll(str, "\\", "%"));
// }
//
// var rCho =
//         [ "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ",
//             "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ" ];
// var rJung =
//         [ "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ",
//             "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ" ];
// var rJong =
//         [ "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ",
//             "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ",
//             "ㅍ", "ㅎ" ];
//
// var getChoJungJong = function(str) {
//   var cho, jung, jong, choUni, jungUni, jongUni;
//   var tempStr = str.charCodeAt(0) - 0xAC00;
//   // console.log(tempStr);
//   jong = tempStr % 28; // 종성
//   jung = ((tempStr - jong) / 28 ) % 21 // 중성
//   cho = (((tempStr - jong) / 28 ) - jung ) / 21 // 종성
//
//   console.log("초성:" + rCho[cho] + " 중성:" + rJung[jung] + " 종성:" + rJong[jong]);
//   console.log("초성:" + korToUni(rCho[cho]) + " 중성:" + korToUni(rJung[jung]) + " 종성:" + korToUni(rJong[jong]));
// }
//
// var getJamo = function(str) {
//   var ja, mo, jaUni, moUni;
//   var tempStr = str.charCodeAt(0);
//   //Hangul Compatibility Jamo
//   //3130~314E, 3165~3186 :Ja
//   //314F~3163, 3187~3182  :Mo
//   //3164 :hangul filer
//
// }
//
// var getChoJungJong_Text = function(str) {
//   for(var i = 0; i < str.length; i++) {
//     var tempStr = str[i];
//     var asciiDec = tempStr.charCodeAt(0)
//     console.log(asciiDec); // ascii dec
//     if (asciiDec == 32){
//       console.log("blank");
//     } else if (48 <= asciiDec && asciiDec <= 57) {
//       console.log("NUM");
//     } else if ((65 <= asciiDec && asciiDec <= 90)
//       || (97 <= asciiDec && asciiDec <= 122)) {
//       console.log("ALP");
//     } else if (4352 <= asciiDec && asciiDec <= 5607) {
//       console.log("Hangule Jamo");
//     } else if (12592 <= asciiDec && asciiDec <= 12687) {
//       console.log("Hangul Compatibility Jamo");
//     } else if (43360 <= asciiDec && asciiDec <= 43391) {
//       console.log("Hangul Jamo Extended A - all Ja");
//     } else if (44032 <= asciiDec && asciiDec <= 55215) {
//       console.log("Hangul Syllables");
//       getChoJungJong(tempStr);
//     } else if (55216 <= asciiDec && asciiDec <= 55295) {
//       console.log("Hangul Jamo Extended B");
//     } else {
//       console.log("UNVARIFIED");
//     }
//     // getChoJungJong(tempStr);
//   }
// }
//
// getChoJungJong_Text("가가가");
//
// var dice = require('diceCoefficient.js');
// console.log(dice('연세대앞', '연세대학교앞')); //=> 1
//
// //Hangul Jamo Extended a
// //A960~A97F: Jamo
//
// //Hangul Compatibility Jamo
// //3130~314E, 3165~3186 :Ja
// //314F~3163, 3187~3182  :Mo
// //3164 :hangul filer
//
// //Hangul Jamo Extended a
// //A960~A97F: Ja
//
// //Hangul Jamo Extended b
// //D7CB~D7FB: Ja
// //D7B0~D7C6 :mo
// //D7C7~D7CA, D7FC~D7FF : blank
//
// //1100~11FF Hangule Jamo
// //3130~318F Hangul Compatibility Jamo ***
// //A960~A97F Hangul Jamo Extended A
// //AC00~D7AF Hangul Syllables ***
// //D7B0~D7FF Hangul Jamo Extended B
