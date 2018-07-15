
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');
var bodyparser=require('body-parser');
var stringSimilarity = require('kor-string-similarity');
const fs = require('fs');


var basicConvFile=fs.readFileSync('../jsondata/basicConv.json', 'utf8');
var busRouteFile=fs.readFileSync('../jsondata/busRouteJsonData.json', 'utf8');
var basicConv=JSON.parse(basicConvFile), busRouteJsonData = JSON.parse(busRouteFile);

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
      console.log(busNumEntity);
    }
  }
}

busNumEntityGenerator(Object.keys(busRouteJsonData.busNum_busRouteId));
