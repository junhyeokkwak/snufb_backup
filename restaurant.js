var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

var initRestaurantConv = function(event) {
  console.log('RUN initRestaurantConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="initRestaurantRecommendation" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      var messageData = {"text": "왜 굶고다녀ㅠㅠ심심한데 메뉴 추천이 해 줄까?", "quick_replies": qr.reply_arrays['YesOrNo']};
      api.sendResponse(event, messageData);
      callback(null);
    }
  ];
  async.waterfall(task);
};

var initRestaurantRecommendation = function(event) {
  console.log("RUN: initRestaurantRecommendation");
  if (event.message.text == "응"){
    console.log("USER SELECT : YES in initRestaurantConv");
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="restaurantRecommendation_1" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        var qrCuisines = qr.generateQuickReplies(["한식", "중식", "일식", "양식", "분식"]);
        var messageData = {"text": "뭐 먹을래?", "quick_replies": qrCuisines};
        api.sendResponse(event, messageData);
        callback(null);
      }
    ];
    async.waterfall(task);
  } else if (event.message.text == "아니") {
    console.log("USER SELECT : NO in initRestaurantConv");

  } else {
    console.log("USER SELECT : UNEXPECTED RESPONSE in initRestaurantConv");
  }
};

var restaurantRecommendation_1 = function(event) {
  console.log("RUN: restaurantRecommendation_1");
  if (event.message.text == "한식"){
    console.log("USER SELECT : 한식 in restaurantRecommendation_1");
    var search = '한식';
  }
  var naverClientID = 'mSdY16Cdgy3tfbILEmSN';
  var naverClientSecrete = 'EjgVHFWgzo';
  // var search = req.query.search;
  var queryOption = {'query':search, 'display':10, 'start':1, 'sort':'sim'};
  var query = querystring.stringify(queryOption);
  var options = { method: 'GET',
      //https://openapi.naver.com/v1/search/shop.xml?query=검색어&display=10&start=1&sort=sim
      // url: 'https://openapi.naver.com/v1/search/local.json'+'?query='+search+'&display=10&start=1&sort=sim',
      host: 'openapi.naver.com',
      port: 433,
      path: '/v1/search/shop.json'+query,
      headers: {
        'X-Naver-Client-Id':naverClientID,
        'X-Naver-Client-Secret': naverClientSecrete,
      },
  };
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
      callback(null, err);
    },
    function(err, callback){
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        // for (i = 0; i < JSON.parse(body).stores.length; i++){
        //   if (JSON.parse(body).stores[i].name == event.message.text){
        //     console.log(JSON.parse(body).stores[i].menus);
        //     if(JSON.parse(body).stores[i].menus.length == 0){
        //       api.sendResponse({"text": "오늘 여기는 밥이 안나와 다른데 가서 머거"});
        //     }
        //     else{
        //       for (j = 0; j < 2; j++){
        //         babMenu.push({
        //           "content_type": "text",
        //           "title": JSON.parse(body).stores[i].menus[j].description,
        //           "payload": JSON.parse(body).stores[i].menus[j].name
        //         });
        //       }
        //     }
        //   }
        // }
        console.log(Json.parse(body));
        // api.sendResponse(event, {"text": "오늘의 메뉴는 " + babMenu[0].title + "이래.\n존맛이겠다 ㅎㅎ" });
      });
      callback(null);
    },
  ];
  async.waterfall(task);
};

module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_1" : restaurantRecommendation_1,
  }
};
