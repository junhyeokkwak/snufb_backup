var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

var hello_URL = 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/37048455_1762217433859522_3896376794579730432_o.jpg?_nc_cat=0&oh=7fa82b03a7f370b7104cd4e05823c1f0&oe=5BE39509';

function helloImage(event) {
  api.sendOnlineImage(event, hello_URL);
}

module.exports.helloImage = helloImage;
