var app = require("./app");
var path = require('path');
var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
var convert = require('xml-js');
var bodyparser=require('body-parser');
var stringSimilarity = require('kor-string-similarity');
const fs = require('fs');

const BUS_SERVICE_KEY = process.env.BUS_SERVICE_KEY;

var connection = mysql.createConnection(process.env.DATABASE_URL);

var basicConvFile=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
var busRouteFile=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
var basicConv=JSON.parse(basicConvFile), busRouteJsonData = JSON.parse(busRouteFile);

var BUS_TEMP_DATA = {
    "user_psid_test" : {
      "busNum" : "busNum_value",
      "busRouteId" : "busRouteId_value",
      "stNm" : "stNm_value",
      "stId" : "stId_value",
      "staOrd" : "staOrd_value",
    }
  };

var choose = function(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

var resetUserBusData = function(event) {
  BUS_TEMP_DATA[event.sender.id]= {
    "busNum" : "busNum_value",
    "busRouteId" : "busRouteId_value",
    "stNm" : "stNm_value",
    "stId" : "stId_value",
    "staOrd" : "staOrd_value",
  };
}

var initBusConv = function(event) {
  console.log('RUN initBusConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="bus_stNmORbusNum" WHERE user_id=' + event.sender.id);
      BUS_TEMP_DATA[event.sender.id]= {
        "busNum" : "busNum_value",
        "busRouteId" : "busRouteId_value",
        "stNm" : "stNm_value",
        "stId" : "stId_value",
        "staOrd" : "staOrd_value",
      };
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

var conv_sendRandom = function(event, arr) {
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.typingBubble(event);
  connection.query('SELECT first_name FROM Users WHERE user_id=' + event.sender.id, function(err, result, fields) {
    if (err) throw err;
    var text = choose(arr);
    api.sendResponse(event, {"text": text});
  });
}

var bus_stNmORbusNum = function(event) {
  console.log("RUN bus_stNmORbusNum");
  var msg = event.message.text;
  console.log(stringSimilarity.arrangeBySimilarity(msg,  ["번호", "정류장"]));
  var stNmORbusNum = stringSimilarity.arrangeBySimilarity(msg,  ["번호", "정류장"])[0]._text;
  // console.log(stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating + (typeof stringSimilarity.findBestMatch(msg, ["번호", "정류장"]).bestMatch.target.rating));
  if (stringSimilarity.arrangeBySimilarity(msg, ["번호", "정류장"])[0].similarity < 0.25){
    console.log("MSG UNVARIFIED");
    connection.query('UPDATE Users SET conv_context="bus_stNmORbusNum" WHERE user_id=' + event.sender.id);
    var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var messageData = {"text": choose(textArr) + " 혹시 버스 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies" : qr.reply_arrays["restartConv"]};
    api.sendResponse(event, messageData);
  } else if (stNmORbusNum == "번호") {
    console.log("START BUS ARR SEARCH with BUS_NUM");
    var textArr1 = ["ㅋㅋ알겠어!", "알았어!!", "오키오키!!", "알겠어:)!!", "응응!!ㅎㅎ"];
    var textArr2 = [" 몇 번 버스야?", "몇 번 버스니??", " 몇 번 버스??", " 몇 번??", " 몇 번으로 찾아줄까??"];
    var messageData = {"text": choose(textArr1) + choose(textArr2)};
    api.sendResponse(event, messageData);
    connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
  } else if (stNmORbusNum == "정류장") {
    console.log("START BUS ARR SEARCH with ST_NM");
    var textArr1 = ["ㅋㅋ알겠어!", "알았어!!", "오키오키!!", "알겠어:)!!", "응응!!ㅎㅎ"];
    var textArr2 = [" 어느 정류장?", " 어떤 정류장??", " 어떤 정류장으로 찾아줄까?", " 무슨 정류장??", " 어느 정류장인지 알려줘!"];
    var messageData = {"text": choose(textArr1) + choose(textArr2)};
    api.sendResponse(event, messageData);
    connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
  }
}

var bus_askBusNum = function(event) {
  console.log("RUN bus_askBusNum");
  var msg = event.message.text;
  var substring = "번"
  if (msg.indexOf(substring) !== -1) {
    msg = msg.substring(0, msg.indexOf(substring) - 1);
    console.log("msg is: "+ msg);
  }
  var busNum, stNm, busRouteId, stId;
  busRouteId = BUS_TEMP_DATA[event.sender.id].busRouteId;
  busNum = BUS_TEMP_DATA[event.sender.id].busNum;
  stId = BUS_TEMP_DATA[event.sender.id].stId;
  stNm = BUS_TEMP_DATA[event.sender.id].stNm;
  var task = [
    function(callback) {
      callback(null, stringSimilarity.arrangeBySimilarity(msg, busRouteJsonData.busNumArr));
    },
    function(possibleBusArr, callback) {
      // console.log("possibleBusArr: "+possibleBusArr);
      if (possibleBusArr[0].similarity < 0.5) {
        connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
        var textArr = ["미안ㅠㅠ몇 번인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `몇 번인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "몇 번인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ몇 번인지 잘 모르겠어ㅠ 다시 말 해줘!",
          "귀가 미쳤나봐 몇 번인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 몇 번인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 몇 번인지 모르겄다ㅋㅋㅋ"];
        var messageData = {"text": `${choose(textArr)} 혹시 버스 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘!`, "quick_replies": qr.reply_arrays["restartConv"]};
        api.sendResponse(event, messageData);
        callback(null);
      } else {
        busNum = possibleBusArr[0]._text;
        connection.query('UPDATE Users SET conv_context="bus_confirmBusNum" WHERE user_id=' + event.sender.id);
        BUS_TEMP_DATA[event.sender.id].busNum = busNum;
        console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
        console.log("similarity: " + stringSimilarity.arrangeBySimilarity(msg,  busRouteJsonData.busNumArr)[0].similarity);
        var textArr1 = ["버스 맞아?", "버스 맞니??", "버스 맞는거지??", "버스 말하는거 맞지??", "버스로 찾아달라는 거지?"];
        var textArr2 = ["맞으면 맞다고 해줘!", "맞으면 알겠다고 해줘:)", "맞으면 응이라고 해줘!"]
        var messageData = {"text": `${busNum}번 ${choose(textArr1)} ${choose(textArr2)}`};
        api.sendResponse(event, messageData);
        callback(null);
      }
    },
  ]
  async.waterfall(task);
}

var bus_confirmBusNum = function(event) {
  console.log("RUN bus_confirmBusNum");
  var msg = event.message.text;
  var busNum, stNm, busRouteId, stId;
  busNum = BUS_TEMP_DATA[event.sender.id].busNum;
  stId = BUS_TEMP_DATA[event.sender.id].stId;
  stNm = BUS_TEMP_DATA[event.sender.id].stNm;
    if (stId != ("stId_value" || null || undefined)) {
      console.log("busRouteId: " + busRouteJsonData.busNum_busRouteId[busNum]);
      busRouteId = busRouteJsonData.busNum_busRouteId[busNum];
      BUS_TEMP_DATA[event.sender.id].busRouteId = busRouteId;
      // console.log("bus_confirmBusNum RESULT: " + JSON.stringify(result[0]));
      var textArr1 = ["ㅋㅋ알겠어!", "알았어!!", "오키오키!!", "알겠어:)!!", "응응!!ㅎㅎ"];
      var textArr2 = ["으로 찾아줄게!", "의 정보를 조회해줄게!:)", "에 오는 버스로 찾아줄게!!", "의 도착 정보를 조회해줄게!!"]
      var messageData = {"text": `${choose(textArr1)} ${busNum}번 버스, ${stNm} 정류장${choose(textArr2)}`};
      api.sendResponse(event, messageData);
      sendArriveMsg(event, busRouteId, stId);
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    } else {
      task = [
        function(callback) {
          callback(null, stringSimilarity.arrangeBySimilarity(msg,  basicConv.agreementArr));
        },
        function(agreementArr, callback) {
          if (agreementArr[0].similarity > 0.5) {
            // NOTE: if there is no info in stNm in User
            connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
            busRouteId = busRouteJsonData.busNum_busRouteId[busNum];
            BUS_TEMP_DATA[event.sender.id].busRouteId = busRouteId;
            console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
            var messageData = {"text": `알겠어!! ${busNum}번 버스로 찾아줄게! 정류장은 어디야?`};
            api.sendResponse(event, messageData);
            callback(null);
          } else {
            if (stringSimilarity.arrangeBySimilarity(msg,  basicConv.disagreementArr)[0].similarity > 0.5) {
              connection.query('UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=' + event.sender.id);
              BUS_TEMP_DATA[event.sender.id].busNum = "busNum_value";
              console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
              var messageData = {"text": "미안ㅋㅋ큐ㅠ 그럼 몇번이야?아마 내가 모르는 걸 수도 있어"};
              api.sendResponse(event, messageData);
              callback(null);
            } else {
              connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
              BUS_TEMP_DATA[event.sender.id].busNum = "busMum_value";
              console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
              var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
                "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
              var messageData = {"text": choose(textArr) + " 혹시 버스 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies" : qr.reply_arrays["restartConv"]};
              api.sendResponse(event, messageData);
              callback(null);
            }
          }
        },
      ]
      async.waterfall(task);
    } //else
  // }); //query
}

var bus_askStNm = function(event) {
  console.log("RUN bus_askBusNum");
  var msg = event.message.text, stNameArr = []
  var busNum, stNm, busRouteId, stId;
  task = [
    function(callback) {
      // NOTE: check if User already confirmed busNm
        busNum = BUS_TEMP_DATA[event.sender.id].busNum;
        stId = BUS_TEMP_DATA[event.sender.id].stId;
        console.log("BUSNUM that user chose:" + BUS_TEMP_DATA[event.sender.id].busNum);
        if (busNum != ("busNum_value" || null || undefined)) {
          // NOTE: if there is confirmed busNum, search only the stations which the bus go through
          console.log("USER ALREADY CONFIRED busNum");
          for (var i = 0; i < busRouteJsonData.busRouteId_stId_staOrd.length; i++) {
            if (busRouteJsonData.busRouteId_stId_staOrd[i].plainNo == busNum) { stNameArr.push(busRouteJsonData.busRouteId_stId_staOrd[i].stNm);}
            if (i == busRouteJsonData.busRouteId_stId_staOrd.length-1) {
              // console.log("stNameArr: "+stNameArr);
              callback(null, stringSimilarity.arrangeBySimilarity(msg, stNameArr));
            }
          }
        } else {
          // NOTE: if there is no confirmed busNum, search all the stations
          console.log("USER DID NOT CONFIRED busNum YET");
          callback(null, stringSimilarity.arrangeBySimilarity(msg, busRouteJsonData.stNameArr));
        }
      // });//query
    },
    function(possibleStArr, callback) {
      console.log("possibleBusArr: "+possibleStArr[0]);
      if (possibleStArr[0].similarity > 0.25) {
        stNm = possibleStArr[0]._text;
        connection.query('UPDATE Users SET conv_context="bus_confirmStNm" WHERE user_id=' + event.sender.id);
        BUS_TEMP_DATA[event.sender.id].stNm = stNm;
        console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
        var messageData = {"text": `${stNm} 정류장 맞아??`};
        api.sendResponse(event, messageData);
        callback(null);
      } else {
        connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
        var messageData = {"text": "무슨 정류장인지 모르겠어:( 다시 말해 줄 수 있어?"};
        api.sendResponse(event, messageData);
        callback(null);
      }
    },
  ]
  async.waterfall(task);
}

var bus_confirmStNm = function(event) {
  console.log("RUN bus_confirmStNm");
  var msg = event.message.text, possibleStArr = [];
  var busNum, stNm, busRouteId, stId;
  stNm = BUS_TEMP_DATA[event.sender.id].stNm;
  console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
  task = [
    function(callback) {
      callback(null, stringSimilarity.arrangeBySimilarity(msg,  basicConv.agreementArr));
    },
    function(agreementArr, callback) {
      console.log("agreementArr: "+agreementArr);
      if (agreementArr[0].similarity > 0.5) {
        // NOTE: if there is no info in stNm in User
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
          busNum = BUS_TEMP_DATA[event.sender.id].busNum;
          if (busNum != ("busNum_value" || null || undefined)) {
            // busNum = (result[0].busNum).toString();
            busRouteId = busRouteJsonData.busNum_busRouteId[busNum];
            console.log(`busNum: ${busNum} stNm: ${stNm}`);
            for (var i = 0; i < busRouteJsonData.busRouteId_stId_staOrd.length; i++) {
              if ((busRouteJsonData.busRouteId_stId_staOrd[i].plainNo == busNum) && (busRouteJsonData.busRouteId_stId_staOrd[i].stNm == stNm)) {
                console.log("possibleSt: " + JSON.stringify(busRouteJsonData.busRouteId_stId_staOrd[i]));
                possibleStArr.push(busRouteJsonData.busRouteId_stId_staOrd[i]);
              }
              if (i === busRouteJsonData.busRouteId_stId_staOrd.length-1) {
                if (possibleStArr.length >= 2) {
                  bus_handleMultipleStNm(event, stNm, possibleStArr);
                  console.log("ALERT: There are two or more stations with the same stNm.");
                } else {
                  stId = possibleStArr[0].stId;
                  var textArr1 = ["ㅋㅋ알겠어!", "알았어!!", "오키오키!!", "알겠어:)!!", "응응!!ㅎㅎ"];
                  var textArr2 = ["으로 찾아줄게!", "의 정보를 조회해줄게!:)", "에 오는 버스로 찾아줄게!!", "의 도착 정보를 조회해줄게!!"]
                  var messageData = {"text": `${choose(textArr1)} ${busNum}번 버스, ${stNm} 정류장${choose(textArr2)}`};
                  api.sendResponse(event, messageData);
                  console.log("busRouteId: " + busRouteId + " stId: " + stId);
                  sendArriveMsg(event, busRouteId, stId);
                  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
                }//else
              }//if
            }//for loop
          } else {
            console.log("NO BUSNUM");
            // console.log(`busNum: ${result[0].busNum} stNm: ${result[0].stNm}`);
            var stIdArr = [];
            for (var i = 0; i < busRouteJsonData.busRouteId_stId_staOrd.length; i++) {
              if (busRouteJsonData.busRouteId_stId_staOrd[i].stNm == stNm && (stIdArr.indexOf(busRouteJsonData.busRouteId_stId_staOrd[i].stId) == -1)) {
                console.log("possibleSt: " + JSON.stringify(busRouteJsonData.busRouteId_stId_staOrd[i]));
                possibleStArr.push(busRouteJsonData.busRouteId_stId_staOrd[i]);
                stIdArr.push(busRouteJsonData.busRouteId_stId_staOrd[i].stId)
              }
              if (i === busRouteJsonData.busRouteId_stId_staOrd.length-1) {
                if (possibleStArr.length >= 2) {
                  console.log("stIdArr: " + JSON.stringify(stIdArr));
                  console.log("possibleStArr: " + JSON.stringify(possibleStArr));
                  bus_handleMultipleStNm(event, stNm, possibleStArr);
                  console.log("ALERT: There are two or more stations with the same stNm.");
                } else {
                  console.log("ONLY ONE STNM");
                  var messageData = {"text": `알겠어!! ${stNm} 정류장으로 찾아줄게! 버스는 몇번이야?`};
                  api.sendResponse(event, messageData);
                  stId = possibleStArr[0].stId;
                  console.log(stId);
                  BUS_TEMP_DATA[event.sender.id].stId = stId;
                  console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
                  connection.query('UPDATE Users SET conv_context="ask_busNum" WHERE user_id=' + event.sender.id);
                }//else
              }//if
            }//for loop
          }
        // }); //query
      } else {
        if (stringSimilarity.arrangeBySimilarity(msg,  basicConv.agreementArr)[0].similarity == 0) {
          connection.query('UPDATE Users SET conv_context="bus_askStNm" WHERE user_id=' + event.sender.id);
          BUS_TEMP_DATA[event.sender.id].stNm = "stNm_value";
          console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
          var messageData = {"text": "미안ㅋㅋ큐ㅠ 그럼 무슨 정류장이야?아마 내가 모르는 걸 수도 있어"};
          api.sendResponse(event, messageData);
          callback(null);
        } else {
          connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
          BUS_TEMP_DATA[event.sender.id].stNm = "stNm_value";
          console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
          var messageData = {"text": "미안ㅋㅋ큐ㅠ 그럼 무슨 정류장이야?아마 내가 모르는 걸 수도 있어"};
          var messageData = {"text": "ㅋㅋㅋㅋ어쩌라는거지;"};
          api.sendResponse(event, messageData);
          callback(null);
        }//else
      }//else
    },//function
  ]
  async.waterfall(task);
}

var bus_handleMultipleStNm = function(event, targetStNm, possibleStArr, callback) {
  console.log("RUN handleMultipleStNm!");
  var msg = event.message.text;

  var bus_busRouteWebviewHelper = function(event, targetStNm, positionData) {
    var busNum, stNm, busRouteId, stId;
    console.log('RUN bus_busRouteWebviewHelper1');
    app.APP.get(`/busRoute/${encodeURI(targetStNm)}/${event.sender.id}`, function(req, res){
      var data = {
        targetStNm: targetStNm,
        positionData: JSON.stringify(positionData),
      }
      res.render(__dirname + '/webviews/multipleBusStNmWebview.html', data);
    });
    app.APP.post(`/busRoute/${encodeURI(targetStNm)}/${event.sender.id}`, function(req, res){
      // console.log(req.body);
      console.log("BUS DATA: " + req.body.data);
      var data = JSON.parse(req.body.data)
      // console.log(data);
      busRouteId =  BUS_TEMP_DATA[event.sender.id].busRouteId;
      busNum = BUS_TEMP_DATA[event.sender.id].busNum;
      stId = BUS_TEMP_DATA[event.sender.id].stId;
      stNm = BUS_TEMP_DATA[event.sender.id].stNm;
      if (data.responseType == "busStationWebview_STID") {
        console.log("selectedSTID: " + JSON.stringify(data.selectedSTID));
        BUS_TEMP_DATA[event.sender.id].stId = data.selectedSTID;
        console.log("BUS_TEMP_DATA: " + JSON.stringify(BUS_TEMP_DATA));
          if (busRouteId != ("busRouteId_value" || null || undefined)) {
            var textArr1 = ["ㅋㅋ알겠어!", "알았어!!", "오키오키!!", "알겠어:)!!", "응응!!ㅎㅎ"];
            var textArr2 = ["으로 찾아줄게!", "의 정보를 조회해줄게!:)", "에 오는 버스로 찾아줄게!!", "의 도착 정보를 조회해줄게!!"]
            var messageData = {"text": `${choose(textArr1)} ${busNum}번 버스, ${stNm} 정류장${choose(textArr2)}`};
            api.sendResponse(event, messageData);
            sendArriveMsg(event, busRouteId, data.selectedSTID);
            connection.query('UPDATE Users SET conv_context="none",busNum="none",busRouteId="none",stNm="none",stId="none" WHERE user_id=' + event.sender.id);
          } else {
            connection.query(`UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=` + event.sender.id);
            var busNumArr = bus_recommendBusNumByStNm(data.selectedSTID)
            console.log("busNumArr: " + busNumArr);
            if (busNumArr.length > 11) {
              var busNums = qr.generateQuickReplies(busNumArr.slice(0,11));
              var extraBusNums = busNumArr.slice(11, busNumArr.length);
              console.log("busNums: " + busNums);
              console.log("extraBusNums: " + extraBusNums);
              var extraBusNumsString = "";
              for (var i = 0; i < extraBusNums.length; i++) {
                if (i < extraBusNums.length-1) {
                  extraBusNumsString += `${extraBusNums[i]}번, `;
                } else {
                  extraBusNumsString += `${extraBusNums[i]}번`;
                  var messageData = {"text": `네가 선택한 ${stNm} 정류장을 지나가는 들이야! 이 외에도 ${extraBusNumsString} 버스가 있어! 이 중에 몇 번 버스야??`, "quick_replies": busNums};
                  api.sendResponse(event, messageData);
                }
              }
            } else {
              connection.query(`UPDATE Users SET conv_context="bus_askBusNum" WHERE user_id=` + event.sender.id);
              var busNums = qr.generateQuickReplies(busNumArr);
              var messageData = {"text": `네가 선택한 ${stNm} 정류장을 지나가는 버스들이야! 이 중에 몇 번 버스야??`, "quick_replies": busNums};
              api.sendResponse(event, messageData);
            }
          }
        // }); //query
      } else {
        return `/busRoute/${targetStNm}/${event.sender.id} ERR`;
      }
      var responseData = {'result' : 'ok', 'data' : req.body.data}
      res.json(responseData);
    });
  }

  var bus_recommendBusNumByStNm = function (stId) {
    var busNumArr = [];
    for (var i = 0; i < busRouteJsonData.busRouteId_stId_staOrd.length; i++) {
      if ((busRouteJsonData.busRouteId_stId_staOrd[i].stId == stId) && !(busRouteJsonData.busRouteId_stId_staOrd[i].plainNo in busNumArr)) {
        // console.log(busRouteJsonData.busRouteId_stId_staOrd[i].plainNo);
        busNumArr.push(busRouteJsonData.busRouteId_stId_staOrd[i].plainNo);
      }
      if (i == busRouteJsonData.busRouteId_stId_staOrd.length-1) {
        return busNumArr;
      }
    }
  }

  console.log("possibleStArr: " + JSON.stringify(possibleStArr));
  var title = "같은 이름의 여러 정류장이 검색되었어!";
  var url = process.env.HEROKU_URL + `/busRoute/${encodeURI(targetStNm)}/${event.sender.id}`;
  bus_busRouteWebviewHelper(event, targetStNm, possibleStArr);
  let messageData = {
    recipient: {
      id: event.sender.id
    },
    message: {
      "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text": title,
        "buttons":[
          {
            "type":"web_url",
            "url": url,
            "title":"지도를 보고 선택해줘!",
            "webview_height_ratio": "compact",
            "messenger_extensions": true,
          }
        ]
      }//payload
      }//attachment
    }//message
  };//messageDat
  api.callSendAPI(messageData);
}

