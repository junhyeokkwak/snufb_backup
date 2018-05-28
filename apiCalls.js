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

function sendMessage(event, messageToSend) {
  var senderID = event.sender.id;
  var messageData = {
    messaging_type : "UPDATE",
    recipient: {
      id: senderID
    },
    message: messageToSend
  };
  callSendAPI(messageData);
}

function handleWebview(event, title, url) {
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
                  "webview_height_ratio":"compact"
                },
              ],
              "image_url": "http://www.example.com/image.png",
              "item_url": "http://www.example.com",
              "subtitle":"let's go!",
              "title":"Some URL"
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
      console.error(response);
      console.error(error);
    }
  });
}

module.exports.sendResponse = sendResponse;
module.exports.handleWebview = handleWebview;
module.exports.sendMessage = sendMessage;
