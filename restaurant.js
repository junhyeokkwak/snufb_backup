var request = require("request");
var qr = require('./quick_replies');
var api = require('./apiCalls')
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

function initRestaurantConv(event) {
  console.log('RUN initRestaurantConv');
}

function initRestaurantRecommendation(event) {
  console.log("RUN: initRestaurantRecommendation");
}


var initRestaurantConvTrigger = ["배고파", "굶어뒤지것다"];
module.exports = {
  functionMatch: {
    // "배고파": initRestaurantConv,
    // "배고파뒤질듯" : initRestaurantConv,
    initRestaurantConvTrigger : initRestaurantConv,
    "initRestaurantRecommendation" : initRestaurantRecommendation,
  }
}
