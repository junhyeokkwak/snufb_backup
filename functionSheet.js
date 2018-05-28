var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js"];
var functionSheet = [];

fileNameList.forEach(function (fileName) {
    var funclist = require(fileName).functionMatch;
    functionSheet = Object.assign(functionSheet, funclist);
});

module.exports = functionSheet;
