var fs=require('fs');
var bodyparser=require('body-parser');
var stringSimilarity = require('string-similarity');

// var positionData = [
//     {
//         "busRouteId": "100100124",
//         "plainNo": "0017",
//         "staOrd": "1",
//         "stNm": "청암자이아파트",
//         "xpos": "126.9465552752",
//         "ypos": "37.5345469961",
//         "stId": "102000271",
//         "stNum": "03689"
//     },
//     {
//         "busRouteId": "100100124",
//         "plainNo": "0017",
//         "staOrd": "2",
//         "stNm": "청암동강변삼성아파트",
//         "xpos": "126.9493177472",
//         "ypos": "37.5339679073",
//         "stId": "102000204",
//         "stNum": "03298"
//     },
//     {
//         "busRouteId": "100100124",
//         "plainNo": "0017",
//         "staOrd": "3",
//         "stNm": "청심경로당",
//         "xpos": "126.9505603371",
//         "ypos": "37.5337062146",
//         "stId": "102000227",
//         "stNum": "03321"
//     },
//     {
//         "busRouteId": "100100124",
//         "plainNo": "0017",
//
//
//         "staOrd": "4",
//         "stNm": "원효2동주민센터",
//         "xpos": "126.9509503798",
//         "ypos": "37.5342145962",
//         "stId": "102000210",
//         "stNum": "03304"
//     },
//     {
//         "busRouteId": "100100124",
//         "plainNo": "0017",
//         "staOrd": "5",
//         "stNm": "산천동",
//         "xpos": "126.9540093495",
//         "ypos": "37.5353394953",
//         "stId": "102000212",
//         "stNum": "03306"
//     }
// ]

var positionData_str = '[{"busRouteId":"100100032","plainNo":"153","staOrd":"50","stNm":"신촌로터리","xpos":"126.9348325761","ypos":"37.5540291075","stId":"113000113","stNum":"14204"},{"busRouteId":"100100032","plainNo":"153","staOrd":"79","stNm":"신촌로터리","xpos":"126.9356825619","ypos":"37.5540511998","stId":"113000114","stNum":"14205"}] ';

var handleMultipleSt = function(positionData_str) {
  console.log(positionData_str);
  var positionData = JSON.parse(positionData_str);
  console.log(positionData.length);
  for(var i = 0; i < positionData.length; i++) {
    console.log(positionData[i].xpos);
    console.log(positionData[i].ypos);
    // createMarker()
  }
}

handleMultipleSt(positionData_str);
//
// var createMarker = function(num, xpos, ypos){
//   if (typeof xpos != number) xpos = pareseInt(xpos);
//   if (typeof ypos != number) ypos = pareseInt(ypos);
//   return new naver.maps.Marker({
//     position: new naver.maps.LatLng(ypos, xpos),
//     map: map
//   });
// }

// for (var i = 0; i < 5; i++) {
//   tempMarker = 0;
//   eval(`var marker${i} = ${tempMarker};` );
//   if (i == 4) {
//     console.log(marker0);
//   }
// }
//
// console.log(pareseInt(3));
