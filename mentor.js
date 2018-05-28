var api = require("./apiCalls");
var async = require('async');
var qr = require("./quick_replies.js");
var mysql = require('mysql');
var connection = mysql.createConnection(process.env.DATABASE_URL);

function query_demand1(event){
  var task = [
    function(callback){
      connection.query('UPDATE Users SET conv_context="query_demand2" WHERE user_id=' + event.sender.id);
      callback(null, 'done');
    },
    function(err, callback){
      var messageData = {"text": "어떻게 도와줄까? 찾고있는 사람 있어?"};
      api.sendResponse(event, messageData);
      callback(null);
    }]
  async.waterfall(task);
}

function query_demand2(event){
  var task = [
    function(callback){
      connection.query('INSERT INTO Suggestions (demanded_query) VALUES ("' + event.message.text + '")');
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      callback(null, 'done');
    },
    function(err, callback){
      var messageData = {"text": "오케이 찾으면 연락줄게!"};
      api.sendResponse(event, messageData);
      callback(null);
    }]
  async.waterfall(task);
}

function introduce_mentor(event){
  var messageData = {"text": "어떤 선배?", "quick_replies": qr.reply_arrays["Mentor_type"]};
  api.sendResponse(event, messageData);
}

function major_mentor(event){
  var task = [
    function(callback){
      connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function (err, result, fields){
        callback(null, result);
      });
    },
    function(result, callback){
      connection.query('INSERT INTO Mentor_Questions (user_id, college_major) VALUES ("' + event.sender.id + '","'+ result[0].college_major+ '")');
      connection.query('UPDATE Users SET conv_context="ask_mentor" WHERE user_id=' + event.sender.id);
      callback(null, result);
    },
    function(result, callback){
      var messageData = {"text": '"' + result[0].college_major + '"' + " 맞지? 선배한테 묻고 싶은 질문이 뭐야?"};
      api.sendResponse(event, messageData);
      callback(null);
    }];
  async.waterfall(task);
}

function ask_mentor(event){
  var task = [
    function(callback){
      connection.query('UPDATE Mentor_Questions SET question="' + event.message.text + '" WHERE user_id=' + event.sender.id);
      var messageData = {"text": "물어보고 알려줄겡"}
      api.sendResponse(event, messageData)
      callback(null, 'done');
    },
    function (err, callback){
      connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function (err, result, fields){
        callback(null, result[0].college_major);
      });
    },
    function (major, callback){
      connection.query('SELECT * FROM Users WHERE college_major="' + major +'"', function (err, result, fields) {
        var messageData = {"text": "후배가 물어보는데 대답 좀 해줘:\n" + event.message.text};
        api.sendMessage(result[1].user_id, messageData);
        callback(null);
      });
    }
  ];
  async.waterfall(task);
}

module.exports = {
  functionMatch: {
    "선배한테 조언": introduce_mentor,
    "기타": query_demand1,
    "다른 선배": query_demand1,
    "query_demand2": query_demand2,
    "과 고학번 선배": major_mentor,
    "ask_mentor": ask_mentor
  }
}
