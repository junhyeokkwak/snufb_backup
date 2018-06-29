var app = require("./app");
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
  console.log("RUN bus_stNmORbusNum");
  var msg = event.message.text;
  console.log(util.getSimilarStrings(msg,  ["번호", "정류장"], -1, 2));
  var stNmORbusNum = util.getSimilarStrings(msg,  ["번호", "정류장"], -1, 2)[0]._text;
  // console.log(stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating + (typeof stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating));
  if (util.getSimilarStrings(msg,  ["번호", "정류장"], -1, 2)[0].similarity == 0){
    console.log("MSG UNVARIFIED");
    connection.query('UPDATE Users SET conv_context="bus_stNmORbusNum" WHERE user_id=' + event.sender.id);
    var messageData = {"text": "미안ㅠㅠ무슨 말인지 모르겠어..조금 다르게 다시 말해 줄 수 있어?"};
    api.sendResponse(event, messageData);
  } else if (stNmORbusNum == "번호") {
    console.log("번호");
    var messageData = {"text": "ㅋㅋ알겠어! 몇번 버스야??"};
    api.sendResponse(event, messageData);
    connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
  } else if (stNmORbusNum == "정류장") {
    console.log("정류장");
    var messageData = {"text": "ㅋㅋ알겠어! 어느정류장이야??"};
    api.sendResponse(event, messageData);
    connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
  }
}

var bus_askBusNum = function(event) {
  console.log("RUN bus_askBusNum");
  var data=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
  var jsonData=JSON.parse(data), msg = event.message.text, busNum;
  task = [
    function(callback) {
      callback(null, util.getSimilarStrings(msg,  jsonData.busNumArr, -1, jsonData.busNumArr.length));
    },
    function(possibleBusArr, callback) {
      // console.log("possibleBusArr: "+possibleBusArr);
      if (possibleBusArr[0].similarity == 0) {
        connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
        var messageData = {"text": "몇번인지 모르겠어:( 다시 말해 줄 수 있어?"};
        api.sendResponse(event, messageData);
        callback(null);
      } else {
        busNum = possibleBusArr[0]._text;
        connection.query('UPDATE Users SET conv_context="bus_confirmBusNum" WHERE user_id=' + event.sender.id);
        connection.query(`UPDATE Users SET busNum="${busNum}" WHERE user_id=` + event.sender.id);
        var messageData = {"text": `${busNum}번 버스 맞아??`};
        api.sendResponse(event, messageData);
        callback(null);
      }
    },
  ]
  async.waterfall(task);
}

var bus_confirmBusNum = function(event) {
  console.log("RUN bus_confirmBusNum");
  var data=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
  var jsonData=JSON.parse(data);
  var msg = event.message.text;
  var busNum;
  task = [
    function(callback) {
      callback(null, util.getSimilarStrings(msg,  jsonData.agreementArr, -1, jsonData.agreementArr.length));
    },
    function(agreementArr, callback) {
      console.log("agreementArr: "+agreementArr);
      if (agreementArr[0].similarity == 0) {
        if (util.getSimilarStrings(msg,  jsonData.agreementArr, -1, jsonData.agreementArr.length)[0].similarity == 0) {
          connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
          connection.query(`UPDATE Users SET busNum="none" WHERE user_id=` + event.sender.id);
          var messageData = {"text": "미안ㅋㅋ큐ㅠ 그럼 몇번이야?아마 내가 모르는 걸 수도 있어"};
          api.sendResponse(event, messageData);
          callback(null);
        } else {
          connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
          connection.query(`UPDATE Users SET busNum="none" WHERE user_id=` + event.sender.id);
          var messageData = {"text": "ㅋㅋㅋㅋ어쩌라는거지;"};
          api.sendResponse(event, messageData);
          callback(null);
        }
      } else {
        // NOTE: if there is no info in stNm in User
        connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
        connection.query('SELECT busNum FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
          if (err) throw err;
          console.log(result[0].busNum);
          var messageData = {"text": `알겠어!! ${result[0].busNum}번 버스로 찾아줄게! 정류장은 어디야?`};
          api.sendResponse(event, messageData);
          callback(null);
        });
        // NOTE: if USER already confirmed stNm
      }
    },
  ]
  async.waterfall(task);
}

