var request = require("request");
var qr = require('./quick_replies');
var api = require('./apiCalls')
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

function initRestaurantConv(event) {
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
}

function initRestaurantRecommendation(event) {
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
}


// var initRestaurantConvTrigger = ["배고파", "굶어뒤지것다"];
// for(var i = 0; i < initRestaurantConvTrigger.length; i++) {
//   initRestaurantConvTrigger[i] : initRestaurantConv
// }
module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    // "배고파뒤질듯" : initRestaurantConv,
    // initRestaurantConvTrigger : initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
  }
}
