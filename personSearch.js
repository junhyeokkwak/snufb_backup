var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
var stringSimilarity = require('string-similarity');
const fs = require('fs');

var connection = mysql.createConnection(process.env.DATABASE_URL);

var startPersonSearch = function(event) {
  console.log('START PERSON SEARCH!');
  var task = [
    function(callback) {
      connection.query('SELECT uid FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        // console.log(result[0].uid);
        if (result[0].uid == 0)
        {
          console.log('Need to ask for profile URL');
          connection.query('UPDATE Users SET conv_context="askProfileURL" WHERE user_id=' + event.sender.id);
          api.sendResponse(event, {"text": "이 기능을 처음 사용하는구나! 먼저 너 프로필을 등록해야 하는데 이건 너의 도움이 조금 필요해!\n페이스북 앱에 들어가서 너 프로필 링크를 복사해줄 수 있어?\n사진을 참고해서 링크를 복사하고 여기에 붙여넣기 해줘!"});
          //NEED TO SEND 안내 PICTURE!!!

        } else //if (result[0].uid != 0)
        {
          console.log('No need to ask for profile URL');
          connection.query('UPDATE Users SET conv_context="personSearch_mainMenu" WHERE user_id=' + event.sender.id);
          api.sendResponse(event, {"text": "누구 찾아줄까?", "quick_replies": qr.reply_arrays["personSearchOptions"]});
        }
      });
      callback(null,'done');
    },
    function(err, callback) {

    callback(null);
    }
  ];
  async.waterfall(task);
};

function askProfileURL(event) {
  console.log('====ASKING FOR PROFILE URL====');
  console.log('text is: ' + event.message.text);
  var urlResponse = event.message.text;
  var substring1 = "www.facebook.com/";
  var substring2 = "id=";
  var imptInfo = 0;
  var isProper = 0; // boolean value for whether proper data is submitted

  var task = [
    function(callback) {

      if (urlResponse.indexOf(substring1) !== -1) { // It is a valid facebook URL
        var startIndex = urlResponse.indexOf(substring2); // starting index of 'id='
                if (startIndex !== -1) { // CASE 1. when it is "id=xxxxxx"
                  var strlen = urlResponse.length;
                  imptInfo = urlResponse.substring((startIndex + 3), strlen); // facebook user id
                  console.log("User Data is: " + imptInfo);
                  connection.query('UPDATE Users SET uid=' + imptInfo + ' WHERE user_id=' + event.sender.id);
                  isProper = 1;
                // api.sendResponse(event, {"text": "GOOD!"});
              } else { // CASE 2. when it is www.facebook.com/xxxxx
                    if (urlResponse.length < 300) { // check to see if it is not too long.
                      var startIndex2 = urlResponse.indexOf(substring1);
                      imptInfo = urlResponse.substring((startIndex2 + 17), strlen); // facebook user id
                      console.log("User Data is " + imptInfo);
                      connection.query('UPDATE Users SET uid=\'' + imptInfo + '\'' + ' WHERE user_id=' + event.sender.id);
                      isProper = 1;
                    }
                    else {
                        console.log("Something Wrong");
                      }
                    }
    }
      else {
        console.log("NOT A VALID INPUT");
      }
      callback(null, 'done');

    },
    // function(err, callback) {
    //   connection.query('UPDATE Users SET uid=' + imptInfo + ' WHERE user_id=' + event.sender.id);
    //   callback(null, 'done');
    // },
    function(err, callback) {
      if (isProper) {
        connection.query('UPDATE Users SET conv_context="personSearch_mainMenu" WHERE user_id=' + event.sender.id);
      }
      callback(null, 'done');
    },
    function(err, callback) {
      if (isProper) {
        api.sendResponse(event, {"text": "입력해줘서 고마워! 그럼 누구 찾아줄까?", "quick_replies": qr.reply_arrays["personSearchOptions"]});
      }
      else {
        api.sendResponse(event, {"text": "제대로 입력이 안됐어ㅠㅠ 다시 한번 시도해줄래??"});
      }
      callback(null);
    }
  ]
  async.waterfall(task);
};

