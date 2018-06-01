var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js", "./bab.js", "./restaurant.js", "./utilfunctions"];
var functionSheet = [];

fileNameList.forEach(function (fileName) {
    var funclist = require(fileName).functionMatch;
    functionSheet = Object.assign(functionSheet, funclist);
});

module.exports = functionSheet;
