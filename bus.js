var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

//XML to json
// var querystring = require('querystring');
// var parseString = require('xml2js').parseString;

var connection = mysql.createConnection(process.env.DATABASE_URL);

var initBusConv = function(event) {
  console.log('RUN initBusConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="busConv_1_Number" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      var qrBusRoute = qr.generateQuickReplies(["153번", "160", "162", "171", "172"]);
      var messageData = {"text": "몇번 버스??", "quick_replies": qrBusRoute};
      api.sendResponse(event, messageData);
      callback(null);
    }
  ];
  async.waterfall(task);
};

var busConv_1_Number = function(event) {
  console.log('RUN busConv_1_Number');
  if (event.message.text == "153번" || "160" || "162" || "171" || "172") {
    var busRouteId;
    var task = [
      function(callback) {
        var err;
        console.log('VALID BUSNUM');
        connection.query('UPDATE Users SET conv_context="busConv_2_Number" WHERE user_id=' + event.sender.id);
        if (event.message.text == "153번") busRouteId = 100100032;
        callback(null, err);
      },
      function(err, callback) {
        var qrBusStation = qr.generateQuickReplies(["연세대앞", "신촌기차역", "신촌역2호선", "신촌로터리"]);
        var messageData = {"text": "어느 정류장??", "quick_replies": qrBusStation};
        api.sendResponse(event, messageData);
        callback(null);
      }
    ];
    async.waterfall(task);
  } else {
    console.log('INVALID BUSNUM');
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  }
};


module.exports = {
  functionMatch: {
    "버스": initBusConv,
    "busConv_1_Number" : busConv_1_Number,
    "busConv_2_Station" : busConv_1_Station,
  }
};
