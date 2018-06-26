
// var mapOptions = {
//     center: new naver.maps.LatLng(37.5597025524, 126.9351196694),
//     zoom: 10
// };
// var map = new naver.maps.Map('map', mapOptions);

// var position1 = new naver.maps.LatLng(37.5540291075, xpos);
// var position2 = new naver.maps.LatLng(37.5540511998, 126.9356825619);
// var marker2 = new naver.maps.Marker({
//     position: position2,
//     map: map
// });
alert("sex");

document.querySelector('.ajaxsend').addEventListener('click', function(){
// 입력값 위치를 찾아 변수에 담고
var inputdata = document.forms[0].elements[0].value;
// sendAjax 함수를 만들고 URL과 data를 전달
sendAjax('https://cb-practice.herokuapp.com/busRoute/send_result', inputdata)
})

function sendAjax(url, data){
  // 입력값을 변수에 담고 문자열 형태로 변환
  var data = {'email' : data};
  data = JSON.stringify(data);
  // content-type을 설정하고 데이터 송신
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-type', "application/json");
  xhr.send(data);
  // 데이터 수신이 완료되면 표시
  xhr.addEventListener('load', function(){
    console.log(xhr.responseText);
  });
}
