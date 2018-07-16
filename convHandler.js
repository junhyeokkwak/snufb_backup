var bodyParser = require('body-parser');
var request = require('request');
var functionSheet = require('./functionSheet');
var util = require('./utilfunctions');
var api = require('./apiCalls')
var guguImages = require('./guguImages');
var mysql = require('mysql');
var path = require('path');
var stringSimilarity = require('kor-string-similarity');

const https = require('https');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
var connection = mysql.createConnection(process.env.DATABASE_URL);

var apiai = require('apiai');
var nlpapp = apiai("542cfeef5714428193dc4478760de396");


var choose = function(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

var JOSA = function(txt, josa){
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
    if (josa == '아' || josa == '야') josaResult = (jong?'아':'야');
    return txt + josaResult;
  } else {
    jong = true;
    if (josa == '을' || josa == '를') josaResult = (jong?'을':'를');
    if (josa == '이' || josa == '가') josaResult = (jong?'이':'가');
    if (josa == '은' || josa == '는') josaResult = (jong?'은':'는');
    if (josa == '와' || josa == '과') josaResult = (jong?'와':'과');
    if (josa == '아' || josa == '야') josaResult = (jong?'아':'야');
    return txt + josaResult;
  }
}


var initBadLangConv = function(event) {
  var textArr = ["어허", "어허 그러면 안돼", "ㅠㅠㅠㅠㅠㅠㅠㅠ말이 너무 심하네", "입에 뭔가 물은 것 같아!", "씁", "떽", "못된것만 배웠어"]
  var text = choose(textArr);
  var messageData = {"text": text};
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.sendResponse(event, messageData);
}

function callChatbot(event) {
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  guguImages.helloImage(event);
  setTimeout(function() {
    connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
      if (err) throw err;
      var name = JOSA(result[0].first_name, "dk");
      var textArr = [`${name} 무슨 일이야?`, `${name} 무슨 일있어?`, `${name} 필요한 일 있어?`, `${name} 무슨 일이얌`, `${name} 왜??무슨 일 있니?`]
      var text = choose(textArr);
      api.sendResponse(event, {"text": text, "quick_replies": qr.reply_arrays["betaMenu"]});
    });
  }, 2500);
}

module.exports = {
    functionMatch: {
        "initBadLangConv": initBadLangConv,
        "callChatbot" : callChatbot,
        "callChatbot_yonsei" : callChatbot,
    }
};