var bus_askStNm = function(event) {
  console.log("RUN bus_askBusNum");
  var data=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
  var jsonData=JSON.parse(data), msg = event.message.text, stNmArr = [], stNm;

  task = [
    function(callback) {
      // NOTE: check if User already confirmed busNm
      connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        console.log("BUSNUM that user chose:" + result[0].busNum);
        if (result[0].busNum != ("none" && "")) {
          // NOTE: if there is confirmed busNum, search only the stations which the bus go through
          console.log("USER DID NOT CONFIRED busNum YET");
          for (var i = 0; i < jsonData.busRouteId_stId_staOrd.length; i++) {
            if (jsonData.busRouteId_stId_staOrd[i].plainNo == result[0].busNum) { stNmArr.push(jsonData.busRouteId_stId_staOrd[i].stNm);}
            if (i === jsonData.busRouteId_stId_staOrd.length-1) {
              console.log("stNmArr: "+stNmArr);
              callback(null, util.getSimilarStrings(msg, stNmArr, -1, stNmArr.length));
            }
          }
        } else {
          // NOTE: if there is no confirmed busNum, search all the stations
          console.log("USER ALREADY CONFIRED busNum");
          callback(null, util.getSimilarStrings(msg,  jsonData.stNmArr, -1, jsonData.stNmArr.length));
        }
      });
    },
    function(possibleStArr, callback) {
      console.log("possibleBusArr: "+possibleStArr[0]);
      if (possibleStArr[0].similarity == 0) {
        connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
        var messageData = {"text": "무슨 정류장인지 모르겠어:( 다시 말해 줄 수 있어?"};
        api.sendResponse(event, messageData);
        callback(null);
      } else {
        stNm = possibleStArr[0]._text;
        connection.query('UPDATE Users SET conv_context="bus_confirmStNm" WHERE user_id=' + event.sender.id);
        connection.query(`UPDATE Users SET stNm="${stNm}" WHERE user_id=` + event.sender.id);
        var messageData = {"text": `${stNm} 정류장 맞아??`};
        api.sendResponse(event, messageData);
        callback(null);
      }
    },
  ]
  async.waterfall(task);
}

var bus_confirmStNm = function(event) {
  console.log("RUN bus_confirmStNm");
  var basicConvFile=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
  var busRouteFile=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
  var basicConv=JSON.parse(basicConvFile), busRouteJsonData = JSON.parse(busRouteFile);
  var msg = event.message.text, stNm, stId, busNum, busRouteId, possibleStArr = [];
  task = [
    function(callback) {
      callback(null, util.getSimilarStrings(msg,  basicConv.agreementArr, -1, basicConv.agreementArr.length));
    },
    function(agreementArr, callback) {
      console.log("agreementArr: "+agreementArr);
      if (agreementArr[0].similarity == 0) {
        if (util.getSimilarStrings(msg,  basicConv.agreementArr, -1, basicConv.agreementArr.length)[0].similarity == 0) {
          connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
          connection.query(`UPDATE Users SET stNm="none" WHERE user_id=` + event.sender.id);
          var messageData = {"text": "미안ㅋㅋ큐ㅠ 그럼 무슨 정류장이야?아마 내가 모르는 걸 수도 있어"};
          api.sendResponse(event, messageData);
          callback(null);
        } else {
          connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
          connection.query(`UPDATE Users SET stNm="none" WHERE user_id=` + event.sender.id);
          var messageData = {"text": "ㅋㅋㅋㅋ어쩌라는거지;"};
          api.sendResponse(event, messageData);
          callback(null);
        }
      } else {
        // NOTE: if there is no info in stNm in User
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
        connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
          if (err) throw err;
          // console.log(result[0].busNum);
          var messageData = {"text": `알겠어!! ${result[0].busNum}번 버스, ${result[0].stNm} 정류장으로 찾아줄게!`};
          api.sendResponse(event, messageData);
          // console.log(busRouteJsonData.busNum_busRouteId);
          busNum = (result[0].busNum).toString();
          busRouteId = busRouteJsonData.busNum_busRouteId[busNum];
          console.log(`busNum: ${result[0].busNum} stNm: ${result[0].stNm}`);
          for (var i = 0; i < busRouteJsonData.busRouteId_stId_staOrd.length; i++) {
            if ((busRouteJsonData.busRouteId_stId_staOrd[i].plainNo == result[0].busNum) && (busRouteJsonData.busRouteId_stId_staOrd[i].stNm == result[0].stNm)) {
              console.log("possibleSt: " + JSON.stringify(busRouteJsonData.busRouteId_stId_staOrd[i]));
              possibleStArr.push(busRouteJsonData.busRouteId_stId_staOrd[i]);
            }
            if (i === busRouteJsonData.busRouteId_stId_staOrd.length-1) {
              if (possibleStArr.length >= 2) {
                bus_handleMultipleStNm(event, possibleStArr);
                console.log("ALERT: There are two or more stations with the same stNm.");
              }
              stId = possibleStArr[0].stId;
              console.log("busRouteId: " + busRouteId + " stId: " + stId);
              // NOTE: SEND API REQUEST
              sendArriveMsg(event, busRouteId, stId);
            }//if
          }//for loop
        }); //query
        // NOTE: if USER already confirmed stNm
      }
    },
  ]
  async.waterfall(task);
}


