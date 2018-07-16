var request = require("request");
var mysql = require("mysql");
var connection = mysql.createConnection(process.env.DATABASE_URL);

//reset conv_context
function reset(event) {
  console.log('RUN : reset - RESET CONV');
  connection.query('UPDATE Users SET conv_context="none",busNum="none",busRouteId="none",stNm="none",stId="none" WHERE user_id=' + event.sender.id);
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

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}



module.exports.Josa = Josa;
module.exports.choose = choose;
module.exports = {
    functionMatch: {
        "RESET" : reset,
        "generateQuickReplies" : generateQuickReplies,
    }
};
