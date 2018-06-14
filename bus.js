var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');
const fs = require('fs');

const BUS_SERVICE_KEY = process.env.BUS_SERVICE_KEY;

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
    var messageData = {"text": "버스 노선 데이터를 받아오는데 시간이 조금걸려!ㅠㅠ 조금만 기다려줘"};
    api.sendResponse(event, messageData);

    getBusArriveInfo(busRouteId, stId, function(res) {
        console.log("RESULT of getBusArriveInfo: " + res);
    });

  } else {
    console.log('INVALID busTest INPUT');
    var messageData = {"text": "아직 데이터 베이스에 없는 버스번호/정류장 이름이야!"};
    api.sendResponse(event, messageData);
  }
};

var getBusArriveInfo = function(busRouteId, stId, callback) {
  console.log("RUN getBusArriveInfo");
  var staOrd, options;
  getArrInfoByRouteAll(busRouteId, stId, function(res){
    console.log("staOrd:" + res);
    staOrd = res;
  });
  console.log(`getBusArriveInfo busRouteId:[${busRouteId}] stId:[${stId}] staOrd:[${staOrd}]`);
  var options_url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute`;
  var options_busRouteId = `?busRouteId=${busRouteId}`;
  var options_ord = `?ord=${staOrd}`;
  var options_ServiceKey = `&ServiceKey=${process.env.BUS_SERVICE_KEY}`;
  options = options_url + options_busRouteId + options_ord + options_ServiceKey;

  request(options, function (error, response, body) {
    var err;
    if (error) throw new Error(error);
    var xmlData = body;
    var jsonStrData_Compact = convert.xml2json(xmlData, {compact: true, spaces: 4});
    var jsonData = JSON.parse(jsonStrData_Compact);
    console.log("typeof jsonData: " + typeof jsonData);
    console.log("JSON TEST: " + JSON.stringify(jsonData));
    console.log("HEADERMSG: " + JSON.stringify(jsonData.ServiceResult.msgHeader.headerMsg._text));
    // console.log("TESTING ITEM 1:" + JSON.stringify(jsonData.ServiceResult.msgBody.itemList[0]));
    // if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("인증실패") > 0) {
    //   console.log("인증실패: data.go.kr ");
    // } else {
    //   console.log("인증성공: data.go.kr");
    //   jsonData.ServiceResult.msgBody.itemList.forEach((item) => {
    //     if (item.stId._text == "112000012") {
    //       ord = item.staOrd._text;
    //       console.log("ORD FOUND: " + ord);
    //       callback(ord);
    //     }
    //   });
    // }
  });

  callback("options URL: " + options);

  // var staOrd = getArrInfoByRouteAll(busRouteId, stId);
  // console.log(`staOrd: ${staOrd} TYPE: ${typeof staOrd}`);
}

var getArrInfoByRouteAll = function(busRouteId, stId, callback) {
  console.log("STID: " + stId);
  console.log("RUN getArrInfoByRouteAll");
  var options, ord;
  var stId_target = stId;
  if (typeof stId != "string") {
    stId_target = stId.toString();
  }
  console.log(`STID: ${stId_target} TYPE of STID: ${typeof stId_target}`);
  var options_url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll`;
  var options_busRouteId = `?busRouteId=${busRouteId}`;
  var options_ServiceKey = `&ServiceKey=${process.env.BUS_SERVICE_KEY}`

  options = options_url + options_busRouteId + options_ServiceKey;

  request(options, function (error, response, body) {
    var err;
    if (error) throw new Error(error);
    var xmlData = body;
    var jsonStrData_Compact = convert.xml2json(xmlData, {compact: true, spaces: 4});
    var jsonData = JSON.parse(jsonStrData_Compact);
    console.log("typeof jsonData: " + typeof jsonData);
    // var nth = 0;
    // console.log(`COMPACT::: ${nth}th item's ${nth} station NAME: ${jsonData.ServiceResult.msgBody.itemList[nth].stNm._text}`); // 북한산우이역
    console.log("HEADERMSG: " + JSON.stringify(jsonData.ServiceResult.msgHeader.headerMsg._text));
    // console.log("TESTING ITEM 1:" + JSON.stringify(jsonData.ServiceResult.msgBody.itemList[0]));
    if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("인증실패") > 0) {
      console.log("인증실패: data.go.kr");
      callback("인증실패: data.go.kr");
    } else {
      console.log("인증성공: data.go.kr");
      var itemListSize = jsonData.ServiceResult.msgBody.itemList.length;
      console.log();
      for (var i = 0; i < itemListSize; i++) {
          if (jsonData.ServiceResult.msgBody.itemList[i].stId._text == stId_target) {
            ord = jsonData.ServiceResult.msgBody.itemList[i].staOrd._text;
            console.log("ORD FOUND: " + ord);
            callback(ord);
          } else if (i >= itemListSize) {
            callback("STAORD NOTFOUND");
          }
      }

      // jsonData.ServiceResult.msgBody.itemList.forEach((item) => {
      //   if (item.stId._text == "112000012") {
      //     ord = item.staOrd._text;
      //     console.log("ORD FOUND: " + ord);
      //     callback(ord);
      //   }
      // });

    }
  });
  // callback("ORD NOTFOUND");
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
