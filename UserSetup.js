var request = require("request");
var qr = require('./quick_replies');
var api = require('./apiCalls')
var async = require('async');
var mysql = require("mysql");

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
        fields: "first_name,last_name,gender"
      },
      method: "GET"
    }, function(error, response, body) {
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var task = [
          function (callback) {
            var bodyObj = JSON.parse(body);
            var first_name = bodyObj.first_name;
            var last_name = bodyObj.last_name;
            var gender = bodyObj.gender;
            connection.query('SELECT * FROM Users WHERE user_id=' + senderID, function(err, result, fields) {
              if (result.length == 0){
                //set conv_context as register1
                connection.query('INSERT INTO Users (user_id, first_name, last_name, sex, conv_context) VALUES ('+ event.sender.id + ', "' + first_name + '","' + last_name + '","' + gender + '",' + '"register1"' + ')');
              }
            } );
            callback(null, first_name);
          },
          function (first_name, callback) {
          //  api.sendResponse(event, {"text": "에이 요 와썹"});
            api.sendResponse(event, {"text":"안녕! 난 설대봇이라고 해. 넌 " + first_name + " 맞지?", "quick_replies": qr.reply_arrays["YesOrNo"]});
            callback(null);
          }
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
        api.sendResponse(event, {"text":"오키! 학교는 서울대 다니는거구?", "quick_replies": qr.reply_arrays["YesOrNo"]});
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
        api.sendResponse(event, {"text":"무슨 과?"});
        var title = "등록하기!";
        var url = process.env.HEROKU_URL + "/register";
        api.handleWebview(event, title, url, "tall");
        callback(null);
      }
    ]
  } else {
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="notStudent" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
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
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      connection.query('UPDATE Users SET college_major=' + '"' + event.message.text + '"' + ' WHERE user_id=' + event.sender.id);
      callback(null, 'done');
    },
    function(err, callback){
      api.sendResponse(event, {"text":"문송하네.. ㅠㅠ 뭐 쨌든 나는 캠퍼스 최고의 인싸 (이름)이야.\n너가 조언을 구하거나 만나고 싶은 사람이 있다면 말만 해! 소개시켜줄게 :~)",
        "quick_replies": qr.reply_arrays["Menu"]});
      callback(null);
    }
  ]
  async.waterfall(task);
}

function notStudent(event) {
  api.sendResponse(event, {"text": "나는 서울대 담당이니까 너희 학교 봇한테 말 걸어줘"})
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
    "메뉴": register2
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
