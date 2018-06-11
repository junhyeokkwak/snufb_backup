var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

function profSearch(event) {
  console.log('START PROFESSOR SEARCH');
  // function(error, response, body) {
  //   if (error) throw new Error(error);
  //   else {
    var task = [
      function(callback) {
        connection.query('UPDATE Users SET conv_context="profName" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback) {
        api.sendResponse(event, {"text": "어떤 교수님 검색해줄까?"});
      }
    ]
    async.waterfall(task);
//    }
//  }
}

function profName(event) {
  console.log('PROFESSOR NAME INPUT');
  connection.query('SELECT email FROM ewhaProf WHERE name=' + event.message.text, function(err, result, fields) {
    //if (err) throw err;
    var profEmail = result[0].email;
    var task = [
      function(callback) {
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
        console.log("ProfEmail: " + profEmail);
        callback(null, 'done');
      },
      function(err, callback) {
        api.sendResponse(event, {"text": profEmail + " 인 것 같은데?"});
      }
    ]
    async.waterfall(task);

  });
}



module.exports = {
  functionMatch: {
    "교수님 검색": profSearch,
    "profName": profName,

  }
};
