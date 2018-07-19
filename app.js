var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var functionSheet = require('./functionSheet');
var api = require('./apiCalls')
var async = require('async');
var mysql = require('mysql');
var path = require('path');
var bus = require('./apiCalls');
var stringSimilarity = require('kor-string-similarity');
var qr = require('./quick_replies');
var restaurant = require('./restaurant');

const https = require('https');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

var apiai = require('apiai');
var nlpapp = apiai("542cfeef5714428193dc4478760de396");

var app = express();
module.exports.APP = app;
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
var connection = mysql.createConnection(process.env.DATABASE_URL);
app.set('port', (process.env.PORT || 5000));

var UNIV_NAME, UNIV_NAME_ENG, MASCOT_NAME, IMAGE_SOURCE;
var setUnivInfo = function() {
  console.log(process.env.HEROKU_URL);
  if (process.env.HEROKU_URL.indexOf("yonsei") > -1) {
    var UNIV_NAME = '연세대', UNIV_NAME_ENG = 'yonsei', MASCOT_NAME = '연구구', IMAGE_SOURCE = './images-yonsei', MASCOT_FIRST_NAME = '구구';
    module.exports.UNIV_NAME = "연세대";
    module.exports.UNIV_NAME_ENG = "yonsei";
    module.exports.MASCOT_NAME = "연구구";
    module.exports.MASCOT_FIRST_NAME = "구구";
    module.exports.IMAGE_SOURCE = './images-yonsei.js';
  } else if (process.env.HEROKU_URL.indexOf("ewha") > -1) {
    var UNIV_NAME = '이화여대', UNIV_NAME_ENG = 'ewha', MASCOT_NAME = '배시시', IMAGE_SOURCE = './images-ewha', MASCOT_FIRST_NAME = '시시';
    module.exports.UNIV_NAME = "이화여대";
    module.exports.UNIV_NAME_ENG = "ewha";
    module.exports.MASCOT_NAME = "배시시";
    module.exports.MASCOT_FIRST_NAME = "시시";
    module.exports.IMAGE_SOURCE = './images-ewha.js';
  } else {
    var UNIV_NAME = '캠퍼스버디', UNIV_NAME_ENG = 'yonsei', MASCOT_NAME = '캠버봇', IMAGE_SOURCE = './images-yonsei', MASCOT_FIRST_NAME = '구구';
    module.exports.UNIV_NAME = "캠퍼스버디";
    module.exports.UNIV_NAME_ENG = "yonsei";
    module.exports.MASCOT_NAME = "캠버봇";
    module.exports.MASCOT_FIRST_NAME = "구구";
    module.exports.IMAGE_SOURCE = './images-yonsei.js';
  }
}

setUnivInfo();

var RESTAURANT_TEMP_DATA = {
    "user_psid_test" : {
      "category1" : "category1_value",
      "category2" : "category2_value",
      "category3" : "category2_value",
      "final_menu" : "final_menu_value"
    }
  };
module.exports.RESTAURANT_TEMP_DATA = RESTAURANT_TEMP_DATA;

//"시작하기" 버튼으로 디폴트
request({
  uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
  qs: { access_token: PAGE_ACCESS_TOKEN },
  method: 'POST',
  json: {
    "get_started":{
      "payload":"<GET_STARTED_PAYLOAD>"
    }
  }
}, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var recipientId = body.recipient_id;
    var messageId = body.message_id;
  } else {
    console.error("Unable to send message.");
    console.error(response);
    console.error(error);
  }
});

