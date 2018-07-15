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
        callback(null);
      }
    ]
    async.waterfall(task);
//    }
//  }
}

function profName(event) {
  console.log('PROFESSOR NAME INPUT');
  var task = [
    function(callback) {
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      connection.query('SELECT email FROM ewhaProf WHERE name=\'' + event.message.text + '\'', function(err, result, fields) {
        if (err) throw err;
        if (result.length) {
          api.sendResponse(event, {"text": result[0].email + " 이야!"});
        } else {
          api.sendResponse(event, {"text": "미안, 아직 업데이트가 덜 돼서 그 교수님은 못 찾겠다ㅠㅠ 다른 분이라도 찾아줄까?", "quick_replies": qr.reply_arrays["YesOrNo"]});
          connection.query('UPDATE Users SET conv_context="profError" WHERE user_id=' + event.sender.id);
        }

      });
      callback(null);
    }
  ]
  async.waterfall(task);
}

function profError(event) {
  if (event.message.text == "응"){
    var task = [
      function(callback) {
        connection.query('UPDATE Users SET conv_context="profName" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback) {
        api.sendResponse(event, {"text": "어떤 교수님 검색해줄까?"});
        callback(null);
      }
    ]
    async.waterfall(task);
  } else {
    var task = [
      function(callback) {
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback) {
        api.sendResponse(event, {"text": "알겠어ㅠㅠ 다른 도움 필요하면 얘기해!"});
        callback(null);
      }
    ]
    async.waterfall(task);
  }
}

//
//   connection.query('SELECT email FROM ewhaProf WHERE name=' + event.message.text, function(err, result, fields) {
//     var profEmail = result[0].email;
//     var task = [
//       function(callback) {
//         connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
//         console.log("ProfEmail: " + profEmail);
//         callback(null, 'done');
//       },
//       function(err, callback) {
//         api.sendResponse(event, {"text": profEmail + " 인 것 같은데?"});
//       }
//     ]
//     async.waterfall(task);
//
//   });
// }



module.exports = {
  functionMatch: {
    "교수님 검색": profSearch,
    "교수님 이메일 좀!": profSearch,
    "profName": profName,
    "profError": profError,

  }
};
