// commonly used quick replies
var YesOrNo = [{
  "content_type": "text",
  "title": "응",
  "payload": "응"
}, {
  "content_type": "text",
  "title": "아니",
  "payload": "아니"
}]

var Menu = [{
  "content_type": "text",
  "title": "선배한테 조언",
  "payload": "멘토"
},{
  "content_type": "text",
  "title": "좋은 사람 소개시켜줘",
  "payload": "소개팅"
},{
  "content_type": "text",
  "title": "미팅 잡아줘",
  "payload": "미팅"
},{
  "content_type": "text",
  "title": "기타",
  "payload": "기타"
}]

var Mentor_type = [{
  "content_type": "text",
  "title": "과 고학번 선배",
  "payload": "과선배"
},{
  "content_type": "text",
  "title": "취업 선배",
  "payload": "취업선배"
},{
  "content_type": "text",
  "title": "다른 선배",
  "payload": "query_demand1"
}]

module.exports = {
  reply_arrays: {
    "YesOrNo": YesOrNo,
    "Menu" : Menu,
    "Mentor_type": Mentor_type
  }
}
