var request = require("request");
var qr = require('./quick_replies');
var api = require('./apiCalls')
var async = require('async');
var mysql = require("mysql");
var app = require('./app');
var images = require(app.IMAGE_SOURCE);

var connection = mysql.createConnection(process.env.DATABASE_URL);

// checks one more time whether the user is new, and then register into database
// then asks whether he/she goes to SNU
function registerUser(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
  if (process.env.DATABASE_URL==null) {
    console.log('ERR: THERE IS NO DATABASE CONNECTED TO THE SERVER');
  } else if (process.env.DATABASE_URL.indexOf('temporary123!')>-1){
    ////////////////////SQL///////////////////
    request({
      url: "https://graph.facebook.com/v2.6/" + senderID,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        locale: "ko_KR",
        fields: "first_name,last_name,gender,profile_pic"
      },
      method: "GET"
    }, function(error, response, body) {
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var task = [
          function(callback) {
            guguImages.helloImage(event);
            api.sendResponse(event, {"text": "안녕!"});
            setTimeout(function () {
              callback(null, 'done');
            }, 5000);
          },
          function (err, callback) {
            var bodyObj = JSON.parse(body);
            var first_name = bodyObj.first_name;
            var last_name = bodyObj.last_name;
            var gender = bodyObj.gender;
            var profile_pic = bodyObj.profile_pic;
            console.log("PROFILE PIC: "+ profile_pic);
            console.log("first_name: " + first_name);
            //console.log("PROFILE_PIC URL: " + profile_pic);
            connection.query('SELECT * FROM Users WHERE user_id=' + senderID, function(err, result, fields) {
              if (result.length == 0){
                //set conv_context as register1
                connection.query('INSERT INTO Users (user_id, first_name, last_name, sex, conv_context, profile_pic) VALUES ('+ event.sender.id + ', "' + first_name + '","' + last_name + '","' + gender + '",' + '"register1"' + ',"' + profile_pic + '")');
              }
            } );
            callback(null, first_name);
          },
          function (first_name, callback) {
          //  api.sendResponse(event, {"text": "에이 요 와썹"});
            api.sendResponse(event, {"text": `난 ${app.MASCOT_NAME}라고 해! 넌 ${first_name} 맞지?`, "quick_replies": qr.reply_arrays["YesOrNo"]});
            callback(null); // need to edit in the future.
          }
          // function(err, callback){
          //   api.sendOnlineImage(event, "https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/11406841_1456462501330433_4226271548300377992_n.png?_nc_cat=0&oh=8785ba7bf0bd75c4ffa828b2ff3af167&oe=5BA7D701");
          //   callback(null);
          // }
        ];
        async.waterfall(task);
      }
    });
    ////////////////////SQL///////////////////
  } else {
    console.log('ERR: func_registerUser - no DB');
  }
}

// 이름이 확실히 맞는지에 대한 확인 단계
function register1(event) {
  if (event.message.text == "응"){
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="checkSchool" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        api.sendResponse(event, {"text": `오키! 학교는 ${app.UNIV_NAME} 다니는거구?`, "quick_replies": qr.reply_arrays["YesOrNo"]});
        // api.handleWebview(event, "등록","https://campus-buddies-snu.herokuapp.com/register")
        callback(null);
      }
    ]
  } else {
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="changeName1" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        api.sendResponse(event, {"text":"미안... 내가 실수했나 보네ㅠㅠ 그럼 이름이 뭐야? \n(내가 불러줬으면 하는 대로 이름만!! 쳐줘!)"});
        callback(null);
      }
    ]
  }
  async.waterfall(task);
}

//이름에 문제가 있을 시 수정하는 단계
function changeName1(event) {
  var task = [
    function(callback) {
      connection.query('UPDATE Users SET conv_context="register1" WHERE user_id=' + event.sender.id);
      connection.query('UPDATE Users SET first_name=' + '"' + event.message.text + '"' + ' WHERE user_id=' + event.sender.id);
      callback(null, 'done');
    },
    function(err, callback) {
        api.sendResponse(event, {"text":"오키 그럼 " + event.message.text + "(이)라고 부르면 돼?", "quick_replies": qr.reply_arrays["YesOrNo"]});
        callback(null);
    }
  ]
  async.waterfall(task);
}

// 기존 register1 (학교 서울대 맞아? 에 대한 대답.)
function checkSchool(event) {
  if (event.message.text == "응"){
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="register2" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        // api.sendResponse(event, {"text":"그럼 학과/학번 좀 입력해줄래?\n입력하고 \"입력완료\"라고 말해줘!"});
        api.sendResponse(event, {"text":"그럼 학과/학번 좀 입력해줄래?\n입력하고 다시 말 걸어줘!!ㅋㅋ"});
        var title = "등록하기!";
        var url = process.env.HEROKU_URL + "/register";
        // api.handleWebview(event, title, url, "compact");
        handleRegiPage(event);
        callback(null);
      }
    ]
  } else {
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="notStudent" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback) {
        guguImages.confusedImage(event);
        setTimeout(function() {
          callback(null, 'done');
        }, 1000);
      },
      function(err, callback){
        api.sendResponse(event, {"text":"앗 그렇구나! 내가 너네 학교 봇이 있는지 알아보고 소개해줄게!"});
        callback(null);
      }
    ]
  }
  async.waterfall(task);
}

