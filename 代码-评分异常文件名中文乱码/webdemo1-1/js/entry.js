var wrap = document.getElementById('wrap');
var ul = wrap.getElementsByTagName('ul')[0];
var lis = ul.children;
var w_lefter = lis[0].offsetWidth;
var lis_len = lis.length;//7
var lefter = 0; //ul的left值
for (var i = 0; i < lis_len; i++) {
    ul.appendChild(lis[i].cloneNode(true));
}
for (var i = 0; i < lis_len; i++) {
    ul.appendChild(lis[i].cloneNode(true));
}
//复制2*7张图片并追加到最后,此时lis.length为21,而lis_len仍为7
ul.timer = setInterval(nextAnimate, 18);
function nextAnimate() { //动画函数
    lefter--;
    if (lefter === -lis_len * w_lefter) {
        lefter = 0;
    }
    ul.style.left = lefter + "px";
    //console.log('调用一次动画函数');
}
/*这里主要是，在图片的最后一张已经移到最左边，也就是lefter=-1050的时候，
其实在这20ms，他还会接着闪现右面的图片,所以右边我们要加很多照片,足以挡住整个轮播界面,看不到空白
20ms之后,lefter归0,又从头开始播放就是这样*/
wrap.addEventListener('mouseover', function () {
    clearInterval(ul.timer);
})
wrap.addEventListener('mouseout', function () {
    ul.timer = setInterval(nextAnimate, 18);
})
/*设置时间监听器，鼠标移入移出事件，停止播放和开始播放*/
