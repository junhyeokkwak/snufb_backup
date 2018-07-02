var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

var startJoke = function(event) {
  console.log('START JOKE');
  var jokeContent = {
    method: 'GET',
    url : 'http://api.yomomma.info/'
  //  qs :
  }
  var task = [
    function(callback) {
      var err;
      callback(null, 'done');
    },
    function(err, callback) {
      request(jokeContent, function(error, response, body) {
        if (error) throw new Error(error);
        var jokeString = JSON.parse(body).joke;
        console.log(jokeString);
        api.sendResponse(event, {'text' : jokeString});
      //  api.sendResponse(event, {'text' : })

    });
    callback(null);
    }
  ];
  async.waterfall(task);
};

function deleteMe(event) {
  connection.query('SET SQL_SAFE_UPDATES = 0; DELETE FROM cb_users_jun.Users WHERE user_id=' + event.sender.id + '; SET SQL_SAFE_UPDATES = 1;');
}

module.exports = {
  functionMatch: {
    "영어농담": startJoke,
    "또 해줘": startJoke,
    "Delete me": deleteMe,

  }
};
