var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var functionSheet = require('./functionSheet');
var util = require('./utilfunctions.js');
var api = require('./apiCalls')
var async = require('async');
var mysql = require('mysql');
var path = require('path');
var bus = require('./apiCalls');
var stringSimilarity = require('kor-string-similarity');

const https = require('https');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

var apiai = require('apiai');
var nlpapp = apiai("542cfeef5714428193dc4478760de396");

var initBadLangConv = function(event) {
  var textArr = ["어허", "어허 그러면 안돼", "ㅠㅠㅠㅠㅠㅠㅠㅠ말이 너무 심하네", "입에 뭔가 물은 것 같아!", "씁", "떽", "못된것만 배웠어"]
  var text = util.choose(textArr);
  var messageData = {"text": text};
  connection.query('UPDATE Users SET conv_context="none" WHERE user_id=' + event.sender.id);
  api.sendResponse(event, messageData);
}

module.exports = {
    functionMatch: {
        "initBadLangConv": initBadLangConv,
    }
};
