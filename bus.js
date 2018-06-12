var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');

const BUS_SERVICE_KEY = process.env.BUS_SERVICE_KEY;
//XML to json
// var querystring = require('querystring');
// var parseString = require('xml2js').parseString;

var connection = mysql.createConnection(process.env.DATABASE_URL);

var initBusConv = function(event) {
  console.log('RUN initBusConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="busTest" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      var messageData = {"text": "몇번 버스? 어느 정류장?"};
      // var qrBusRoute = qr.generateQuickReplies(["153번", "160", "162", "171", "172"]);
      // var messageData = {"text": "몇번 버스??", "quick_replies": qrBusRoute};
      api.sendResponse(event, messageData);
      callback(null);
    }
  ];
  async.waterfall(task);
};

var busTest = function(event) {
  console.log('TEST busTest');
  if (event.message.text.indexOf('/') > -1) {
    console.log('VALID busTest INPUT');
    var txt = event.message.text;
    var busNum, stName, busRouteId, stId;
    busNum = txt.split("/")[0].replace(" ","");
    stName =txt.split("/")[1].replace(" ","");
    console.log(`busNum: [${busNum}] stName: [${stName}]`);

    if (busNum == "153" || "153번") busRouteId = 100100032;
    if (stName == "연세대앞" || "연대앞") stId = 112000012;
    console.log(`busRouteId: [${busRouteId}] stId: [${stId}]`);

    getBusArriveInfo(busRouteId, stId);
  } else {
    console.log('INVALID busTest INPUT');
  }
};

var getBusArriveInfo = function(busRouteId, stId) {
  console.log("RUN getBusArriveInfo");
  var ord = getArrInfoByRouteAll(busRouteId, stId);
}

var getArrInfoByRouteAll = function(busRouteId, stId) {
  console.log("RUN getArrInfoByRouteAll");
  // NOTE: pseudo!!
  var options = 'http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll?busRouteId=100100032&ServiceKey=oEeIDLG02CY9JZd%2B5nya9BiYG5zTPp7eQK6HmeuMzSCPrAqc%2BDUt7C11sk%2Fk7RQyLBGhXk7eJ8MV7OM369flUw%3D%3D';
  // {
  //   method: 'GET',
  //   url: 'http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll',
  //   qs:
  //    { busRouteId: '100100033',
  //      ServiceKey: 'oEeIDLG02CY9JZd%2B5nya9BiYG5zTPp7eQK6HmeuMzSCPrAqc%2BDUt7C11sk%2Fk7RQyLBGhXk7eJ8MV7OM369flUw%3D%3D' },
  //   headers:
  //    { 'Postman-Token': 'ac0bcd25-9858-4f0e-b95c-abf41565c675',
  //      'Cache-Control': 'no-cache' }
  // };
  var ord;
  var task = [
    function(callback) {
      request(options, function (error, response, body) {
        var err;
        if (error) throw new Error(error);
        // console.log("XML: " + body);
        var xmlData = body;
        var jsonStrData = convert.xml2json(xmlData, {compact: true, spaces: 4});
        var jsonData = JSON.parse(jsonStrData);
        //console.log(JSON.parse(body));
        console.log("TESTING JSON DATA:" + jsonData);
        console.log("SERVICE RESULT: " + jsonData.ServiceResult);
        console.log("HEADERMSG: " + jsonData.ServiceResult.msgHeader.headerMsg._text);
        if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("인증실패") > 0) {
          console.log("인증실패: data.go.kr ");
        } else {
          console.log("인증성공: data.go.kr");
          console.log("TESTING ITEM 1:" + jsonData.ServiceResult.msgBody.itemList[0]);
          jsonData.ServiceResult.msgBody.itemList.forEach((item) => {
            if (item.stId === stId) ord = item.staOrd;
          });
        }
        callback(null, err);
      });
    },
    function(err, callback) {
      console.log("ORD: " + ord);
      callback(null);
    },
  ];
  async.waterfall(task);
  if (ord != null) return ord;
  return null;
}

// var busConv_1_Number = function(event) {
//   console.log('RUN busConv_1_Number');
//   if (event.message.text == "153번" || "160번" || "162번" || "171번" || "172번") {
//     var busRouteId;
//     var task = [
//       function(callback) {
//         var err;
//         console.log('VALID BUSNUM');
//         connection.query('UPDATE Users SET conv_context="busConv_2_Station" WHERE user_id=' + event.sender.id);
//         //put butRouteId in mysql
//         callback(null, err);
//       },
//       function(err, callback) {
//         var qrBusStation = qr.generateQuickReplies(["연세대앞", "신촌기차역", "신촌역2호선", "신촌로터리"]);
//         var messageData = {"text": "어느 정류장??", "quick_replies": qrBusStation};
//         api.sendResponse(event, messageData);
//         callback(null);
//       }
//     ];
//     async.waterfall(task);
//   } else {
//     console.log('INVALID BUSNUM');
//     connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
//   }
// };
//
// var busConv_2_Station = function(event) {
//   console.log('RUN busConv_2_Station');
//   if (event.message.text == "연세대앞" || "신촌기차역" || "신촌역2호선" || "신촌로터리") {
//     var stId;
//     var task = [
//       function(callback) {
//         var err;
//         console.log('VALID stId');
//         connection.query('UPDATE Users SET conv_context="busConv_3_Print" WHERE user_id=' + event.sender.id);
//         //put stId in mysql
//         callback(null, err);
//       },
//       function(err, callback) {
//         var messageData = {"text": `busRouteId: ${busRouteId} stId: ${stId}`};
//         api.sendResponse(event, messageData);
//         callback(null);
//       }
//     ];
//     async.waterfall(task);
//   } else {
//     console.log('INVALID stId');
//     connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
//   }
// };
//
// var busConv_3_Print = function(event) {
//   console.log("RUN busConv_3_Print");
//   connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
//   var messageData = {"text": `busRouteId: ${busRouteId} stId: ${stId}`};
//   api.sendResponse(event, messageData);
// }

module.exports = {
  functionMatch: {
    "버스": initBusConv,
    "busTest" : busTest,
    // "busConv_1_Number" : busConv_1_Number,
    // "busConv_2_Station" : busConv_2_Station,
    // "busConv_3_Print" : busConv_3_Print,
  }
};