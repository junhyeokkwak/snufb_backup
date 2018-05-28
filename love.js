var api = require("./apiCalls")
var mysql = require('mysql');
var async = require('async');
var connection = mysql.createConnection(process.env.DATABASE_URL);

function n_to_n(event){
  var messageData =  {"text": "너희 과에 미팅 들어온게 있네.. 같이 나갈 친구들이랑 단톡 만들어서 나 초대해주면 주선해줄게!"};
  api.sendResponse(event, messageData);
};

function one_to_one(event){
  task = [
    function(callback){
      connection.query('INSERT INTO Sogaeting (user_id, sex, school, college_major) VALUES ("' + event.message.text + '")');
      callback(null, )
    },
    function(null, callback){
      var messageData =  {"text": "소개팅?"};

    }
  ];
  async.waterfall(task);
  api.sendResponse(event, messageData);
};

function fallback(event){
  api.sendResponse(event, {"text": "에비앙"});
}

module.exports = {
  functionMatch: {
    "미팅 잡아줘": n_to_n,
    "좋은 사람 소개시켜줘": one_to_one,
    "fallback": fallback
  }
}
