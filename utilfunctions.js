var request = require("request");
var mysql = require("mysql");
var connection = mysql.createConnection(process.env.DATABASE_URL);

//reset conv_context
function reset(event) {
  console.log('RUN : reset - RESET CONV');
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
}

function generateQuickReplies(arr){
  var quick_replies = []
  for (var i = 0; i < arr.length; i++) {
    var new_quick_replies = {
      "content_type": "text",
      "title": arr[i],
      "payload": arr[i],
    };
    quick_replies.push(new_quick_replies);
  }
};

function Josa(txt, josa){
	var code = txt.charCodeAt(txt.length-1) - 44032;
	var cho = 19, jung = 21, jong=28;
	var i1, i2, code1, code2;
	// 원본 문구가 없을때는 빈 문자열 반환
	if (txt.length == 0) return '';
	// 한글이 아닐때
	if (code < 0 || code > 11171) return txt;
  var jong
	if (code % 28 == 0) {
    jong = false;
    if (josa == '을' || josa == '를') josaResult = (jong?'을':'를');
    if (josa == '이' || josa == '가') josaResult = (jong?'이':'가');
    if (josa == '은' || josa == '는') josaResult = (jong?'은':'는');
    if (josa == '와' || josa == '과') josaResult = (jong?'와':'과');
    return txt + josaResult;
  } else {
    jong = true;
    if (josa == '을' || josa == '를') josaResult = (jong?'을':'를');
    if (josa == '이' || josa == '가') josaResult = (jong?'이':'가');
    if (josa == '은' || josa == '는') josaResult = (jong?'은':'는');
    if (josa == '와' || josa == '과') josaResult = (jong?'와':'과');
    return txt + josaResult;
  }
}
module.exports.Josa = Josa;

function testWebview(event){
  console.log("RUN testWebview");
  var title = "TEST";
  var url = process.env.HEROKU_URL + '/register';
  var size = "compact";
  api.handleWebview(event, title, url, size)
}

function sayhi(targetString, arr, criterion, number) {
  console.log("HI");
}

// var stringSimilarity = require('string-similarity');
function findSimilarStrings(targetString, arr, criterion, number) {
  if (typeof targetString != "string" || typeof arr != "object" || typeof (criterion && number) != "number" || number > arr.length) {
    console.log("INVALID INPUTTYPE for findSimilarStrings");
  } else {
    console.log("VALID INPUTTYPE for findSimilarStrings");
    var possibleStringsArr = [] , resultArr = [], count = 0;
    for (var i = 0; i < arr.length; i++) {
      if (stringSimilarity.compareTwoStrings(targetString, arr[i]) >= criterion) {
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
    return(resultArr);
  }
}

module.exports = {
    sayhi : sayhi,
    stringSimilarity : stringSimilarity,
    functionMatch: {
        "RESET" : reset,
        "generateQuickReplies" : generateQuickReplies,
        "TEST WEBVIEW" : testWebview,
    }
};
