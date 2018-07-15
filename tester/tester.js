
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
      fs.writeFile('myjsonfile.json', json, 'utf8', callback);
      fs.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          fs.writeFile('myjsonfile.json', JSON.stringify(busNumEntity), 'utf8', callback); // write it back
        }
      });

    }
  }
}

busNumEntityGenerator(Object.keys(busRouteJsonData.busNum_busRouteId));
