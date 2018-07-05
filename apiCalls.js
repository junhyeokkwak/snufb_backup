var request = require("request");
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN

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
             // "template_type": "media",
             "url":image_url
             // "elements": [
             //    {
             //       "media_type": "video",
             //       "url": "https://www.facebook.com/afreecaTV.korea/videos/1742057972505275/"
             //    }
             // ]
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
            "elements":[{
              "buttons": [
                {
                  "title":title,
                  "type":"web_url",
                  "url":url,
                  "webview_height_ratio": size,
                  "messenger_extensions" : true,
                },
              ],
              "image_url" : 'https://scontent-icn1-1.xx.fbcdn.net/v/t1.0-9/34644235_2070034323285218_6642764812776374272_n.jpg?_nc_cat=0&oh=e28acdba08325a59a83582152e071b54&oe=5BC084EE',
              //"image_url": 'http://mblogthumb3.phinf.naver.net/20150828_254/pcrht_14407698481174iaCv_PNG/Screenshot_2015-08-28-18-03-41_edit.png?type=w2',
              //"item_url": url,
              //"webview_height_ratio": size,
              //"subtitle":"let's go!",
              "title":"밑의 주소로 들어가서 등록해줘!"
            }],
            "template_type":"generic"
          },
          "type":"template"
        }
      }
    };
    callSendAPI(messageData);
}

function handleMediaTemplate(event) {
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
                   "media_type": "video",
                   "url": "https://www.facebook.com/afreecaTV.korea/videos/1742057972505275/"
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
      // console.error("callSendAPI RESPONSE: " + response);
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
