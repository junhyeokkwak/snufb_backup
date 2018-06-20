var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');
var bodyparser=require('body-parser');
var stringSimilarity = require('string-similarity');
const fs = require('fs');

const BUS_SERVICE_KEY = process.env.BUS_SERVICE_KEY;

var connection = mysql.createConnection(process.env.DATABASE_URL);

// var initBusConv = function(event) {
//   console.log('RUN initBusConv');
//   var task = [
//     function(callback){
//       var err;
//       connection.query('UPDATE Users SET conv_context="bus_stNmORbusN" WHERE user_id=' + event.sender.id);
//       callback(null, err);
//     },
//     function(err, callback){
//       var messageData = {"text": "정류장 이름으로 찾을래? 아니면 버스 번호로 찾을래?"};
//       api.sendResponse(event, messageData);
//       callback(null);
//     }
//   ];
//   async.waterfall(task);
// };

var initBusConv = function(event) {
  console.log('RUN initBusConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="bus_stNmORbusNum" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      var messageData = {"text": "정류장 이름으로 찾을래? 아니면 버스 번호로 찾을래?"};
      api.sendResponse(event, messageData);
      callback(null);
    }
  ];
  async.waterfall(task);
};

var bus_stNmORbusNum = function(event) {
  // console.log("RUN bus_stNmORbusNum");
  // var msg = event.message.text;
  // console.log(stringSimilarity.findBestMatch(msg, ["번호", "정류장"]));
  // var stNmORbusNum = stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target;
  // console.log(stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch);
  // // console.log(stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating + (typeof stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating));
  // if (stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating == 0){
  //   console.log("MSG UNVARIFIED");
  //   connection.query('UPDATE Users SET conv_context="bus_stNmORbusNum" WHERE user_id=' + event.sender.id);
  //   var messageData = {"text": "미안ㅠㅠ무슨 말인지 모르겠어..조금 다르게 다시 말해 줄 수 있어?"};
  //   api.sendResponse(event, messageData);
  // } else if (stNmORbusNum == "번호") {
  //   console.log("번호");
  //   connection.query('UPDATE Users SET conv_context="bus_busNum" WHERE user_id=' + event.sender.id);
  // } else if (stNmORbusNum == "정류장") {
  //   console.log("정류장");
  //   connection.query('UPDATE Users SET conv_context="bus_stNm" WHERE user_id=' + event.sender.id);
  // }
  console.log("RUN bus_stNmORbusNum");
  var msg = event.message.text;
  console.log(util.findSimilarStrings(msg, ["번호", "정류장"],-1, 2));
  var stNmORbusNum = util.findSimilarStrings(msg, ["번호", "정류장"],-1, 2)._text;
}



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

    getBusArriveInfo(busRouteId, stId, function(resultData) {
      console.log("resultData"+resultData);
      if (resultData == ("결과없음"&&"인증실패")) {
        console.log("FUCK IT");
      } else {
        console.log("RESULT of getBusArriveInfo: " + JSON.stringify(resultData));
        // console.log("in busTest arrmsg1: " + resultData.arrmsg1);
        var arrmsg1_final, arrmsg2_final, extramsg;
        if (resultData.arrmsg1.indexOf("곧") > -1) {
          arrmsg1_final = '곧 도착하구';
          extramsg = '얼른 뛰어가!!'
        } else {
          arrmsg1_final = resultData.arrmsg1 + '에 도착하구';
          extramsg = '서둘러 가는게 좋겠지??'
        }
        if (resultData.arrmsg2 == "곧 도착") {
          arrmsg2_final = '곧 도착해!!';
        } else {
          arrmsg2_final = resultData.arrmsg2 + '에 도착해!!';
        }
        var entiremsg_final = `${stName}으로 오는 첫번째 ${busNum} 버스는 ${arrmsg1_final}, 두번째 버스는 ${arrmsg2_final} ${extramsg}`;
        var messageData = {"text": entiremsg_final.replace(/['"]+/g, '')};
        api.sendResponse(event, messageData);
      }
    });
  } else {
    console.log('INVALID busTest INPUT');
    var messageData = {"text": "아직 데이터 베이스에 없는 버스번호/정류장 이름이야!"};
    api.sendResponse(event, messageData);
  }
};


var getBusArriveInfo = function(busRouteId, stId, callback) {
  console.log("RUN getBusArriveInfo");
  var staOrd, options, arrmsg1, arrmsg2, resultData;
  getStaOrd_fromInside(busRouteId, stId, function(res){
    console.log("IN getBusArriveInfo staOrd:" + res);
    staOrd = res;
    console.log(`getBusArriveInfo busRouteId:[${busRouteId}] stId:[${stId}] staOrd:[${staOrd}]`);
    var options_url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute`;
    var options_ServiceKey = `?ServiceKey=${process.env.BUS_SERVICE_KEY}`;
    var options_busRouteId = `&busRouteId=${busRouteId}`;
    var options_stId = `&stId=${stId}`
    var options_ord = `&ord=${staOrd}`;
    options = options_url + options_ServiceKey + options_busRouteId + options_stId + options_ord;
    console.log("OPTIONS URL: " + options);
    // options = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?ServiceKey=oEeIDLG02CY9JZd%2B5nya9BiYG5zTPp7eQK6HmeuMzSCPrAqc%2BDUt7C11sk%2Fk7RQyLBGhXk7eJ8MV7OM369flUw%3D%3D&busRouteId=100100032&stId=112000012&ord=47`;
    request(options, function (error, response, body) {
      var err;
      if (error) throw new Error(error);
      var xmlData = body;
      var jsonStrData_Compact = convert.xml2json(xmlData, {compact: true, spaces: 4});
      var jsonData = JSON.parse(jsonStrData_Compact);
      console.log("typeof jsonData: " + typeof jsonData);
      // console.log("JSON TEST for getBusArriveInfo: " + JSON.stringify(jsonData));
      console.log("HEADERMSG: " + JSON.stringify(jsonData.ServiceResult.msgHeader.headerMsg._text));
      if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("인증실패") > -1) {
        console.log("인증실패");
        callback("인증실패");
      } else if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("결과가 없습니다.") > -1) {
        console.log("결과없음");
        callback("결과없음");
      } else {
        console.log("인증성공: data.go.kr");
        console.log("arrmsg1: " + JSON.stringify(jsonData.ServiceResult.msgBody.itemList.arrmsg1._text));
        console.log("arrmsg2: " + JSON.stringify(jsonData.ServiceResult.msgBody.itemList.arrmsg2._text));
        arrmsg1 = JSON.stringify(jsonData.ServiceResult.msgBody.itemList.arrmsg1._text);
        arrmsg2 = JSON.stringify(jsonData.ServiceResult.msgBody.itemList.arrmsg2._text)
        resultData = {
          "arrmsg1" : arrmsg1,
          "arrmsg2" : arrmsg2,
        }
        callback(resultData);
      }
    });

  });
}

