var fileNameList = ["./UserSetup.js", "./love.js", "./mentor.js", "./bab.js", "./restaurant.js", "./utilfunctions.js", "./joke.js", "./professor.js", "./personSearch.js", "./bus.js", "./randomMatching.js"];
var functionSheet = [];
var sampleArray = ["맛집 찾아줘", "배고파", "교수님 검색", "랜덤매칭", "친구 소개해주라", "버스", "영어농담", "구구야!", "버그 제보", "개발자와 연락하기"];

fileNameList.forEach(function (fileName) {
    var funclist = require(fileName).functionMatch;
    functionSheet = Object.assign(functionSheet, funclist);
});

module.exports = functionSheet;
module.exports.beta = sampleArray;