var bus_handleMultipleStNm = function(event, possibleStArr) {
  console.log("RUN handleMultipleStNm!");
  console.log("possibleStArr: " + JSON.stringify(possibleStArr));
  var title = "같은 이름의 여러 정류장이 검색되었어!";
  var url = process.env.HEROKU_URL + '/busRoute';

  app.bus_busRouteWebviewHelper(event, possibleStArr);
  // api.handleWebview(event, title, url, "tall");
  let messageData = {
    recipient: {
      id: event.sender.id
    },
    message: {
      "attachment":{
        "payload":{
          "elements":[{
            "buttons": [
              {
                "title":title,
                "type":"web_url",
                "url":url,
                "webview_height_ratio": "tall",
                "messenger_extensions" : true,
              },
            ],
            "image_url" : './E_WebviewBGShd-01.jpg',
            "title":""
          }],
          "template_type":"generic"
        },
        "type":"template"
      }
    }
  };
  api.callSendAPI(messageData);
}

var sendArriveMsg = function(event, busRouteId, stId, callback) {
  console.log('TEST busTest');
  var busNum, stNm;
  var task = [
    function(callback){
      connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
        if (err) throw err;
        busNum = (result[0].busNum).toString();
        stNm = (result[0].stNm).toString();
        callback(null, busNum, stNm);
      });
    },
    function(busNum, stNm, callback){
      console.log(`busNum: [${busNum}] stNm: [${stNm}] busRouteId: [${busRouteId}] stId: [${stId}]`);
      // var messageData = {"text": "버스 노선 데이터를 받아오는데 시간이 조금걸려!ㅠㅠ 조금만 기다려줘"};
      // api.sendResponse(event, messageData);
      getBusArriveInfo(busRouteId, stId, function(resultData) {
        console.log("resultData:" + resultData);
        if (resultData == ("결과없음"&&"인증실패")) {
          console.log("FUCK IT");
        } else {
          console.log("RESULT of getBusArriveInfo: " + JSON.stringify(resultData));
          var arrmsg1_final, arrmsg2_final, extramsg;
          if (resultData.arrmsg1.indexOf("곧") > -1) {
            arrmsg1_final = '곧 도착하구';
            extramsg = '얼른 뛰어가!!'
          } else if (resultData.arrmsg1.indexOf("대기") > -1) {
            arrmsg1_final = '차고에서 대기중이고'
            extramsg = '좀 많이 기다려야 할 것 같아...허허'
          } else {
            arrmsg1_final = resultData.arrmsg1 + '에 도착하구';
            extramsg = '서둘러 가는게 좋겠지??'
          }
          if (resultData.arrmsg2 == "곧 도착") {
            arrmsg2_final = '곧 도착해!!';
          } else if (resultData.arrmsg1.indexOf("대기") > -1) {
            arrmsg2_final = '차고에서 대기중이야!'
          } else {
            arrmsg2_final = resultData.arrmsg2 + '에 도착해!!';
          }
          var entiremsg_final = `${stNm}으로 오는 첫번째 ${busNum} 버스는 ${arrmsg1_final}, 두번째 버스는 ${arrmsg2_final} ${extramsg}`;
          var messageData = {"text": entiremsg_final.replace(/['"]+/g, '')};
          api.sendResponse(event, messageData);
        }
      });
    }
  ]
  async.waterfall(task);
}

var busTest = function(event) {
  console.log('TEST busTest');
  if (event.message.text.indexOf('/') > -1) {
    console.log('VALID busTest INPUT');
    var txt = event.message.text;
    var busNum, stNm, busRouteId, stId;
    busNum = txt.split("/")[0].replace(" ","");
    stNm =txt.split("/")[1].replace(" ","");
    console.log(`busNum: [${busNum}] stNm: [${stNm}]`);
    if (busNum == "153" || "153번") busRouteId = 100100032;
    if (stNm == "연세대앞" || "연대앞") stId = 112000012;
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
        var entiremsg_final = `${stNm}으로 오는 첫번째 ${busNum} 버스는 ${arrmsg1_final}, 두번째 버스는 ${arrmsg2_final} ${extramsg}`;
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
  var options, ord, staOrdArr = [], stId_target = stId;
  var data=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
  var jsonData=JSON.parse(data);
  if (typeof stId_target != "string") {
    stId_target = stId.toString();
  }
  console.log(`STID: ${stId_target} TYPE of STID: ${typeof stId_target}`);
  var itemListSize = jsonData.busRouteId_stId_staOrd.length;
  console.log(itemListSize)
  for (var i = 0; i < itemListSize; i++) {
    if (jsonData.busRouteId_stId_staOrd[i].stId == stId_target && jsonData.busRouteId_stId_staOrd[i].busRouteId == busRouteId) {
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
  if (typeof stId_target != "string") {
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


module.exports = {
  functionMatch: {
    "버스": initBusConv,
    "busTest" : busTest,
    "bus_stNmORbusNum" : bus_stNmORbusNum,
    "bus_askBusNum" : bus_askBusNum,
    "bus_confirmBusNum" : bus_confirmBusNum,
    "bus_askStNm" : bus_askStNm,
    "bus_confirmStNm" : bus_confirmStNm,
    "bus_handleMultipleStNm" : bus_handleMultipleStNm,
    // "busConv_1_Number" : busConv_1_Number,
    // "busConv_2_Station" : busConv_2_Station,
    // "busConv_3_Print" : busConv_3_Print,
  }
};
