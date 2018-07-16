var api = require('./apiCalls');
// var util = require('./utilfunctions');
// var async = require('async');
// var mysql = require("mysql");
// var request = require("request");
// var https = require('https');
// var qr = require('./quick_replies');

var hello_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37048455_1762217433859522_3896376794579730432_o.jpg?_nc_cat=0&oh=7fa82b03a7f370b7104cd4e05823c1f0&oe=5BE39509';
var blingbling_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37045787_1762217183859547_1545457248896024576_o.jpg?_nc_cat=0&oh=69d4d0b2c035ef1ee4dfa540cb99f3be&oe=5BDC55DC';
var plain_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37062873_1762217207192878_4321283561349971968_o.jpg?_nc_cat=0&oh=d785e8105aee845d6c9a481dc7a17c97&oe=5BECA07D';
var eating_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37044843_1762217223859543_4313257959690862592_o.jpg?_nc_cat=0&oh=4ca75650266c250ac555827516e7d45c&oe=5BE7B6AC';
var love_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37095130_1762217417192857_567585752142053376_o.jpg?_nc_cat=0&oh=db127d192ae707e462e1e404a770e56d&oe=5BD62451';
var shy_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37103930_1762217173859548_3695041376421937152_o.jpg?_nc_cat=0&oh=21b4d04266d3876fa4da91626ba788a8&oe=5BA0BDA7';
var search_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37158402_1762217397192859_6324696950926999552_o.jpg?_nc_cat=0&oh=5e932fbe73060e81e75222b05adfc1eb&oe=5BE3AE16';
var confused_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37020704_1762217407192858_2282348133650268160_o.jpg?_nc_cat=0&oh=423c461ba1495bb4226304b97e85dda3&oe=5BEBFEB4';

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
