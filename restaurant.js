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
var stringSimilarity = require('kor-string-similarity');
var connection = mysql.createConnection(process.env.DATABASE_URL);
const fs = require('fs');

var basicConvFile=fs.readFileSync('./jsondata/basicConv.json', 'utf8');
var busRouteFile=fs.readFileSync('./jsondata/busRouteJsonData.json', 'utf8');
var cuisineFile=fs.readFileSync('./jsondata/cuisinesJsonData.json', 'utf8');
var basicConv = JSON.parse(basicConvFile);
var busRouteJsonData = JSON.parse(busRouteFile);
var cuisinesJsonData = JSON.parse(cuisineFile);

// var app.RESTAURANT_TEMP_DATA = {
//     "user_psid_test" : {
//       "category1" : "category1_value",
//       "category2" : "category2_value",
//       "category3" : "category2_value",
//       "final_menu" : "final_menu_value"
//     }
//   };
// module.exports.app.RESTAURANT_TEMP_DATA = app.RESTAURANT_TEMP_DATA;

var choose = function(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}


var initRestaurantConv = function(event) {
  console.log('RUN initRestaurantConv');
  var task = [
    function(callback){
      var err;
      connection.query('UPDATE Users SET conv_context="initRestaurantRecommendation" WHERE user_id=' + event.sender.id);
      // app.RESTAURANT_TEMP_DATA[event.sender.id]= {
      //   "category1" : "category1_value",
      //   "category2" : "category2_value",
      //   "category3" : "category2_value",
            // "final_menu" : "final_menu_value"
      // }
      // console.log("R T D: " + JSON.stringify(app.RESTAURANT_TEMP_DATA));
      callback(null, err);
    },
    function(err, callback){
      var messageData = {"text": "왜 굶고다녀ㅠㅠ심심한데 맛집 추천해줄까?", "quick_replies": qr.reply_arrays['YesOrNo']};
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
        app.RESTAURANT_TEMP_DATA[event.sender.id]= {
          "category1" : "category1_value",
          "category2" : "category2_value",
          "category3" : "category2_value",
          "final_menu" : "final_menu_value"
        }
        callback(null, 'done');
      },
      function(err, callback){
        var qrCuisines = qr.generateQuickReplies(["그냥 말할래", "나라별", "종합", "상황별", "재료별"]);
        var messageData = {"text": "어떻게 찾아줄까??", "quick_replies": qrCuisines};
        api.sendResponse(event, messageData);
        callback(null);
      }
    ];
    async.waterfall(task);
  } else if ((event.message.text == "아니") ||
      (stringSimilarity.arrangeBySimilarity(event.message.text,  basicConv.disagreementArr)[0].similarity > 0.5)) {
    console.log("USER SELECT : NO in initRestaurantConv");
    // var qrCuisines = qr.generateQuickReplies(["미안해", "어쩌라고"]);
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    var messageData = {"text": "너무하네ㅋㅋㅋㅋㅋㅋㅋ인생 진짜"};
    // var messageData = {"text": "너무하네ㅋㅋㅋㅋㅋㅋㅋ인생 진짜", "quick_replies": qrCuisines};
    api.sendResponse(event, messageData);
  } else {
    console.log("USER SELECT : UNEXPECTED RESPONSE in initRestaurantConv");
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
    var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var messageData = {"text": choose(textArr)};
    api.sendResponse(event, messageData);
  }
};

var restaurantRecommendation_re = function(event) {

}

