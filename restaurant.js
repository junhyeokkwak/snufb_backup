var app = require("./app");
var path = require('path');
var url = require('url');
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
var connection = mysql.createConnection(process.env.DATABASE_URL);
const fs = require('fs');

var basicConvFile=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
var busRouteFile=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
var cuisineFile=fs.readFileSync('./jsondata/cuisinesJsonData.json', 'utf8');
var basicConv=JSON.parse(basicConvFile), busRouteJsonData = JSON.parse(busRouteFile),  cuisinesJsonData = JSON.parse(cuisineFile);

var RESTAURANT_TEMP_DATA = {
    "user_psid_test" : {
      "category1" : "category1_value",
      "category2" : "category2_value"
    }
  };

var initRestaurantConv = function(event) {
  console.log('RUN initRestaurantConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="initRestaurantRecommendation" WHERE user_id=' + event.sender.id);
      RESTAURANT_TEMP_DATA[event.sender.id]= {
        "category1" : "category1_value",
        "category2" : "category2_value"
      }
      console.log("R T D: " + JSON.stringify(RESTAURANT_TEMP_DATA));
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
  if ((event.message.text == "응") ||
      (stringSimilarity.arrangeBySimilarity(event.message.text,  basicConv.agreementArr)[0].similarity > 0.5)){
    console.log("USER SELECT : YES in initRestaurantConv");
    var task = [
      function(callback){
        connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_0" WHERE user_id=' + event.sender.id);
        callback(null, 'done');
      },
      function(err, callback){
        var qrCuisines = qr.generateQuickReplies(["그냥 말할래", "나라별", "종합", "상황별", "재료별"]);
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
        connection.query('UPDATE Users SET conv_context="restaurantRecommendation_re" WHERE user_id=' + event.sender.id);
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

var restaurantRecommendation_re = function(event) {

}

var restaurantRecommendation_category_0 = function(event) {
  console.log("RUN: restaurantRecommendation_category_0");
  console.log("@@@TEST@@@: "+event.message.text);
  if (event.message.text == "종합") console.log("@@@@@@@@@@@@@@@종합");
  // if (event.message.text == "그냥 말할래" || event.message.text == "종합") {
  if (event.message.text == ("그냥 말할래" || "종합")) {

    console.log("USER SELECT : " + event.message.text + " in restaurantRecommendation_category_0");
    if (event.message.text == "그냥 말할래") {
      var messageData = {"text": "뭐 먹고 싶어? 말해봐! 가게 추천해줄게"};
      api.sendResponse(event, messageData);
      connection.query('UPDATE Users SET conv_context="restaurantRecommendation_nearbysearch" WHERE user_id=' + event.sender.id);
    } else {
      connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_1" WHERE user_id=' + event.sender.id);

      RESTAURANT_TEMP_DATA[event.sender.id].category1 = event.message.text;
      console.log("R T D: " + JSON.stringify(RESTAURANT_TEMP_DATA));
    }
  } else {
    console.log('UNVERIFIED SEARCH');
    var qrCuisines = qr.generateQuickReplies(["그냥 말할래", "나라별", "종합", "상황별", "재료별"]);
    var messageData = {"text": "무슨말인지 모르겠어:( 다시 말해주라", "quick_replies": qrCuisines};
    connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_0" WHERE user_id=' + event.sender.id);
    api.sendResponse(event, messageData);
  }
};

var restaurantRecommendation_category_1 = function(event) {
  console.log("RUN restaurantRecommendation_category_1");
}

var restaurantRecommendation_nearbysearch = function(event) {
  console.log("RUN: restaurantRecommendation_nearbysearch");
  var restaurantRecommendation_webviewHelper = function(name, place_id, xpos, ypos, vicinity) {
    app.APP.get(`/restaurant/${place_id}`, function(req, res){
      var restaurantData = {
        name: name,
        place_id: place_id,
        xpos: xpos,
        ypos: ypos,
        vicinity: vicinity,
      }
      res.render(__dirname + "/webviews/restaurantMap.html", restaurantData);
    });
    app.APP.post(`/restaurant/${place_id}`, function(req, res){ console.log(req.body); });
  }

  if (event.message.text.length > 0 ) {
    // NOTE: need to compare string-similarity of text with those of items in the cusines Arr.
    console.log("VALID INPUT");
    var messageData = {"text": `알았어!! 신촌 근처 ${event.message.text} 식당을 찾아봐줄게:)`};
    api.sendResponse(event, messageData);
    var radius = 5000, location_ShinchonStation = '37.559768,126.94230800000003';
    var options = { method: 'GET',
      url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      qs:
       { location: location_ShinchonStation,
         radius: radius,
         type: 'restaurant',
         key: process.env.GOOGLE_API_KEY,
         keyword: event.message.text,
         language: 'ko' },
      headers:
       { 'postman-token': 'eebafd36-b12d-e760-e7ca-aaf5a739ce02',
         'cache-control': 'no-cache' } }; //options

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
      var jsonRestaurantData = JSON.parse(body);
      if (jsonRestaurantData.results.length > 0) {
        var genericTemplatesArr = [];
        for (var i = 0; i < (jsonRestaurantData.results.length && 10); i++) {
          var image_url, rating, vicinity, url, name, place_id, xpos, ypos;
          name = jsonRestaurantData.results[i].name;
          place_id = jsonRestaurantData.results[i].place_id;
          xpos = jsonRestaurantData.results[i].geometry.location.lat;
          ypos = jsonRestaurantData.results[i].geometry.location.lng;
          console.log(`${i}th item's name:${name} place_id:${place_id} xpos:${xpos} ypos:${ypos}`);
          // console.log(i + "th item's name: " +jsonRestaurantData.results[i].name);
          // console.log(i + "th item's lat: " +jsonRestaurantData.results[i].geometry.location.lat);
          // console.log(i + "th item's lng: " +jsonRestaurantData.results[i].geometry.location.lng);
          // console.log(i + "th item's place_id: " +jsonRestaurantData.results[i].place_id);
          // console.log(i + "th item's rating: " +jsonRestaurantData.results[i].rating);
          // console.log(i + "th item's vicinity: " +jsonRestaurantData.results[i].vicinity);
          // console.log(i + "th item's photo bool: " +jsonRestaurantData.results[i].hasOwnProperty('photos'));
          rating = (!(jsonRestaurantData.results[i].hasOwnProperty('rating')) || (jsonRestaurantData.results[i].rating == (null || undefined || "undefined"))
            ? "평점 정보가 없어ㅠ" : jsonRestaurantData.results[i].rating+"/5점");
          vicinity = (!(jsonRestaurantData.results[i].hasOwnProperty('vicinity')) || (jsonRestaurantData.results[i].vicinity == (null || undefined || "undefined"))
            ? "위치 정보가 없어ㅠ" : jsonRestaurantData.results[i].vicinity);
          if (jsonRestaurantData.results[i].hasOwnProperty('photos')) {
            image_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${jsonRestaurantData.results[i].photos[0].photo_reference}&key=${process.env.GOOGLE_API_KEY}`
          } else {
            image_url = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE';
          }
          // NOTE: create a webpage
          restaurantRecommendation_webviewHelper(name, place_id, xpos, ypos, vicinity);
          genericTemplatesArr.push(
            {
              "buttons": [
                {
                  "title":`${name} 위치보기!`,
                  "type":"web_url",
                  "url" : process.env.HEROKU_URL + `/restaurant/${place_id}`,
                  "webview_height_ratio": "compact",
                  "messenger_extensions" : false,
                },
              ],
              "image_url" : image_url,
              "title": name,
              "subtitle" : `주소: ${vicinity} \n평점: ${rating}`,
            }//template
          )//push
          if ((i == jsonRestaurantData.results.length-1) || (i == 9)) {
            console.log("SENDING genericTemplatesArr");
            var messageData = {
              "recipient":{
                "id":event.sender.id
              },
              "message":{
                "attachment":{
                  "type":"template",
                  "payload":{
                    "template_type":"generic",
                    "elements": genericTemplatesArr
                  }//payload
                }//attachment
              }//message
            }//messageData
            api.callSendAPI(messageData);
            connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
          }
        } //   for (var i = 0; i < (jsonRestaurantData.results.length && 10); i++) {
      } else {
        console.log(jsonRestaurantData.status);
      }
    }); //request
  } else {
    console.log("INVALID INPUT");
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
  }
}




module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_category_0" : restaurantRecommendation_category_0,
    "restaurantRecommendation_nearbysearch" : restaurantRecommendation_nearbysearch,
  }
};
