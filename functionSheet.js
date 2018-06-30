<<<<<<< HEAD
﻿var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js", "./bab.js", "./restaurant.js", "./utilfunctions.js", "./joke.js", "./professor.js", "./personSearch.js"];
=======
﻿var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js", "./bab.js", "./restaurant.js", "./utilfunctions.js", './bus.js'];
>>>>>>> 7a13ab923aaafeb8fe2ce2ae0f41c2bf11a21ac6
var functionSheet = [];

fileNameList.forEach(function (fileName) {
    var funclist = require(fileName).functionMatch;
    functionSheet = Object.assign(functionSheet, funclist);
});

module.exports = functionSheet;
