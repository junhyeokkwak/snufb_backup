var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
const isImageUrl = require('is-image-url');

//XML to json
// var querystring = require('querystring');
// var parseString = require('xml2js').parseString;

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
      var messageData = {"text": "왜 굶고다녀ㅠㅠ심심한데 메뉴 추천해줄까?", "quick_replies": qr.reply_arrays['YesOrNo']};
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
        connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        var qrCuisines = qr.generateQuickReplies(["종합", "중식", "일식", "양식", "분식"]);
        var messageData = {"text": "어떻게 추천해줄까??", "quick_replies": qrCuisines};
        api.sendResponse(event, messageData);
        callback(null);
      }
    ];
    async.waterfall(task);
  } else if (event.message.text == "아니") {
    console.log("USER SELECT : NO in initRestaurantConv");
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        var qrCuisines = qr.generateQuickReplies(["미안해", "어쩌라고"]);
        var messageData = {"text": "칵-퉤;;안해 때려쳐ㅋㅋㅋㅋㅋ인생 진짜", "quick_replies": qrCuisines};
         api.sendResponse(event, messageData);
        callback(null);
      },
    ];
    async.waterfall(task);
  } else {
    console.log("USER SELECT : UNEXPECTED RESPONSE in initRestaurantConv");
  }
};

var restaurantRecommendation_1 = function(event) {
  console.log("RUN: restaurantRecommendation_1");
  if (event.message.text == "한식" ||  "중식" || "일식" || "양식" || "분식") {
    console.log("USER SELECT : " + event.message.text + " in restaurantRecommendation_1");
    // var search = "신촌 맛집 " + event.message.text;
    // if (event.message.text == "한식") { var search = `korean+restaurants+in+Shinchon`; }
    // if (event.message.text == "중식") { var search = `chinese+restaurants+in+Shinchon`; }
    // if (event.message.text == "일식") { var search = `japanese+restaurants+in+Shinchon`; }
    // if (event.message.text == "양식") { var search = `western+restaurants+in+Shinchon`; }
    // if (event.message.text == "분식") { var search = `korean+street+restaurants+in+Shinchon`; }
    // console.log('SEARCH: ' + search);
  } else {
    console.log('UNVERIFIED SEARCH');
  }

  var radius = 5000, location_ShinchonStation = '37.559768,126.94230800000003';
  var options = { method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    qs:
     { location: location_ShinchonStation,
       radius: '5000',
       type: 'restaurant',
       key: process.env.GOOGLE_API_KEY,
       keyword: event.message.text,
       language: 'ko' },
    headers:
     { 'postman-token': 'eebafd36-b12d-e760-e7ca-aaf5a739ce02',
       'cache-control': 'no-cache' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    var jsonRestaurantData = JSON.parse(body);
    if (jsonRestaurantData.results.length > 0) {
      console.log(jsonRestaurantData.results[0].name);
      var messageData = {"text": `${jsonRestaurantData.results[0].name} 어때?`};
      api.sendResponse(event, messageData);
    } else {
      console.log(jsonRestaurantData.status);
    }
  });
};

module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_category" : restaurantRecommendation_1,
  }
};
