var request = require("request");
var app = require("./app");
var imagesURL = "./images-yonsei";
var images = require(imagesURL);
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

//보내기 (res.send와 동일)
function sendResponse(event, messageToSend) {
  var senderID = event.sender.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var messageData = {
    recipient: {
      id: senderID
    },
    message: messageToSend
  };
  callSendAPI(messageData);
}

function typingBubble(event) {
  var senderID = event.sender.id;
  var messageData = {
    recipient: {
      id: senderID
    },
    sender_action: "typing_on"
  };
  callSendAPI(messageData);
}

function sendMessage(recipientID, messageToSend) {
  var messageData = {
    messaging_type : "UPDATE",
    recipient: {
      id: recipientID
    },
    message: messageToSend
  };
  callSendAPI(messageData);
}

function sendOnlineImage(event, image_url) {
  console.log("SEND ONLINE IMAGE");
  console.log(image_url)
  var senderID = event.sender.id;
    let messageData;
    messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment": {
          "type": "image",
          "payload": {
             "url":image_url
          }
        }
      }
    };
    callSendAPI(messageData);
}

var handlePostback = function handlePostback(event) {
    console.log('GET_SOME_PAYLOAD');
    var senderID = event.sender.id;
    var received_postback = event.postback;
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log('GET_SOME_PAYLOAD: ' + payload);
    if (payload === 'GET_STARTED_PAYLOAD') {
        console.log('GET_STARTED_PAYLOAD');
    } else if (payload === '등록') {
        //response = { "text": "Thanks!HoombaHoomba!" }
        var url = "http://www.example.com";
        var title = "register";
        handleWebview(event, title, url);
    }

    if (response != null){
      sendMessage(sender_psid, response);
    }
}


function handleRestaurantWebview(event, titleMessage, url, image_url, buttonMessage) {
  var senderID = event.sender.id;
    let messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment":{
          "payload":{
            "elements":[{
              "buttons": [
                {
                  "title": buttonMessage,
                  "type":"web_url",
                  "url":url,
                  "webview_height_ratio":"tall"
                },
              ],
              "image_url": image_url,
              "item_url": url,
              //"subtitle":"SUTBTITILE",
              "title": titleMessage,
            }],
            "template_type":"generic"
          },
          "type":"template"
        }
      }
    };
    callSendAPI(messageData);
}

function handleWebview(event, title, url, size) {
  var senderID = event.sender.id;
    let messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment":{
          "payload":{
            "elements":[
              {
                "buttons": [
                  {
                    "title":title,
                    "type":"web_url",
                    "url":url,
                    "webview_height_ratio": size,
                    "messenger_extensions" : true,
                  },
                ],
                "image_url" : images.helloPhoto_URL,
                "title":title
              }
            ],
            "template_type":"generic"
          },
          "type":"template"
        }
      }
    };
    callSendAPI(messageData);
}

function handleButton(event, title, url) {
  var senderID = event.sender.id;
    let messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text": title,
            "buttons":[
              {
                "type":"web_url",
                "url": url,
                "title": "메세지 보내기"
              }
            ]
          }
        }
      }
    };
    callSendAPI(messageData);
}

function handleBugButton(event, title, url) {
  var senderID = event.sender.id;
    let messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text": title,
            "buttons":[
              {
                "type":"web_url",
                "url": url,
                "title": "버그 제보하러 가기"
              }
            ]
          }
        }
      }
    };
    callSendAPI(messageData);
}

function handlePersonSearchWebview(event, title, url, target_uid, target_first_name, target_last_name, target_profile_pic) {
  var senderID = event.sender.id;
  var target_full_name;
  if (target_first_name.length > 2) {
    target_full_name = target_first_name + " " + target_last_name;
  } else {
    target_full_name = target_last_name + target_first_name;
  }

    let messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment":{
          "payload":{
            "elements":[{
              "buttons": [
                {
                  "title":title,
                  "type":"web_url",
                  "url":url,
                  "webview_height_ratio": "compact",
                  "messenger_extensions" : true,
                },
              ],
              "image_url" : target_profile_pic,
              //"image_url": 'http://mblogthumb3.phinf.naver.net/20150828_254/pcrht_14407698481174iaCv_PNG/Screenshot_2015-08-28-18-03-41_edit.png?type=w2',
              //"item_url": url,
              //"webview_height_ratio": size,
              //"subtitle":"let's go!",
              "title": target_full_name
            }],
            "template_type":"generic"
          },
          "type":"template"
        }
      }
    };
    callSendAPI(messageData);
}

function handleMediaTemplate(event, type, url) {
  var senderID = event.sender.id;
    let messageData;
    messageData = {
      recipient: {
        id: senderID
      },
      message: {
        "attachment": {
          "type": "template",
          "payload": {
             "template_type": "media",
             "elements": [
                {
                   "media_type": type,
                   "url": url,
                }
             ]
          }
        }
      }
    };
    console.log("HANDLEMEDIATEMPLATE");
    // Sends the response message
    callSendAPI(messageData);
}

// 메시지 보내기
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
    } else {
      console.error("Unable to send message.");
      console.error("callSendAPI RESPONSE: " + JSON.stringify(response));
      console.error("callSendAPI ERR: " + error);
    }
  });
}




module.exports.handleRestaurantWebview = handleRestaurantWebview;
module.exports.handlePostback = handlePostback;
module.exports.sendResponse = sendResponse;
module.exports.handleWebview = handleWebview;
module.exports.sendMessage = sendMessage;
module.exports.sendOnlineImage = sendOnlineImage;

module.exports.callSendAPI = callSendAPI;

module.exports.handlePersonSearchWebview = handlePersonSearchWebview;
module.exports.handleButton = handleButton;
module.exports.typingBubble = typingBubble;
module.exports.handleBugButton = handleBugButton;
module.exports.handleMediaTemplate = handleMediaTemplate;
