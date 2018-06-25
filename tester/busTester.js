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

var stringData = "/";
for(var i = 0; i < testData.positions.length; i++) {
  var str = `xpos${i}=${testData.positions[i].xpos}&ypos${i}=${testData.positions[i].xpos}&`;
  stringData+=str;
}
console.log(stringData.substring(1,stringData.length-1));
stringData = stringData.substring(1,stringData.length-1)

var emptyJson = {};
stringData.split('&').forEach(item => {
  emptyJson[item.split("=")[0]] = item.split("=")[1];
})
console.log(emptyJson);

// console.log(typeof testData);
// console.log(JSON.stringify(testData));
// console.log(typeof JSON.stringify(testData));
// var stringData = JSON.stringify(testData);

// console.log(JSON.parse(stringData));
// console.log(JSON.parse(stringData).positions[0].xpos);

// 'https://cb-practice.herokuapp.com/busRoute/xpos=126.9348325761&ypos=37.5540291075'