var restaurantRecommendation_category_0 = function(event) {
  console.log("RUN: restaurantRecommendation_category_0");
  if (["그냥 말할래", "나라별", "종합", "상황별", "재료별"].indexOf(event.message.text) > -1) {
  // if (event.message.text == "그냥 말할래" || event.message.text == "나라별" || event.message.text == "종합" || event.message.text == "상황별" || event.message.text == "재료별") {
    console.log("USER SELECT : " + event.message.text + " in restaurantRecommendation_category_0");
    if (event.message.text == "그냥 말할래") {
      var messageData = {"text": "뭐 먹고 싶어? 말해봐! 가게 추천해줄게"};
      api.sendResponse(event, messageData);
      connection.query('UPDATE Users SET conv_context="restaurantRecommendation_nearbysearch" WHERE user_id=' + event.sender.id);
    } else {
      connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_1" WHERE user_id=' + event.sender.id);
      app.RESTAURANT_TEMP_DATA[event.sender.id].category1 = event.message.text;
      console.log(Object.keys(cuisinesJsonData[event.message.text]));
      var qrCuisines = qr.generateQuickReplies(Object.keys(cuisinesJsonData[event.message.text]));
      var messageData = {"text": `${event.message.text} 중에서는 어떤걸로 추천해줄까!`, "quick_replies": qrCuisines};
      api.sendResponse(event, messageData);
    }
  } else {
    console.log('UNVERIFIED SEARCH');
    var qrCuisines = qr.generateQuickReplies(["대화 다시하기", "그냥 말할래", "나라별", "종합", "상황별", "재료별"]);
    var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var messageData = {"text": choose(textArr) + " 혹시 맛집 정보 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies": qrCuisines};
    connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_2" WHERE user_id=' + event.sender.id);
  }
};

var restaurantRecommendation_category_1 = function(event) {
  console.log("RUN restaurantRecommendation_category_1");
  var category1 = app.RESTAURANT_TEMP_DATA[event.sender.id].category1;
  var category1Json = cuisinesJsonData[category1];
  console.log(category1Json);
  var category2Arr = Object.keys(category1Json);
  console.log(category2Arr);
  if (category2Arr.indexOf(event.message.text) > -1) {
    connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_2" WHERE user_id=' + event.sender.id);
    app.RESTAURANT_TEMP_DATA[event.sender.id].category2 = event.message.text;
    console.log("R T D: " + JSON.stringify(app.RESTAURANT_TEMP_DATA));
    var qrCuisines = qr.generateQuickReplies(cuisinesJsonData[category1][event.message.text]);
    var messageData = {"text": `${event.message.text} 중에서는 어떤걸로 추천해줄까!`, "quick_replies": qrCuisines};
    api.sendResponse(event, messageData);
  } else {
    var qrCuisines = qr.generateQuickReplies(category2Arr.concat(["대화 다시하기"]));
    var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var messageData = {"text": choose(textArr) + " 혹시 맛집 정보 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies": qrCuisines};
    connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_2" WHERE user_id=' + event.sender.id);
  }
}

var restaurantRecommendation_category_2 = function(event) {
  console.log("RUN restaurantRecommendation_category_1");
  var category1 = app.RESTAURANT_TEMP_DATA[event.sender.id].category1;
  var category2 = app.RESTAURANT_TEMP_DATA[event.sender.id].category2;
  var category3Arr = cuisinesJsonData[category1][category2];
  console.log(event.message.text);
  if (category3Arr.indexOf(event.message.text) > -1) {
    app.RESTAURANT_TEMP_DATA[event.sender.id].category3 = event.message.text;
    console.log("R T D: " + JSON.stringify(app.RESTAURANT_TEMP_DATA));
    restaurantRecommendation_nearbysearch(event);
  } else {
    var qrCuisines = qr.generateQuickReplies(category3Arr.concat(["대화 다시하기"]));
    var textArr = ["미안ㅠㅠ무슨 말인지 모르겠어...조금 다르게 다시 말해 줄 수 있어?", `무슨말인지 잘 모르겠어ㅋㅋ큐ㅠ 다시 말해줘!`, "무슨 말인지 잘 모르겠어ㅠ 다시 말 해줘", "미안ㅋㅋㅠㅠ무슨말인지 잘 모르겠어ㅠ 다시 말 해줘!",
      "귀가 미쳤나봐 무슨 말인지 모르겠다ㅋㅋㅋ:( 조금 다르게 다시 말해줘!", "흐어...왜 무슨말인지 모르겠냐ㅋㅋㅋ다시 말해줘!", "조금 다르게 다시 말해 줄 수 있어? 무슨 말인지 모르겄다ㅋㅋㅋ"];
    var messageData = {"text": choose(textArr) + " 혹시 맛집 정보 찾기를 취소하고싶으면 \"대화 다시하기\"라고 말해줘! ", "quick_replies": qrCuisines};
    connection.query('UPDATE Users SET conv_context="restaurantRecommendation_category_2" WHERE user_id=' + event.sender.id);
    api.sendResponse(event, messageData);
  }
}

