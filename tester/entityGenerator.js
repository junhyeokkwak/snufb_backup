
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');
var bodyparser=require('body-parser');
const fs = require('fs');


var busRouteFile=fs.readFileSync('../jsondata/busRouteJsonData.json', 'utf8');
var busRouteJsonData = JSON.parse(busRouteFile);

var busNumArr = Object.keys(busRouteJsonData.busNum_busRouteId);
// console.log(busNumArr);

var busNumEntityGenerator = function(busNumArr) {
  console.log("RUN busNumEntityGenerator");
  console.log(busNumArr.length);
  busNumEntity = [];
  for (var i = 0; i < busNumArr.length; i++) {
    var tempJson = {};
    var num =  busNumArr[i] + "";
    tempJson.value = num;
    tempJson.synonyms = [num, num + "번"];
    busNumEntity.push(tempJson);
    // console.log(tempJson);
    if (i == busNumArr.length-1) {
      // return busNumEntity;
      console.log(JSON.stringify(busNumEntity));
      fs.writeFile ("busNumEntity.json", JSON.stringify(busNumEntity), function(err) {
          if (err) throw err;
          console.log('complete');
          }
      );

    }
  }
}


var stNmEntityGenerator = function(stNmArr) {
  console.log("RUN stNmEntityGenerator");
  stNmEntity = [];
  for (var i = 0; i < stNmArr.length; i++) {
    var tempJson = {};
    var temp = stNmArr[i].replace(/["'()]/g," ");
    var stNm = temp + "";
    tempJson.value = stNm;
    tempJson.synonyms = [stNm, stNm + "에", stNm + " 정류장에", stNm + " 정류장", stNm + " 정거장", stNm + " 정거장에", stNm + " 역", stNm + "역에"];
    stNmEntity.push(tempJson);
    // console.log(tempJson);
    if (i == stNmArr.length-1) {
      // return busNumEntity;
      console.log(JSON.stringify(stNmEntity));
      fs.writeFile ("stNmEntity.json", JSON.stringify(stNmEntity), function(err) {
          if (err) throw err;
          console.log('complete');
          }
      );

    }
  }
}
// stNmEntityGenerator(busRouteJsonData.stNameArr);
// busNumEntityGenerator(Object.keys(busRouteJsonData.busNum_busRouteId));

// function choose(choices) {
//   var index = Math.floor(Math.random() * choices.length);
//   return choices[index];
// }
//
// console.log(choose(["a", "b", "c", "d", "e", "f"]));
