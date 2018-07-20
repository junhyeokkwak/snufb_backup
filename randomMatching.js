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
var profileExtractTutorialPhoto_1 = 'https://www.facebook.com/2056586864557088/photos/a.2098975333651574.1073741828.2056586864557088/2099008640314910/?type=3';
var profileExtractTutorialPhoto_2 = 'https://www.facebook.com/2056586864557088/photos/a.2098975333651574.1073741828.2056586864557088/2099008636981577/?type=3';

var startRandomMatching = function(event) {
  console.log('START RANDOM MATCHING!');
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
          api.handleMediaTemplate(event, "image", profileExtractTutorialPhoto_1);
          setTimeout(function() {
            api.handleMediaTemplate(event, "image", profileExtractTutorialPhoto_2);
          }, 1000);
        } else //if (result[0].uid != 0)
        {
          console.log('No need to ask for profile URL');
          connection.query('UPDATE Users SET conv_context="randomMatching_gender" WHERE user_id=' + event.sender.id);
          api.sendResponse(event, {"text": "누구 찾아줄까?", "quick_replies": qr.reply_arrays["genderOptions"]});
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
        connection.query('UPDATE Users SET conv_context="randomMatching_gender" WHERE user_id=' + event.sender.id);
      }
      callback(null, 'done');
    },
    function(err, callback) {
      if (isProper) {
        api.sendResponse(event, {"text": "입력해줘서 고마워! 그럼 누구 찾아줄까?", "quick_replies": qr.reply_arrays["genderOptions"]});
      }
      else {
        api.sendResponse(event, {"text": "제대로 입력이 안됐어ㅠㅠ 다시 한번 시도해줄래??"});
      }
      callback(null);
    }
  ]
  async.waterfall(task);
};

function randomMatching_gender(event) {
  var inputText = event.message.text;

  if ((inputText !== "남성") && (inputText !== "여성") && (inputText !== "상관없어"))
  {
    api.sendResponse(event, {"text": "엥 뭔가 잘못친거 같은데... 다시 입력해줄래?", "quick_replies": qr.reply_arrays["genderOptions"]});
  }
  else {
    var uid = 0;
    var target_first_name, target_last_name, target_profile_pic;
    var task = [
      function(callback) {
        if(inputText == "남성" || inputText == "여성") {
          console.log("MEN OR WOMEN");
          // connection.query('SELECT * FROM Users WHERE sex=\'남성\' AND uid!=\'0\'', function(err, result, fields) {
          connection.query('SELECT * FROM Users WHERE sex=\'' + inputText + '\' AND uid!=\'0\'', function(err, result, fields) {
            if (err) throw err;
            if (result.length) {
              var randomNumber;
              randomNumber = Math.floor(Math.random() * (result.length));
              uid = result[randomNumber].uid;
              target_first_name = result[randomNumber].first_name;
              target_last_name = result[randomNumber].last_name;
              target_profile_pic = result[randomNumber].profile_pic;
              // console.log(uid + " " + target_first_name + " " + target_profile_pic);
            }
            else { // search result = 0
              api.sendResponse(event, {"text": "미안.. 아직 매칭해줄 사람이 없다ㅠㅠ 메인 메뉴로 돌아갈게..!"/*, "quick_replies": qr.reply_arrays["YesOrNo"]*/});
              connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
            }
            callback(null, 'done'); // 이게 여기 있는 이유는 DB 갔다 오는 시간이 꽤 걸리기 때문에 async 제대로 안되는 문제 해결하기 위해!!
          });
        } else {
          connection.query('SELECT * FROM Users', function(err, result, fields) {
            if (err) throw err;
            if (result.length) {
              var randomNumber;
              randomNumber = Math.floor(Math.random() * (result.length));
              uid = result[randomNumber].uid;
              target_first_name = result[randomNumber].first_name;
              target_last_name = result[randomNumber].last_name;
              target_profile_pic = result[randomNumber].profile_pic;
              // console.log(uid + " " + target_first_name + " " + target_profile_pic);
            }
            else { // search result = 0
              api.sendResponse(event, {"text": "미안.. 아직 매칭해줄 사람이 없다ㅠㅠ 메인 메뉴로 돌아갈게..!"/*, "quick_replies": qr.reply_arrays["YesOrNo"]*/});
              connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
            }
            callback(null, 'done'); // 이게 여기 있는 이유는 DB 갔다 오는 시간이 꽤 걸리기 때문에 async 제대로 안되는 문제 해결하기 위해!!
          });
        }
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
            // api.sendResponse(event, {"text": "페이스북 프로필은 www.facebook.com/" + uid + " 고"});
            // api.sendResponse(event, {"text": "이 링크를 누르면 직접 페메를 보낼 수 있어!\nm.me/" + uid});
            var url = "https://m.me/" + uid;
            var profileURL = "https://www.facebook.com/" + uid;
            // api.handlePersonSearchWebview(event, title, url, uid);
            // api.handleWebview(event, "페이스북 프로필 보기", profileURL, "full");
            api.handlePersonSearchWebview(event, "페이스북 프로필 열기", profileURL, uid, target_first_name, target_last_name, target_profile_pic);
            setTimeout(function() {
            api.handleButton(event, "직접 연락해봐!", url);
          }, 500);
        }
        callback(null, 'done');
      },
      function(err, callback) {
        setTimeout(function () {
          if(uid) {
            api.sendResponse(event, {"text": "나 좀 짱이지?ㅎㅎ 그럼 이 친구랑 연락 잘하고 나 또 필요하면 연락해!"});
            connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
          }
          callback(null, 'done');
        }, 1000);
      }
    ]
    async.waterfall(task);
  }

};

function randomMatching_nullcase(event) {
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
        connection.query('UPDATE Users SET conv_context="randomSearch_mainMenu" WHERE user_id=' + event.sender.id);
        api.sendResponse(event, {"text": "누구 찾아줄까?", "quick_replies": qr.reply_arrays["personSearchOptions"]});
      }
    }
  ]
  async.waterfall(task);
}

module.exports = {
  functionMatch: {
    "랜덤매칭": startRandomMatching,
    "친구 소개해주라": startRandomMatching,
   "askProfileURL": askProfileURL,
   // "randomMatching_mainMenu": randomMatching_mainMenu,
   "randomMatching_gender": randomMatching_gender,
   "randomMatching_nullcase": randomMatching_nullcase,
  }
};
