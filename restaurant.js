var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");
const fs = require('fs');
const isImageUrl = require('is-image-url');

var basicConvFile=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
var busRouteFile=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
var cuisineFile=fs.readFileSync('./jsondata/cuisinesJsonData.json', 'utf8');
var basicConv=JSON.parse(basicConvFile), busRouteJsonData = JSON.parse(busRouteFile),  cuisinesJsonData = JSON.parse(cuisineFile);
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

var restaurantRecommendation_category = function(event) {
  console.log("RUN: restaurantRecommendation_category");
  if (event.message.text == ("그냥 말할래" || "종합" || "상황별" || "재료별" || "나라별")) {
    console.log("USER SELECT : " + event.message.text + " in restaurantRecommendation_category");
    if (event.message.text == "그냥 말할래") {
      var messageData = {"text": "뭐 먹고 싶어? 말해봐! 가게 추천해줄게"};
      connection.query('UPDATE Users SET conv_context="restaurantRecommendation_freeResponse" WHERE user_id=' + event.sender.id);
    }
    if (event.message.text == "나라별") connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    if (event.message.text == "종합") connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    if (event.message.text == "상황별") connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    if (event.message.text == "재료별") connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  } else {
    console.log('UNVERIFIED SEARCH');
    var qrCuisines = qr.generateQuickReplies(["그냥 말할래", "나라별", "종합", "상황별", "재료별"]);
    var messageData = {"text": "무슨말인지 모르겠어:( 다시 말해주라", "quick_replies": qrCuisines};
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    api.sendResponse(event, messageData);
  }
};

var restaurantRecommendation_freeResponse = function(event) {
  console.log("RUN: restaurantRecommendation_freeResponse");
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
        // console.log(jsonRestaurantData.results[0]);
        console.log(jsonRestaurantData.results[0].name);
        console.log(jsonRestaurantData.results[0].place_id);
        console.log(jsonRestaurantData.results[0].rating);
        console.log(jsonRestaurantData.results[0].vicinity);
        var url = `www.example.com`
        console.log(jsonRestaurantData.results[0].hasOwnProperty('photos'));
        if (jsonRestaurantData.results[0].hasOwnProperty('photos')) {
          console.log(jsonRestaurantData.results[0].photos[0].photo_reference);
        }
        var messageData = {
          "recipient":{
            "id":event.sender.id
          },
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements":[

                  {
                    "buttons": [
                      {
                        "title":"TEST",
                        "type":"web_url",
                        "url": 'www.example.com',
                        "webview_height_ratio": "compact",
                        "messenger_extensions" : false,
                      },
                    ],
                    "image_url" : 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE',
                    "title":"밑의 주소로 들어가서 등록해줘!"
                  },

                  {
                    "buttons": [
                      {
                        "title":"TEST",
                        "type":"web_url",
                        "url": 'www.example.com',
                        "webview_height_ratio": "compact",
                        "messenger_extensions" : false,
                      },
                    ],
                    "image_url" : 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE',
                    "title":"밑의 주소로 들어가서 등록해줘!"
                  },
                  
                  {
                    "buttons": [
                      {
                        "title":"TEST",
                        "type":"web_url",
                        "url": 'www.example.com',
                        "webview_height_ratio": "compact",
                        "messenger_extensions" : false,
                      },
                    ],
                    "image_url" : 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE',
                    "title":"밑의 주소로 들어가서 등록해줘!"
                  }


                ]//elements
              }//payload
            }//attachment
          }//message
        }//messageData
        // let messageData = {
        //   "recipient":{
        //     "id":event.sender.id
        //   },
        //   "message":{
        //     "attachment":{
        //       "type":"template",
        //       "payload":{
        //         "template_type":"button",
        //         "text":"Try the URL button!",
        //         "buttons":[
        //           {
        //             "type":"web_url",
        //             "url":"https://maps.google.com/maps/contrib/108555596243936676377/photos",
        //             "title":"URL Button",
        //             "webview_height_ratio": "compact"
        //           }
        //         ]
        //       }
        //     }
        //   }
        // };//messageDat
        api.callSendAPI(messageData);
        // api.handleRestaurantWebview(event, titleMessage, url, image_url, buttonMessage);
      } else {
        console.log(jsonRestaurantData.status);
      }
    }); //request

  } else {
    console.log("INVALID INPUT");
  }
}

module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_category" : restaurantRecommendation_category,
    "restaurantRecommendation_freeResponse" : restaurantRecommendation_freeResponse,
  }
};

// var radius = 5000, location_ShinchonStation = '37.559768,126.94230800000003';
// var options = { method: 'GET',
//   url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
//   qs:
//    { location: location_ShinchonStation,
//      radius: radius,
//      type: 'restaurant',
//      key: process.env.GOOGLE_API_KEY,
//      keyword: event.message.text,
//      language: 'ko' },
//   headers:
//    { 'postman-token': 'eebafd36-b12d-e760-e7ca-aaf5a739ce02',
//      'cache-control': 'no-cache' } };
//
// request(options, function (error, response, body) {
//   if (error) throw new Error(error);
//   console.log(body);
//   var jsonRestaurantData = JSON.parse(body);
//   if (jsonRestaurantData.results.length > 0) {
//     console.log(jsonRestaurantData.results[0].name);
//     var messageData = {"text": `${jsonRestaurantData.results[0].name} 어때?`};
//     api.sendResponse(event, messageData);
//   } else {
//     console.log(jsonRestaurantData.status);
//   }
// });
