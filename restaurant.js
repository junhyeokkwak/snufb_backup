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
    if (event.message.text == "한식") { var search = `korean+restaurants+in+Shinchon`; }
    if (event.message.text == "중식") { var search = `chinese+restaurants+in+Shinchon`; }
    if (event.message.text == "일식") { var search = `japanese+restaurants+in+Shinchon`; }
    if (event.message.text == "양식") { var search = `western+restaurants+in+Shinchon`; }
    if (event.message.text == "분식") { var search = `korean+street+restaurants+in+Shinchon`; }
    console.log('SEARCH: ' + search);
  } else {
    console.log('UNVERIFIED SEARCH');
  }
  var GOOGLE_API_KEY = 'AIzaSyDyy2ybaYJNa4BDlSV39FOb5sLb88HCXj0&location=37.559768/126.94230800000003';
  var options = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${search}&key=${GOOGLE_API_KEY}`;
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(JSON.parse(body));
    var jsonRestaurantData = JSON.parse(body);
    console.log(jsonRestaurantData.result);
    console.log(jsonRestaurantData.result[0].name);
    var messageData = {"text": `${jsonRestaurantData.result[0].name} 어때?`};
    api.sendResponse(event, messageData);
  });
  // var naverClientID = 'mSdY16Cdgy3tfbILEmSN';
  // var naverClientSecret = 'EjgVHFWgzo';
  // var options = {
  //     method: 'GET',
  //     // url : 'https://openapi.naver.com/v1/search/shop.json',
  //     url : 'https://openapi.naver.com/v1/search/local.json',
  //     qs : {
  //       query : search,
  //       display : 1,
  //       start : 1,
  //       sort : "comment" // 리뷰 개수 순
  //     },
  //     headers: {
  //       'X-Naver-Client-Id':naverClientID,
  //       'X-Naver-Client-Secret': naverClientSecret,
  //     },
  // };
  // var task = [
  //   function(callback){
  //     var err;
  //     connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  //     callback(null, err);
  //   },
  //   function(err, callback){
  //     var body;
  //     request(options, function (error, response, body) {
  //       var body = body;
  //       if (error) throw new Error(error);
  //       //console.log(JSON.parse(body));
  //       console.log(JSON.parse(body).items);
  //       console.log("RECO RES TITLE: " + JSON.parse(body).items[0].title);
  //       console.log("RECO RES LINK: " + JSON.parse(body).items[0].link);
  //       console.log("RECO RES CATEGORY: " + JSON.parse(body).items[0].category);
  //       var title = JSON.parse(body).items[0].title;
  //       var url = JSON.parse(body).items[0].link;
  //       var image_url = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE';
  //       var category = JSON.parse(body).items[0].category.split('>')[1];
  //       // var category = "[임시카테고리]";
  //       var titleMessage = title;
  //       var buttonMessage = title + " 사이트 바로가기!";
  //       var innertask = [
  //         function(callback) {
  //           var innerErr;
  //           api.sendResponse(event, {'text' : "흠...오늘 메뉴는 " + category + " 어때??"});
  //           callback(null,innerErr);
  //         },
  //         function(innerErr, callback) {
  //           setTimeout(function() {
  //             callback(null, innerErr);
  //           },1000);
  //         },
  //         function(innerErr, callback) {
  //           if (url == '') {
  //             console.log('RESTAURANT URL DNE');
  //             url = 'http://www.example.com/'
  //             if (JSON.parse(body).items[0].link != "" && isImageUrl(JSON.parse(body).items[0].link)) {
  //               var imageURL = JSON.parse(body).items[0].link;
  //             }
  //             api.handleRestaurantWebview(event, titleMessage, url, image_url, buttonMessage);
  //             callback(null, innerErr);
  //           } else {
  //             console.log('RESTAURANT URL EXISTS');
  //             if (JSON.parse(body).items[0].link != "" && isImageUrl(JSON.parse(body).items[0].link)) {
  //               var imageURL = JSON.parse(body).items[0].link;
  //             }
  //             api.handleRestaurantWebview(event, titleMessage, url, image_url, buttonMessage);
  //             callback(null, innerErr);
  //           }
  //         },
  //         function(innerErr, callback) {
  //           api.sendResponse(event, {'text' : "신촌 주변 " + category + " 중 에서는" + Josa(title, "가") +" 괜찮데:)"});
  //           callback(null);
  //         },
  //       ];
  //       async.waterfall(innertask);
  //     });
  //     callback(null);
  //   },
  // ];
  // async.waterfall(task);
};

function Josa(txt, josa){
	var code = txt.charCodeAt(txt.length-1) - 44032;
	var cho = 19, jung = 21, jong=28;
	var i1, i2, code1, code2;
	// 원본 문구가 없을때는 빈 문자열 반환
	if (txt.length == 0) return '';
	// 한글이 아닐때
	if (code < 0 || code > 11171) return txt;
  var jong
	if (code % 28 == 0) {
    jong = false;
    if (josa == '을' || josa == '를') josaResult = (jong?'을':'를');
    if (josa == '이' || josa == '가') josaResult = (jong?'이':'가');
    if (josa == '은' || josa == '는') josaResult = (jong?'은':'는');
    if (josa == '와' || josa == '과') josaResult = (jong?'와':'과');
    return txt + josaResult;
  } else {
    jong = true;
    if (josa == '을' || josa == '를') josaResult = (jong?'을':'를');
    if (josa == '이' || josa == '가') josaResult = (jong?'이':'가');
    if (josa == '은' || josa == '는') josaResult = (jong?'은':'는');
    if (josa == '와' || josa == '과') josaResult = (jong?'와':'과');
    return txt + josaResult;
  }
}

module.exports = {
  functionMatch: {
    "배고파": initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
    "restaurantRecommendation_1" : restaurantRecommendation_1,
  }
};
