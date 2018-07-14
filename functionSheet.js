var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js", "./bab.js", "./restaurant.js", "./utilfunctions.js", "./joke.js", "./professor.js", "./personSearch.js", "./bus.js", "./randomMatching.js"];
var functionSheet = [];
var sampleArray = ["맛집", "배고파"];

fileNameList.forEach(function (fileName) {
    var funclist = require(fileName).functionMatch;
    functionSheet = Object.assign(functionSheet, funclist);
});

module.exports = functionSheet;
module.exports.beta = sampleArray;