// Connect to webhook
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// Post Messages
app.post('/webhook', function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      var event = entry.messaging[0];
      console.log(event);
      console.log('Sender PSID: ' + event.sender.id);
      if (event.postback) {
        console.log('HANDLING POSTBACK');
        handlePostback(event);
      } else if (event.message) {
        console.log('HANDLING MESSAGE');
        var task = [
          function(callback){
            connection.query('SELECT * FROM Users WHERE user_id=' + event.sender.id, function (err, result, fields) {
              callback(null, err, result);
            })
          },
          function(err, result, callback){
            if (err) throw err;
            if (result.length > 0){ // user data exists
              console.log('Conv Context: ' + result[0].conv_context);
              if (result[0].conv_context != "none") {
                if (event.message.text == 'RESET' || event.message.text == '에러') {
                  var resetTask = [
                    function(callback) {
                      api.typingBubble(event);
                      api.sendResponse(event, {"text": "===연구구 한대맞고 정신차리는중==="});
                      setTimeout(function() {
                        callback(null, 'done');
                      }, 1000);
                    },
                    function(err, callback) {
                      api.sendResponse(event, {"text": "더위먹어서 맛이 갔었나봐ㅠㅠ 어떤걸 도와줄까?", "quick_replies": qr.reply_arrays["betaMenu"]});
                      callback(null);
                    }
                  ]
                  async.waterfall(resetTask);
                  callback(null, functionSheet["RESET"]);
                } else {
                  callback(null, functionSheet[result[0].conv_context]);
                }
              } else { // user data exists && conv_context==none
                var apiaiSession = nlpapp.textRequest("'" + event.message.text + "'", {
                  sessionId: event.sender.id
                });
                apiaiSession.on('response', function(response) {
                  var closestFunction = 0;
                  if (stringSimilarity.findBestMatch(event.message.text, functionSheet.beta).similarity > 0.5) {
                    closestFunction = stringSimilarity.findBestMatch(event.message.text, functionSheet.beta)._text;
                    console.log("Closest Function is found - similarity: " + stringSimilarity.findBestMatch(event.message.text, functionSheet.beta).similarity);
                  }
                  console.log("Closest function is: " + closestFunction._text);
                  console.log("IntentName is: " + response.result.metadata.intentName);
                  console.log("Parameters: " + JSON.stringify(response.result.parameters));
                  if (response.result.metadata.intentName == "initRestaurantConv" && response.result.parameters.res_menu != (null || undefined || "")) {
                    RESTAURANT_TEMP_DATA[event.sender.id] = {
                              "category1" : "category1_value",
                              "category2" : "category2_value",
                              "category3" : "category2_value",
                              "final_menu" : response.result.parameters.res_menu
                            }
                    console.log("R T_D: " + JSON.stringify(RESTAURANT_TEMP_DATA));
                    callback(null, functionSheet["restaurantRecommendation_nearbysearch"]);
                  } else {
                    // callback(null, (functionSheet[event.message.text] || functionSheet[closestFunction] || functionSheet[response.result.metadata.intentName] || functionSheet["callChatbot"] || functionSheet["fallback"]));
                    callback(null, (functionSheet[event.message.text] || functionSheet[closestFunction] || functionSheet[response.result.metadata.intentName] ||  functionSheet["fallback"]));
                  }
                });
                apiaiSession.on('error', function(error) {
                  //handle errors
                })
                apiaiSession.end();
              }
            } else {
              console.log('TO registerUser');
              callback(null, functionSheet["registerUser"]);
            }
          },
          function(execute, callback){
            execute(event);
            callback(null);
          }
        ]
        async.waterfall(task);
      } else {
        console.log('UNVERIFIED EVENT TYPE');
      }
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});


//mentor admin page
app.get('/mentor-admin', function(req, res) {
  GetData(function (recordSet) {
        res.render('mentor', {title: "title", recordSet: recordSet, length: recordSet.length });
        console.log(recordSet);
    });
});

function GetData(callBack){
 connection.query('SELECT * from Mentor_Questions', function(err, result){
   callBack(result);
 });
}

app.post('/query/approve', function(req, res) {
  console.log("APPROVE");
});

app.post('/query/decline', function(req, res) {
  console.log("DECLINE");
});

//css / json data from the html file
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'webviews')));


// webview URLs
// app.get('/register', function(req, res){
//   res.sendFile(path.join(__dirname + '/webviews/registration.html'));
// });
//
// app.post('/register/new_user', function(req, res){
//     console.log("REGISTRATION NEW: ");
//     console.log(req.body);
//     connection.query('UPDATE Users SET college_major="' + req.body.newRegiMajor + '" WHERE user_id=' + req.body.user_psid);
//     connection.query('UPDATE Users SET student_number="' + req.body.newRegiClass + '" WHERE user_id=' + req.body.user_psid);
//     res.status(200).end();
//     // res.render('register-success', {data = req.body});
// });
// app.post('/register/re_user', function(req, res){
//     console.log("REGISTRATION RE: ");
//     console.log(req.body);
//     connection.query('UPDATE Users SET college_major="' + req.body.reRegiMajor + '" WHERE user_id=' + req.body.user_psid);
//     connection.query('UPDATE Users SET student_number="' + req.body.reRegiClass + '" WHERE user_id=' + req.body.user_psid);
//     res.status(200).end();
//     // res.render('register-success', {data = req.body});
// });

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
