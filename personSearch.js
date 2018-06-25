var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

var startPersonSearch = function(event) {
  console.log('START PERSON SEARCH');
  var task = [
    function(callback) {
      connection.query('SELECT uid FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        // console.log(result[0].uid);
        if (result[0].uid == 0)
        {
          console.log('Need to ask for profile URL');
        };
        callback(null,'done');
      })
    },
    function(err, callback) {

    callback(null);
    }
  ];
  async.waterfall(task);
};

module.exports = {
  functionMatch: {
    "사람찾기": startPersonSearch,
  }
};