function register2(event) {
  var task = [
    function(callback){
      connection.query('UPDATE Users SET conv_context="callChatbotTest" WHERE user_id=' + event.sender.id);
      // experiment (extracting data from database)
      connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        //console.log(result[0].first_name);
        api.sendResponse(event, {"text": result[0].first_name + " 고마워!"});
      });
      callback(null, 'done');
    },

    function(err, callback) {
      guguImages.blingblingImage(event);
      setTimeout(function () {
        callback(null, 'done');
      }, 1500);
    },

    function(err, callback){
      api.sendResponse(event, {"text":"그럼 이제 내 소개를 해볼까?"});
      callback(null, 'done');
    },
    function(err, callback){
      api.typingBubble(event);
      setTimeout(function() {
        api.sendResponse(event, {"text": `나는 자타공인 우리 대학교 최고 인싸, 칼답을 자랑하는 \'${app.MASCOT_NAME}\'라고해!!`});
        callback(null, 'done');
      }, 1000);
    },
    function(err, callback){
      api.typingBubble(event);
      setTimeout(function() {
        api.sendResponse(event, {"text": "맛집이나 교통정보도 내가 빠삭하게 알고, 내가 아는 친구들을 너한테 소개해줄 수도 있어!"});
        callback(null, 'done');
      }, 2000);
    },
    function(err, callback){
      api.typingBubble(event);
      setTimeout(function() {
        api.sendResponse(event, {"text": "내가 필요할때면 아무때나 페메하면 돼! 한번 해볼래?", "quick_replies": qr.reply_arrays["gugu"]});
        callback(null, 'done');
      }, 2000);
    },
  ]
  async.waterfall(task);
}

function callChatbotTest(event) {
  var inputText = event.message.text;
  var substring1 = "구구";
  setTimeout(function() {
    if (inputText.indexOf(substring1) !== -1) {
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      api.sendResponse(event, {"text": "응응! 앞으로도 그렇게 부르면 돼!!ㅎㅎ 그럼 내가 뭘 도와줄까?", "quick_replies": qr.reply_arrays["betaMenu"]});
    }
  }, 1000);
}

function notStudent(event) {
  api.sendResponse(event, {"text": `나는 ${app.UNIV_NAME} 담당이니까 너희 학교 봇한테 말 걸어줘`});
}

var handleRegiPage = function(event) {
  console.log("RUN handleRegiPage!");
  var url;
  var handleRegiPageHelper = function(event) {
    console.log('RUN bus_busRouteWebviewHelper1');
    app.APP.get(`/registration/${app.UNIV_NAME_ENG}/${event.sender.id}`, function(req, res){
      url = `/registration/${app.UNIV_NAME_ENG}/${event.sender.id}`
      var data = {
        targetStNm: targetStNm,
        positionData: JSON.stringify(positionData),
      }
      res.render(__dirname + '/webviews/registration.html', data);
    });
    app.APP.post(`/registration/${app.UNIV_NAME_ENG}/${event.sender.id}`, function(req, res){

      console.log("REGISTRATION NEW: ");
      console.log(req.body);
      connection.query('UPDATE Users SET college_major="' + req.body.newRegiMajor + '" WHERE user_id=' + req.body.user_psid);
      connection.query('UPDATE Users SET student_number="' + req.body.newRegiClass + '" WHERE user_id=' + req.body.user_psid);
      res.status(200).end();

      var responseData = {'result' : 'ok', 'data' : req.body.data}
      res.json(responseData);
    });
  }
  handleRegiPageHelper(event);
  api.handleWebview(event, "title", url, "compact");
}

module.exports = {
  functionMatch: {
    "registerUser": registerUser,
    "register1": register1,
    "register2": register2,
    "notStudent": notStudent,
    "changeName1": changeName1,
    "checkSchool": checkSchool,
    //temporary additions
    "메뉴": register2,
    "callChatbotTest": callChatbotTest,
  }
}


// 기존 register1 (학교 서울대 맞아? 에 대한 대답.)
// function register1(event) {
//   if (event.message.text == "응"){
//     var task = [
//       function(callback){
//         connection.query('UPDATE Users SET conv_context="register2" WHERE user_id=' + event.sender.id);
//         callback(null, 'done');
//       },
//       function(err, callback){
//         api.sendResponse(event, {"text":"무슨 과?"});
//         // api.handleWebview(event, "등록","https://campus-buddies-snu.herokuapp.com/register")
//         callback(null);
//       }
//     ]
//   } else {
//     var task = [
//       function(callback){
//         connection.query('UPDATE Users SET conv_context="notStudent" WHERE user_id=' + event.sender.id);
//         callback(null, 'done');
//       },
//       function(err, callback){
//         api.sendResponse(event, {"text":"그럼 너희 학교 담당 봇한테 가!"});
//         callback(null);
//       }
//     ]
//   }
//   async.waterfall(task);
// }
