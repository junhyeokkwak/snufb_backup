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

module.exports = {
  functionMatch: {
    "선배한테 조언": introduce_mentor,
    "기타": query_demand1,
    "다른 선배": query_demand1,
    "query_demand2": query_demand2
  }
}