var sendArriveMsg = function(event, busRouteId, stId, callback) {
  console.log('TEST busTest');
  var busNum, stNm;
  var task = [
    function(callback){
      callback(null, BUS_TEMP_DATA[event.sender.id].busNum, BUS_TEMP_DATA[event.sender.id].stNm);
    },
    function(busNum, stNm, callback){
      console.log(`busNum: [${busNum}] stNm: [${stNm}] busRouteId: [${busRouteId}] stId: [${stId}]`);
      getBusArriveInfo(busRouteId, stId, function(resultData) {
        console.log("resultData:" + resultData);
        if (resultData == ("결과없음"||"인증실패")) {
          console.log("결과없음/인증실패");
          var entiremsg_final = `${stNm}으로 오는 ${busNum} 버스에 대한 도착 정보가 없어..우짜냐`;
          var messageData = {"text": entiremsg_final.replace(/['"]+/g, '')};
          api.sendResponse(event, messageData);
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
          resetUserBusData(event);
        }
      });
    }
  ]
  async.waterfall(task);
}
module.exports.sendArriveMsg = sendArriveMsg;

var getBusArriveInfo = function(busRouteId, stId, callback) {
  console.log("RUN getBusArriveInfo");
  var staOrd, options, arrmsg1, arrmsg2, resultData;
  getStaOrd_fromInside(busRouteId, stId, function(res){
    // console.log("IN getBusArriveInfo staOrd:" + res);
    staOrd = res;
    console.log(`getBusArriveInfo busRouteId:[${busRouteId}] stId:[${stId}] staOrd:[${staOrd}]`);
    var options_url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute`;
    var options_ServiceKey = `?ServiceKey=${process.env.BUS_SERVICE_KEY}`;
    var options_busRouteId = `&busRouteId=${busRouteId}`;
    var options_stId = `&stId=${stId}`
    var options_ord = `&ord=${staOrd}`;
    options = options_url + options_ServiceKey + options_busRouteId + options_stId + options_ord;
    console.log("OPTIONS URL: " + options);
    request(options, function (error, response, body) {
      var err;
      if (error) throw new Error(error);
      var xmlData = body;
      var jsonStrData_Compact = convert.xml2json(xmlData, {compact: true, spaces: 4});
      var jsonData = JSON.parse(jsonStrData_Compact);
      // console.log("typeof jsonData: " + typeof jsonData);
      console.log("HEADERMSG: " + JSON.stringify(jsonData.ServiceResult.msgHeader.headerMsg._text));
      if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("인증실패") > -1) {
        console.log("인증실패");
        callback("인증실패");
      } else if (jsonData.ServiceResult.msgHeader.headerMsg._text.indexOf("결과가 없습니다") > -1) {
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
  if (typeof stId_target != "string") {
    stId_target = String(stId);
  }
  console.log(`STID: ${stId_target} TYPE of STID: ${typeof stId_target}`);
  var itemListSize = busRouteJsonData.busRouteId_stId_staOrd.length;
  // console.log(itemListSize)
  for (var i = 0; i < itemListSize; i++) {
    if (busRouteJsonData.busRouteId_stId_staOrd[i].stId == stId_target && busRouteJsonData.busRouteId_stId_staOrd[i].busRouteId == busRouteId) {
      ord = busRouteJsonData.busRouteId_stId_staOrd[i].staOrd;
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
    "initBusConv": initBusConv,
    // "busTest" : busTest,
    "bus_stNmORbusNum" : bus_stNmORbusNum,
    "bus_askBusNum" : bus_askBusNum,
    "bus_confirmBusNum" : bus_confirmBusNum,
    "bus_askStNm" : bus_askStNm,
    "bus_confirmStNm" : bus_confirmStNm,
    "bus_handleMultipleStNm" : bus_handleMultipleStNm,
  }
};
