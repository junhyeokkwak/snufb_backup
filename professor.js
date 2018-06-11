var request = require("request");
var https = require('https');
var qr = require('./quick_replies');
var api = require('./apiCalls');
var util = require('./utilfunctions');
var async = require('async');
var mysql = require("mysql");

var connection = mysql.createConnection(process.env.DATABASE_URL);

function profSearch(event) {
  console.log('START PROFESSOR SEARCH');
  

}



module.exports = {
  functionMatch: {
    "교수님 검색": profSearch,

  }
};
