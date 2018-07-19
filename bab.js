var request = require("request");
var api = require("./apiCalls");
var async = require("async");
var mysql = require("mysql");
var connection = mysql.createConnection(process.env.DATABASE_URL);

//give out list of sikdangs
var whichSikdang = function(event){
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  var key = "I5mnxs3t4W";
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
        for (i = 0; i < 3; i++){
          sikdang.push({
            "content_type": "text",
            "title": JSON.parse(body).stores[i].name,
            "payload": JSON.parse(body).stores[i].name
          });
        }
        var messageData = {"text": "학식 어디서 먹을건데?", "quick_replies": sikdang};
        api.sendResponse(event, messageData);
      });
      callback(null);
    }
  ];
  async.waterfall(task);
}

var sendBabMenu = function(event){
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  var key = "I5mnxs3t4W";
  var babMenu = [];
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
        for (i = 0; i < JSON.parse(body).stores.length; i++){
          if (JSON.parse(body).stores[i].name == event.message.text){
            console.log(JSON.parse(body).stores[i].menus);
            if(JSON.parse(body).stores[i].menus.length == 0){
              api.sendResponse(event, {"text": "오늘 여기는 밥이 안나와 다른데 가서 머거"});
            }
            else{
              for (j = 0; j < 2; j++){
                babMenu.push({
                  "content_type": "text",
                  "title": JSON.parse(body).stores[i].menus[j].description,
                  "payload": JSON.parse(body).stores[i].menus[j].name
                });
              }
            }
          }
        }
        console.log(babMenu);
        try {
          api.sendResponse(event, {"text": "오늘의 메뉴는 " + babMenu[0].title + "이래.\n존맛이겠다 ㅎㅎ" });
        } catch {
          api.sendResponse(event, {"text": "미안 메뉴 정보가 없어...흐어" });
        }
      });
      callback(null);
    }
  ];
  async.waterfall(task);
}

module.exports = {
    functionMatch: {
        "initHaksikConv": whichSikdang,
        "sendBabMenu": sendBabMenu
    }
};
