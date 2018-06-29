var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var functionSheet = require('./functionSheet');
var api = require('./apiCalls')
var async = require('async');
var mysql = require('mysql');
var path = require('path');

const https = require('https');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

var apiai = require('apiai');
var nlpapp = apiai("542cfeef5714428193dc4478760de396");

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
var connection = mysql.createConnection(process.env.DATABASE_URL);
app.set('port', (process.env.PORT || 5000));

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
            if (result.length > 0){
              console.log('Conv Context: ' + result[0].conv_context);
              if (result[0].conv_context != "none") {
                if (event.message.text == 'RESET') {
                  callback(null, functionSheet["RESET"]);
                } else if (event.message.text == 'TEST REGI'){
                  console.log('SET CONV CONT: register1');
                  connection.query('UPDATE Users SET conv_context="register1" WHERE user_id=' + event.sender.id);
                  console.log('Conv Context: ' + result[0].conv_context);
                  callback(null, functionSheet[result[0].conv_context]);
                } else if (event.message.text == 'TEST BUS') {
                  console.log("TEST BUS WEBVIEW");
                  connection.query('UPDATE Users SET conv_context="handleMultipleStNm" WHERE user_id=' + event.sender.id);
                  console.log('Conv Context: ' + result[0].conv_context);
                  callback(null, functionSheet[result[0].conv_context]);
                }
                // else if ((event.message.text.length > 12) && (event.message.text.substr(0,12) == 'SET CONV CON:')) {
                //   var newConvContext = event.message.text.substr(12,event.message.text.length);
                //   connection.query('UPDATE Users SET conv_context="'+ newConvContext +'" WHERE user_id=' + event.sender.id);
                //   callback(null, functionSheet[newConvContext]);
                //   console.log('Conv Context: ' + result[0].conv_context);
                // }
                else {
                  callback(null, functionSheet[result[0].conv_context]);
                }
              } else {
                var apiaiSession = nlpapp.textRequest("'" + event.message.text + "'", {
                  sessionId: event.sender.id
                });
                apiaiSession.on('response', function(response) {
                  //console.log(functionSheet[event.message.text])
                  callback(null, (functionSheet[event.message.text] || functionSheet[response.result.metadata.intentName] || functionSheet["fallback"]));
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
app.get('/register', function(req, res){
  res.sendFile(path.join(__dirname + '/webviews/registration.html'));
});

app.post('/register/new_user', function(req, res){
    console.log("REGISTRATION NEW: ");
    console.log(req.body);
    connection.query('UPDATE Users SET college_major="' + req.body.newRegiMajor + '" WHERE user_id=' + req.body.user_psid);
    connection.query('UPDATE Users SET student_number="' + req.body.newRegiClass + '" WHERE user_id=' + req.body.user_psid);
    res.status(200).end();
    // res.render('register-success', {data = req.body});
});
app.post('/register/re_user', function(req, res){
    console.log("REGISTRATION RE: ");
    console.log(req.body);
    connection.query('UPDATE Users SET college_major="' + req.body.reRegiMajor + '" WHERE user_id=' + req.body.user_psid);
    connection.query('UPDATE Users SET student_number="' + req.body.reRegiClass + '" WHERE user_id=' + req.body.user_psid);
    res.status(200).end();
    // res.render('register-success', {data = req.body});
});

app.get('/busRoute', function(req, res){
  // res.send("<h1>안녕하세요</h1>")
  res.sendFile(path.join(__dirname + '/webviews/busStationWebview.html'));
});
app.post('/busRoute/result', function(req,res){
  console.log(req.body)
  res.send("welcome! " + req.body.email)
})
app.post('/busRoute/send_result', function(req, res){
  console.log(req.body.email);
  var responseData = {'result' : 'ok', 'email' : req.body.email}
  res.json(responseData);
  // 서버에서는 JSON.stringify 필요없음
})

var bus_busRouteWebviewHelper = function(event, responseData) {
  console.log('RUN bus_busRouteWebviewHelper1');
  app.get('/busRoute/positiondata', function(req, res){
    console.log('RUN bus_busRouteWebviewHelper2');
    console.log("responseData: " +JSON.stringify(responseData));
    res.json(responseData);
  })
}
module.exports.bus_busRouteWebviewHelper = bus_busRouteWebviewHelper;


app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
