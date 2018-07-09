var url = "<a href=\"https://maps.google.com/maps/contrib/108555596243936676377/photos\">조윤태</a>";
var i1 = url.lastIndexOf("contrib/");
var i2 = url.indexOf("/photos");

console.log(i1 + "/" + i2);
url = url.substring(i1, i2);

console.log(url);
console.log(``);
