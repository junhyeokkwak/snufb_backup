var fs=require('fs');
var bodyparser=require('body-parser');
var stringSimilarity = require('string-similarity');

var data=fs.readFileSync('../jsondata/busRouteJsonData.json', 'utf8');
var jsonData=JSON.parse(data);

var findSimilarStrings = function(targetString, arr, criterion, number, callback) {
  if (typeof targetString != "string" || typeof arr != "object" || typeof (criterion && number) != "number" ) {
    console.log("INVALID INPUTTYPE for findSimilarStrings");
  } else {
    console.log("VALID INPUTTYPE for findSimilarStrings");
    var possibleStringsArr = [] , resultArr = [], count = 0;
    for (var i = 0; i < arr.length; i++) {
      if (stringSimilarity.compareTwoStrings(targetString, arr[i]) > criterion) {
        count++;
        var item;
        item = { "_text" : arr[i], "similarity" : stringSimilarity.compareTwoStrings(targetString, arr[i])}
        possibleStringsArr.push(item);
      }
    } // terminate for loop
    console.log(count);
    possibleStringsArr.sort((a, b) => b.similarity - a.similarity)
    // console.log(possibleStringsArr);
    resultArr = possibleStringsArr.slice(0,number);
    console.log("resultArr: " + resultArr);
    callback(resultArr);
  }
}

findSimilarStrings("153번", jsonData.busNumArr, 0, 5, function(resultArr) {
  console.log(resultArr);
  for (var i = 0; i < resultArr.length; i++) {
    console.log(resultArr[i]._text);
  }
});

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