var restaurantRecommendation_category_3 = function(event) {

}

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

var restaurantRecommendation_nearbysearch = function(event) {
  console.log("RUN: restaurantRecommendation_nearbysearch");

  if (true) {
    // NOTE:
    console.log("VALID INPUT");
    var menu;
    if (app.RESTAURANT_TEMP_DATA[event.sender.id].final_menu == (null || undefined || "" || "final_menu_value")) {
      app.RESTAURANT_TEMP_DATA[event.sender.id].final_menu = event.message.text;
      menu = event.message.text;
    } else {
      menu = app.RESTAURANT_TEMP_DATA[event.sender.id].final_menu;
    }
    console.log("R T D: " + JSON.stringify(app.RESTAURANT_TEMP_DATA));
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
    var textArr1 = [`알겠어!!:)`, `오키오키!`, "알았어!ㅎㅎ", `응응!`];
    var textArr2 = [`식당을 찾아줄게!`, `맛집을 찾아볼게!`, `맛있는 집을 검색할게!!`, `유명한 식당을 찾아볼게:)`];
    var messageData = {"text": `${choose(textArr1)} 신촌 근처 ${menu} ${textArr2}`};
    api.sendResponse(event, messageData);
    var radius = 5000, location_ShinchonStation = '37.559768,126.94230800000003';
    var options = { method: 'GET',
      url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      qs:
       { location: location_ShinchonStation,
         radius: radius,
         type: 'restaurant',
         key: process.env.GOOGLE_API_KEY,
         keyword: menu,
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
        var maxSlideNum = ((jsonRestaurantData.results.length > 10) ? 10 : jsonRestaurantData.results.length);
        for (var i = 0; i < maxSlideNum; i++) {
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
            app.RESTAURANT_TEMP_DATA[event.sender.id]= {
              "category1" : "category1_value",
              "category2" : "category2_value",
              "category3" : "category2_value",
              "final_menu" : "final_menu_value"
            }
            connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
          }
        } //   for (var i = 0; i < (jsonRestaurantData.results.length && 10); i++) {
      } else {
        console.log(jsonRestaurantData.status);
        connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
        var textArr1 = [`미안해ㅠㅠ`, `어떡하냐ㅠ`, `흐어...`, "미안해서 어떡해...", `진짜 미안해ㅠ`];
        var textArr2 = [`${menu}에 대한 맛집 정보가 없어:(`, `알고있는 ${menu} 맛집이 없어`, `${menu} 맛집 정보가 없어..:(`, ` 내가 아는 ${menu} 맛집이 없다..:( `];
        api.sendResponse(event, {"text": `${choose(textArr1)} ${choose(textArr2)}` });
      }
    }); //request
  } else {
    console.log("INVALID INPUT");
    connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id)
  }
}


module.exports = {
  functionMatch: {
    "initRestaurantConv" : initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_category_0" : restaurantRecommendation_category_0,
    "restaurantRecommendation_category_1" : restaurantRecommendation_category_1,
    "restaurantRecommendation_category_2" : restaurantRecommendation_category_2,
    "restaurantRecommendation_category_3" : restaurantRecommendation_category_3,
    "restaurantRecommendation_nearbysearch" : restaurantRecommendation_nearbysearch,
  }
};
