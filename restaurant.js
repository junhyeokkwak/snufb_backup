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
    // var task = [
    //   function(callback){
    //     connection.query('UPDATE Users SET conv_context="register2" WHERE user_id=' + event.sender.id);
    //     callback(null, 'done');
    //   },
    //   function(err, callback){
    //     api.sendResponse(event, {"text":"무슨 과?"});
    //     var title = "등록하기!";
    //     var url = process.env.HEROKU_URL + "/register";
    //     api.handleWebview(event, title, url);
    //     callback(null);
    //   }
    // ]
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