var getStaOrd_fromInside = function(busRouteId, stId, callback) {
  console.log("RUN getArrInfoByRouteAll_fromInside");
  var options, ord, staOrdArr = [];
  var data=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
  var jsonData=JSON.parse(data);
  if (typeof stId != "string") {
    stId_target = stId.toString();
  }
  console.log(`STID: ${stId_target} TYPE of STID: ${typeof stId_target}`);
  var itemListSize = jsonData.busRouteId_stId_staOrd.length;
  console.log(itemListSize)
  for (var i = 0; i < itemListSize; i++) {
    if (jsonData.busRouteId_stId_staOrd[i].stId == stId && jsonData.busRouteId_stId_staOrd[i].busRouteId == busRouteId) {
      ord = jsonData.busRouteId_stId_staOrd[i].staOrd;
      console.log("ORD FOUND: " + ord);
      callback(ord);
    }
  }
}


var getStaOrd_fromOutside = function(busRouteId, stId, callback) {
  // console.log("STID: " + stId);
  console.log("RUN getArrInfoByRouteAll_fromOutside");
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
    }
  });
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
    "bus_stNmORbusNum" : bus_stNmORbusNum,
    // "busConv_1_Number" : busConv_1_Number,
    // "busConv_2_Station" : busConv_2_Station,
    // "busConv_3_Print" : busConv_3_Print,
  }
};
