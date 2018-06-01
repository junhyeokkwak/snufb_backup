var request = require("request");
var api = require("./apiCalls");

//give out list of sikdangs
var whichSikdang = function(event){
  var sikdang = [];
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  var key = "I5mnxs3t4W";
  var options = { method: 'GET',
      url: 'https://bds.bablabs.com/openapi/v1/campuses/' + key + '/stores',
      qs: { date: todayDate },
      headers:
       { 'postman-token': '13d05bcc-6df0-81ab-df78-180ddeafbeee',
         'cache-control': 'no-cache',
         babsession: '123',
         accesstoken: 'O1t5rnRk80LEErp1NIPgwSy1Inz0xOCtITLovskaYckJohmwsV' } };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      //JSON.parse(body).stores.length
      for (i = 0; i < 3; i++){
        sikdang.push({
          "content_type": "text",
          "title": JSON.parse(body).stores[i].name,
          "payload": JSON.parse(body).stores[i].name
        });
      }
    });
    console.log(sikdang);

    var messageData = {"text": "어디서 먹을건데?", "quick_replies": sikdang};
    api.sendResponse(event, messageData);
}

var sendBabMenu = function(event){
  var babMenu = [];
  var utc = new Date().setUTCHours(28);
  var todayDate = new Date(utc).toISOString().slice(0,10);
  var key = "I5mnxs3t4W";
  var options = { method: 'GET',
      url: 'https://bds.bablabs.com/openapi/v1/campuses/' + key + '/stores',
      qs: { date: todayDate },
      headers:
       { 'postman-token': '13d05bcc-6df0-81ab-df78-180ddeafbeee',
         'cache-control': 'no-cache',
         babsession: '123',
         accesstoken: 'O1t5rnRk80LEErp1NIPgwSy1Inz0xOCtITLovskaYckJohmwsV' } };

     request(options, function (error, response, body) {
       if (error) throw new Error(error);
       for (i = 0; i < JSON.parse(body).stores.length; i++){
         if (JSON.parse(body).stores[i].name == event.message.text){
           if(JSON.parse(body).stores[i].menus.length == 0){
             api.sendResponse({"text": "오늘 여기는 밥이 안나와 다른데 가서 머거"});
           }
           else{
             for (j = 0; j < 2; j++){
               //async
               babMenu.push({
                 "content_type": "text",
                 "title": JSON.parse(body).stores[i].menus[j].name,
                 "payload": JSON.parse(body).stores[i].menus[j].name
               });
             }
           }
         }
       }
     });
     api.sendResponse({"text": "오늘의 메뉴는 " + babMenu[0] + ", " + babMenu[1] + "야.\n존맛이겠다 ㅎㅎ" });
    }

module.exports = {
    functionMatch: {
        "오늘 밥 뭐야?": whichSikdang,
        "bab": whichSikdang,
        "sendBabMenu": sendBabMenu
    }
};
