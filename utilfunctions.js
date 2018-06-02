var request = require("request");
var api = require("./apiCalls");
var async = require("async");
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

function getJosa(txt, josa)
{
	var code = txt.charCodeAt(txt.length-1) - 44032;
	var cho = 19, jung = 21, jong=28;
	var i1, i2, code1, code2;
	// empty str
	if (txt.length == 0) {
    console.log("TXT is not JOSA");
    return '';
  }
  // !Korean
	if (code < 0 || code > 11171) {
    console.log("TXT is not JOSA");
    return txt;
  }
  // Korean
	if (code % 28 == 0) return txt + getJosaHelper(josa, false);
	else return txt + getJosaHelper(josa, true);
}

getJosaHelper = function (josa, jong) {
	// jong : true면 받침있음, false면 받침없음
	if (josa == '을' || josa == '를') return (jong?'을':'를');
	if (josa == '이' || josa == '가') return (jong?'이':'가');
	if (josa == '은' || josa == '는') return (jong?'은':'는');
	if (josa == '와' || josa == '과') return (jong?'와':'과');
	// Undefined 조사
	return '**';
}

module.exports.getJosa = getJosa;

module.exports = {
    functionMatch: {
        "RESET" : reset,
        "generateQuickReplies" : generateQuickReplies,
    }
};
