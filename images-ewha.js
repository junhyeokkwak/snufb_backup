var api = require('./apiCalls');
// var util = require('./utilfunctions');
// var async = require('async');
// var mysql = require("mysql");
// var request = require("request");
// var https = require('https');
// var qr = require('./quick_replies');

var hello_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37402453_1769479139800018_5528326146422210560_o.jpg?_nc_cat=0&oh=b2253d1be032ecde429d516c2e0f8d6e&oe=5BDE088C';
var blingbling_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37332286_1769479323133333_8496776695515185152_o.jpg?_nc_cat=0&oh=cc93280bf20991949a205c5c08952e3e&oe=5BD806DA';
var plain_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37329503_1769479309800001_6454152788556382208_o.jpg?_nc_cat=0&oh=01d7b1436824ff63508468377ace3165&oe=5BD07952';
var eating_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37346177_1769479126466686_5457046005889368064_o.jpg?_nc_cat=0&oh=f2e63f27820170cb975077893b2f5c42&oe=5BC55819';
var love_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37364806_1769479106466688_6511884248595562496_o.jpg?_nc_cat=0&oh=af87fda6dd97e7038c814bc67cc52f2d&oe=5BC99CF8';
var shy_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37325443_1769479113133354_5810358682902331392_o.jpg?_nc_cat=0&oh=6401694602f1293c469446e9ff643cd5&oe=5BD09D9A';
var search_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37340113_1769479313133334_7044923165004267520_o.jpg?_nc_cat=0&oh=5289dc0c84bf05d0d14a80e64fc22f1a&oe=5BDE63E6';
var confused_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37350823_1769479339799998_4541623071626231808_o.jpg?_nc_cat=0&oh=fdd9fe4ef857df91904137a9ad420393&oe=5BD5F13A';

function helloImage(event) {
  api.sendOnlineImage(event, hello_URL);
}

function blingblingImage(event) {
  api.sendOnlineImage(event, blingbling_URL);
}

function plainImage(event) {
  api.sendOnlineImage(event, plain_URL);
}

function eatingImage(event) {
  api.sendOnlineImage(event, eating_URL);
}

function loveImage(event) {
  api.sendOnlineImage(event, love_URL);
}

function shyImage(event) {
  api.sendOnlineImage(event, shy_URL);
}

function searchImage(event) {
  api.sendOnlineImage(event, search_URL);
}

function confusedImage(event) {
  api.sendOnlineImage(event, confused_URL);
}

module.exports.helloImage = helloImage;
module.exports.blingblingImage = blingblingImage;
module.exports.plainImage = plainImage;
module.exports.eatingImage = eatingImage;
module.exports.loveImage = loveImage;
module.exports.shyImage = shyImage;
module.exports.searchImage = searchImage;
module.exports.confusedImage = confusedImage;

module.exports.hello_URL = hello_URL;
module.exports.blingbling_URL = blingbling_URL;
module.exports.plain_URL = plain_URL;
module.exports.eating_URL = eating_URL;
module.exports.love_URL = love_URL;
module.exports.shy_URL = shy_URL;
module.exports.search_URL = search_URL;
module.exports.confused_URL = confused_URL;
