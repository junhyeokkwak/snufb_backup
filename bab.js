var request = require("request");
var api = require("./apiCalls");
var async = require("async");
var mysql = require("mysql");
var connection = mysql.createConnection(process.env.DATABASE_URL);
var app = require('./app');
var qr = require('./quick_replies');
var stringSimilarity = require('kor-string-similarity');

var choose = function(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

var HAKSIK_TEMP_DATA = {
    "user_psid_test" : {
      "sikdangArr" : "sikdangArr_value",
    }
  };

//give out list of sikdangs
var whichSikdang = function(event){
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  var ewha_key = "I5mnxs3t4W";
  var yonsei_key = "IDrA5MHp97";
  var key = yonsei_key;
  if (app.UNIV_NAME_ENG == "ewha") {
    key = ewha_key;
  }
  var sikdang = [];
  var options = { method: 'GET',
      url: 'https://bds.bablabs.com/openapi/v1/campuses/' + key + '/stores',
      qs: { date: todayDate },
      headers:
       { 'postman-token': '13d05bcc-6df0-81ab-df78-180ddeafbeee',
         'cache-control': 'no-cache',
         babsession: '123',
         accesstoken: 'O1t5rnRk80LEErp1NIPgwSy1Inz0xOCtITLovskaYckJohmwsV' } };
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="sendBabMenu" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        // Limited to only 4 dining halls as of now, will need to traverse the entire array
        // eventually when we implement webviews.
        // Length of the JSON sikdang array >> JSON.parse(body).stores.length
        console.log(typeof body);
        var body = JSON.parse(body);
        if (body.result.status == "ok" || body.result.status_code == 200) {
          var sikdangArr = [];
          for (i = 0; i < body.stores.length; i++) {
            sikdangArr.push(body.stores[i].name)
            if (i == body.stores.length-1) {
              console.log(sikdangArr);
              HAKSIK_TEMP_DATA[event.sender.id]= {
                "sikdangArr" : sikdangArr,
              };
              console.log(JSON.stringify(HAKSIK_TEMP_DATA[event.sender.id]));
            }
          }
          if (body.stores.length > 11) {
            var qr_sikdang = qr.generateQuickReplies(sikdangArr.slice(0,11));
            var extraSikdangArr = sikdangArr.slice(11, sikdangArr.length);
            console.log("qr_sikdang: " +qr_sikdang);
            console.log("extraSikdangArr: " + extraSikdangArr);
            var extraSikdangArrString = "";
            for (var i = 0; i < extraSikdangArr.length; i++) {
              if (i < extraSikdangArr.length-1) {
                extraSikdangArrString += `${extraSikdangArr[i]}, `;
              } else {
                extraSikdangArrString += `${extraSikdangArr[i]}`;
                var messageData = {"text": `extraSikdangArr ${extraSikdangArrString} `, "quick_replies": qr_sikdang};
                api.sendResponse(event, messageData);
              }
            }
          } else {
            var qr_sikdang = qr.generateQuickReplies(sikdangArr);
            var messageData = {"text": `학식 어디서 먹을건데??`, "quick_replies": qr_sikdang};
            api.sendResponse(event, messageData);
          }

        } else {
          var messageData = {"text": "지금은 학식 정보가 없어ㅠㅠ 미안해"};
          api.sendResponse(event, messageData);
        }
      });
      callback(null);
    }
  ];
  async.waterfall(task);
}

var sendBabMenu = function(event){
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  console.log(new Date(new Date().setUTCHours(28)).toISOString().slice(0,10));
  var ewha_key = "I5mnxs3t4W";
  var yonsei_key = "IDrA5MHp97";
  var key = yonsei_key;
  if (app.UNIV_NAME_ENG == "ewha") {
    key = ewha_key;
  }
  var options = { method: 'GET',
      url: 'https://bds.bablabs.com/openapi/v1/campuses/' + key + '/stores',
      qs: { date: todayDate },
      headers:
       { 'postman-token': '13d05bcc-6df0-81ab-df78-180ddeafbeee',
         'cache-control': 'no-cache',
         babsession: '123',
         accesstoken: 'O1t5rnRk80LEErp1NIPgwSy1Inz0xOCtITLovskaYckJohmwsV' } };
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function (err, callback){
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        var body = JSON.parse(body);
        var sikdangArr = [];
        for (i = 0; i < body.stores.length; i++) {
          sikdangArr.push(body.stores[i].name)
          if (i == body.stores.length-1) {
            console.log(sikdangArr);
            callback(null, body, sikdangArr)
          } // if
        } //for
      }); //request
    }, //function
    function (body, sikdangArr, callback) {

      console.log(JSON.stringify(body));
      console.log(sikdangArr);
      var menuStr = '';

      if (stringSimilarity.findBestMatch(event.message.text, sikdangArr).similarity > 0.5) {
        var selected_sikdang = stringSimilarity.findBestMatch(event.message.text, sikdangArr)._text;
        //looping stores
        for (i = 0; i < body.stores.length; i++){
          if (selected_sikdang == body.stores[i].name) {
            if ((body.stores[i].menus.length == 0) || (stringSimilarity.compareTwoStrings(body.stores[i].menu_description,"식당에서 식단을 업로드하지 않았습니다.") > 0.75)) {
              var textArr1 = [`오늘 ${selected_sikdang}에서는 밥이 안나온데ㅠㅠ`, `오늘 ${selected_sikdang}에서 식단을 업로드 하지 않았어ㅠㅠ미안`, `${selected_sikdang}에 오늘 메뉴 정보가 없어ㅠ:(`, `${selected_sikdang}은 오늘 식단 정보가 없어...미안`]
              api.sendResponse(event, {"text": `${choose(textArr1)}` });
            } else {
              for (j=0; j < body.stores[i].menus.length; j++) {
                console.log(menuStr);
                if( body.stores[i].menus[j].hasOwnProperty('description')) {
                  menuStr += ` - ${body.stores[i].menus[j].description}\n\n`
                } else if (body.stores[i].menus[j].hasOwnProperty('menu_description')) {
                  menuStr += ` - ${body.stores[i].menus[j].menu_description}\n\n`
                }
                if (j == body.stores[i].menus.length-1) {
                  console.log("menuStr: " + menuStr);
                  var textArr1 = [`오늘 메뉴는` `오늘 ${selected_sikdang} 메뉴는`, `${selected_sikdang}의 오늘 메뉴는`]
                  var textArr2 = [`이래. 맛있겠다:)`, `위와 같아!! 얼른 가서 먹어`, `나도 먹고 싶다ㅠ`, `나도 얼른 ${selected_sikdang} 가야지!`, `나도 가고싶어 흐어...`]
                  api.sendResponse(event, {"text": `${choose(textArr1)} \n\n ${menuStr}\n${choose(textArr2)}` });
                }//if
              }//for - looping menus
            } //else
          } // if
        } //for - looping stores
      } else {
        // no matching sikdang
        var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
          "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
        var messageData = {"text": choose(textArr) + " 혹시 학식 정보 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies" : qr.reply_arrays["restartConv"]};
        api.sendResponse(event, messageData);
      } // else
      callback(null);
    }//function
  ]; //task
  async.waterfall(task);
}

module.exports = {
    functionMatch: {
        "initHaksikConv": whichSikdang,
        "sendBabMenu": sendBabMenu
    }
};
