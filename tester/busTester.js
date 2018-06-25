var fs=require('fs');
var bodyparser=require('body-parser');
var stringSimilarity = require('string-similarity');

// /xpos=126.9348325761&ypos=37.5540291075
var testData = {
  positions : [
    {
      "xpos" : 126.9348325761,
      "ypos" : 37.5540291075
    },
    {
      "xpos" : 126.9348325761,
      "ypos" : 37.5540291075
    }
  ]
}

console.log(typeof testData);
console.log(JSON.stringify(testData));
console.log(typeof JSON.stringify(testData));
var stringData = JSON.stringify(testData);

console.log(JSON.parse(stringData));
console.log(JSON.parse(stringData).positions[0].xpos);

// 'https://cb-practice.herokuapp.com/busRoute/xpos=126.9348325761&ypos=37.5540291075'



// var data=fs.readFileSync('../jsondata/busRouteJsonData.json', 'utf8');
// var jsonData=JSON.parse(data);
//
// console.log(stringSimilarity.findBestMatch("연세대학교", ["연대", "고대"]));
// console.log(stringSimilarity.findBestMatch("yonsei university", ["yonsei dae", "koryeo dae"]));
//
// var findSimilarStrings = function(targetString, arr, criterion, number, callback) {
//   if (typeof targetString != "string" || typeof arr != "object" || typeof (criterion && number) != "number" ) {
//     console.log("INVALID INPUTTYPE for findSimilarStrings");
//   } else {
//     console.log("VALID INPUTTYPE for findSimilarStrings");
//     var possibleStringsArr = [] , resultArr = [], count = 0;
//     for (var i = 0; i < arr.length; i++) {
//       if (stringSimilarity.compareTwoStrings(targetString, arr[i]) > criterion) {
//         count++;
//         var item;
//         item = { "_text" : arr[i], "similarity" : stringSimilarity.compareTwoStrings(targetString, arr[i])}
//         possibleStringsArr.push(item);
//       }
//     } // terminate for loop
//     console.log(count);
//     possibleStringsArr.sort((a, b) => b.similarity - a.similarity)
//     // console.log(possibleStringsArr);
//     resultArr = possibleStringsArr.slice(0,number);
//     console.log("resultArr: " + resultArr);
//     callback(resultArr);
//   }
// }
//
// console.log(jsonData.busNum_busRouteId[`163`]);
//
// findSimilarStrings("153번", jsonData.busNumArr, 0, 5, function(resultArr) {
//   console.log(resultArr);
//   for (var i = 0; i < resultArr.length; i++) {
//     console.log(resultArr[i]._text);
//   }
// });

// console.log(findSimilarStrings("연대앞", jsonData.stNameArr, 0.1, 10));


// var stNameData = [];
//
// for (var i = 0; i < jsonData.stNameArr.length; i++ ) {
//   // console.log(jsonData.stNameArr[i].stNm);
//   var item = `"${jsonData.stNameArr[i].stNm}"`
//   stNameData.push(item);
// }
//
// console.log(stNameData[0]);
// fs.writeFile("stNameString.txt", stNameData, function(err) {
//     if(err) {
//         return console.log(err);
//     }
//     console.log("The file was saved!");
// });
