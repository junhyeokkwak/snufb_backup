var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('mysql');
var path = require('path');
var stringSimilarity = require('kor-string-similarity');
const https = require('https');
var app = require('./app')
var functionSheet = require('./functionSheet');
var util = require('./utilfunctions');
var api = require('./apiCalls')
var images = require('./images-yonsei');
var qr = require('./quick_replies');

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
	var i1, i2, code1, code2, josaResult = '';
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

var initHungryConv = function(event) {
  console.log("RUN initHungryConv");
  var textArr = ["ㅋㅋㅋ바보 미리미리 먹지ㅠ 학식먹을래? 아니면 밖에서 먹을래?", "아이고 어떡해..학식 먹고싶어? 아니면 밖에서 먹고싶어?", "얼른 뭐 먹을지 추천해줄게! 학식? 아니면 맛집?"]
  var text = choose(textArr);
  var messageData = {"text": text};
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.sendResponse(event, messageData);
}

var initBadLangConv = function(event) {
  var textArr = ["어허", "어허 그러면 안돼", "ㅠㅠㅠㅠㅠㅠㅠㅠ말이 너무 심하네", "입에 뭔가 물은 것 같아!", "씁", "떽", "그걸 욕이라고 한거야?ㅋ", "나는 욕 못할 것 같지?"]
  var text = choose(textArr);
  var messageData = {"text": text};
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.sendResponse(event, messageData);
}

var initHelloConv = function(event) {
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  // images.helloImage(event);
  connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
    if (err) throw err;
    var name = JOSA(result[0].first_name, "아");
    var textArr = [`${name} 안녕~~~`, `${name} 안녕안녕`, `${name} 하이하이!`, `${name} 반가워:)`, `${name} 안녕안녕ㅇ:)`, `요 왓썹 맨~`]
    var text = choose(textArr);
    var messageData = {"text": text};
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    api.sendResponse(event, messageData);
  });
}

var callChatbot = function(event) {
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  // images.helloImage(event);
  setTimeout(function() {
    connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
      if (err) throw err;
      var name = JOSA(result[0].first_name, "아");
      var textArr = [`${name} 무슨 일이야?`, `${name} 무슨 일있어?`, `${name} 도움이 필요하니?`, `${name} 무슨 일이얌`, `${name} 왜?? 무슨 일 있니?`]
      var text = choose(textArr);
      api.sendResponse(event, {"text": text, "quick_replies": qr.reply_arrays["betaMenu"]});
    });
  }, 2500);
}


var conv_sendRandom = function(event, arr) {
  // connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  // images.helloImage(event);
    connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
      if (err) throw err;
      var text = choose(arr);
      api.typingBubble(event);
      api.sendResponse(event, {"text": text});
    });
}

var conv_doNotUnderstand = function(event){
  console.log("conv_doNotUnderstand");
  connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
    if (err) throw err;
    var name = JOSA(result[0].first_name, "dk");
    var textArr1 = [`${name} 무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var textArr2 = [`혹시 내가 뭘 할 수 있는지 아직 모르겠으면 알려달라고 해!`, `내가 뭘 해줄 수 있는지 아직 모른다면 알려달라고 해줘!`, `내가 할 수 있는게 궁금하다면 말해!`];
    api.sendResponse(event, {"text": `${choose(textArr1)} ${choose(textArr2)}`, "quick_replies" : qr.generateQuickReplies["뭘 해줄 수 있니??"]});
  });
}

var initTutorialConv =function(event) {
  images.infoImage(event);
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  setTimeout(function() {
    var textArr1 = [`나는 이런 것 들을 할 수 있어!!`, `내가 할 수 있는 것들이야:)`, `지금 내가 해줄 수 있는 것들이야!ㅎㅎ`];
    var textArr2 = [`뭘 해줄까?`, `어떻게 도와줄까?`, `뭐 필요한 거 있니`, `말만 해!!`]
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    api.sendResponse(event, {"text": `${choose(textArr1)} ${choose(textArr2)}`, "quick_replies": qr.reply_arrays["betaMenu"]});
  }, 3000);
}

function whatAreYouDoing(event) {
  var textArr = ['너랑 페메하고 있지~', '너 놀아주고 있자나!', '너랑 연락중!', '하고싶은건 데이트지만... 너랑 페메하고 있지ㅠㅠ', '셀카 찍고있어', '너 생각', '아휴 뭐가 그리 궁금해 안그래도 더워서 불쾌지수 높은디!'];
  api.typingBubble(event);
  setTimeout(function () {
    api.sendResponse(event, {"text": `${choose(textArr)}`});
  }, 1000);
}

function funnyReaction(event) {
  var textArr = ['웃으면 복이오니깐 많이 웃으렴!', '너가 웃으면 나도 좋아~ (으 개오글거려)', '나도 웃을래! 하하하하하하하하하하', '내가 말하는게 좀 웃긴가? 이참에 개그맨 될까봐', 'ㅎㅎ', '웃으면 복이와요~', '나랑 대화하는거 재밌지? 그니깐 나랑 많이 놀아줘!!', '그래 삶이 힘든데 나랑 연락할때라도 웃어야지ㅋㅋㅋ'];
  api.typingBubble(event);
  setTimeout(function () {
    api.sendResponse(event, {"text": `${choose(textArr)}`});
  }, 1000);
}

function sendSelfie(event) {
  images.randomImage(event);
  var textArr = ['짠', '어때?', '짜잔', '아이 부끄러워라'];
  setTimeout(function () {
    api.typingBubble(event);
    api.sendResponse(event, {"text": `${choose(textArr)}`});
  }, 2500);
}

function lovelyReaction(event) {
  var textArr = ['고마워ㅎㅎ', '부끄러워~~', '고마워!ㅎㅎ', '아구 너밖에 없다ㅠㅠ 사랑해!', 'ㅎㅎㅎ 사랑해요 :)', 'ㅎㅎㅎ 사랑해요 <3'];
  api.sendResponse(event, {"text": `${choose(textArr)}`});
}

function thanksReaction(event) {
  var textArr = ['에이 이정도야 뭐~ 언제든지 연락해!', '이정돈 기본이지~', '응응! 앞으로도 자주 연락하구구~', '노프라블럼!'];
  api.sendResponse(event, {"text": `${choose(textArr)}`});
}



module.exports = {
    functionMatch: {
        "initTutorialConv" : initTutorialConv,
        "initHungryConv" : initHungryConv,
        "initBadLangConv": initBadLangConv,
        "initHelloConv" : initHelloConv,
        "callChatbot" : callChatbot,
        "callChatbot_yonsei" : callChatbot,
        "fallback" : conv_doNotUnderstand,
        "whatAreYouDoing" : whatAreYouDoing,
        "funnyReaction": funnyReaction,
        "sendSelfie": sendSelfie,
        "lovelyReaction": lovelyReaction,
        "thanksReaction": thanksReaction
        // "initAskFunctionConv" : initAskFunctionConv,

    }
};