function personSearch_mainMenu(event) {
  var inputText = event.message.text;
    switch (inputText) {
      case "선배나 후배!":
          var task = [
            function(callback) {
              connection.query('UPDATE Users SET conv_context="personSearch_alum" WHERE user_id=' + event.sender.id);
              callback(null, 'done');
            },
            function(err, callback) {
              api.sendResponse(event, {"text": "무슨 학과?"});
              callback(null);
            }
          ]
          async.waterfall(task);
          break;
      default:
          var task = [
            function(callback) {
              connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
              callback(null, 'done');
            },
            function(err, callback) {
              api.sendResponse(event, {"text": "기타는 무슨 기타야... 우리 저커버그형한테나 메세지 보내ㅋㅋㅋ"});
              callback(null, 'done');
            },
            function(err, callback) {
              api.sendResponse(event, {"text": "m.me/4"});
              callback(null);
            }
          ]
          async.waterfall(task);
    }

};

function personSearch_alum(event) {
  var inputText = event.message.text;
  var substring1 = "학과";
  if (inputText.indexOf(substring1) == -1)
  {
    api.sendResponse(event, {"text": "엥 뭔가 잘못친거 친거 같은데... \"00학과\"라고 입력해야돼! 다시 입력해줄래?", });
  }
  else {
    var uid = 0;
    var task = [
      function(callback) {
        connection.query('SELECT uid FROM Users WHERE college_major=\'' + event.message.text + '\'', function(err, result, fields) {
          if (err) throw err;
          if (result.length) {
            uid = result[0].uid;
          }
          else { // search result = 0
            api.sendResponse(event, {"text": "미안.. 아직 그 학과는 내가 아는 사람이 없네ㅠㅠ 다른 사람이라도 찾아줄까?"/*, "quick_replies": qr.reply_arrays["YesOrNo"]*/});
            connection.query('UPDATE Users SET conv_context="personSearch_nullcase" WHERE user_id=' + event.sender.id);
          }
          callback(null, 'done'); // 이게 여기 있는 이유는 DB 갔다 오는 시간이 꽤 걸리기 때문에 async 제대로 안되는 문제 해결하기 위해!!
        });
      },
      function(err, callback) {
        if(uid) {
          api.sendResponse(event, {"text": "삐빅- 검색완료!"});
          setTimeout(function () {
            callback(null, 'done');
          }, 1000);
        }
      },
      function(err, callback) {
        if(uid) {
            api.sendResponse(event, {"text": "페이스북 프로필은 www.facebook.com/" + uid + " 고"});
            api.sendResponse(event, {"text": "이 링크를 누르면 직접 페메를 보낼 수 있어!\nm.me/" + uid});
        }
        callback(null, 'done');
      }
    ]
    async.waterfall(task);
  }

};

function personSearch_nullcase(event) {
  var msg = event.message.text;
  var data = fs.readFileSync('./jsondata/basicConv.json', 'utf8');
  var jsonData = JSON.parse(data);
  task = [
    function(callback) {
      callback(null, util.getSimilarStrings(msg, jsonData.agreementArr, -1, jsonData.agreementArr.length));
    },
    function(agreementArr, callback) {
      // console.log("agreeementArr: " + agreementArr[0].similarity);
      if (agreementArr[0].similarity == 0) { // response is 'no'
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      api.sendResponse(event, {"text": "오키 그럼 메인메뉴로 돌아간다! 휘리릭!!!"});
      connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        //console.log(result[0].first_name);
        api.sendResponse(event, {"text": "무엇을 도와드릴까요 " + result[0].first_name + "님?"});
      });
      }
      else // response is 'yes'
      {
        connection.query('UPDATE Users SET conv_context="personSearch_mainMenu" WHERE user_id=' + event.sender.id);
        api.sendResponse(event, {"text": "누구 찾아줄까?", "quick_replies": qr.reply_arrays["personSearchOptions"]});
      }
    }
  ]
  async.waterfall(task);
}

module.exports = {
  functionMatch: {
    "사람찾기": startPersonSearch,
   "askProfileURL": askProfileURL,
   "personSearch_mainMenu": personSearch_mainMenu,
   "personSearch_alum": personSearch_alum,
   "personSearch_nullcase": personSearch_nullcase,
  }
};
