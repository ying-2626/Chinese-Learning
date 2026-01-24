/* 后端发起请求，检查是否完成EntryTest */
let token = localStorage.getItem('token');
//alert(JSON.parse(token).message);
// axios({
//   url: 'https://47.117.92.199:8080/EntryTest',
//   method: 'post',
//   headers: {
//     'Content-Type': 'application/json',
//     'token': JSON.parse(token).message
//   }
// }).then(function (response) {
//   console.log("是否运行到这", response);
//   if (response.data.code != 200) {
//     alert(response.data.message);
//     window.location.href = 'EntryTest.html';
//   } else {
//     alert(response.data.message);
//   }
// })  
/* 后端发起请求，获取用户名*/

// axios({
//   url: 'https://47.117.92.199:8080/GetUsername',
//   method: 'post',
//   headers: {
//     'Content-Type': 'application/json',
//     'token': JSON.parse(token).message
//   }
// }).then(function (response) {
//   console.log(response);
//   if (response.data.code == 200) {
//     localStorage.setItem('username', response.data.message);
//   } else {
//     alert(response.data.message);
//   }
// })  

let Authorization = CONFIG.FASTGPT.API_KEY
let textarea1 = document.querySelector(".chat-input");
//let textarea2 = document.querySelector(".voice-input");
let img1 = document.querySelector(".input-container img");
//let img2 = document.querySelector(".voice-container img");
/*设置监听器，当输入框中有内容时，纸飞机变为彩色，否则为灰色*/
/*textarea1--*/
textarea1.addEventListener("input", function () {
  if (textarea1.value.length > 0) {
    img1.src = "img/纸飞机（彩色版）.png"
  } else {
    img1.src = "img/纸飞机（灰色版）.png"
  }
});
/*textarea2.addEventListener('input', function () {
  if (textarea2.value.length > 0) {
    img2.src = "img/纸飞机（彩色版）.png"
  } else {
    img2.src = "img/纸飞机（灰色版）.png"
  }
});*/

/*设置监听器，当点击纸飞机时/回车，将输入框中的内容发送给后端，并将返回的内容显示在聊天框中*/
function isAllWhitespace(text) {
  return /^\s*$/.test(text);
}

function getReturn(req_content) {
  // 插入“思考中……”提示
  let voiceItem = document.querySelectorAll(".voice-item")[0];
  let thinkingId = "thinking-message-voice";
  // 移除已有的“思考中……”提示，避免重复
  let oldThinking = voiceItem.querySelector(`#${thinkingId}`);
  if (oldThinking) oldThinking.remove();
  let thinkingHTML = `
    <div class="message ai-message" id="${thinkingId}">
      <div class="p1">思考中……</div>
    </div>`;
  voiceItem.insertAdjacentHTML('beforeEnd', thinkingHTML);

  axios({
    url: 'https://api.fastgpt.in/api/v1/chat/completions',
    method: 'post',
    data: JSON.stringify({
      "chatId": "111",//localStorage.getItem("username"),
      "stream": false,
      "detail": false,
      "messages": [
        {
          "content": req_content,
          "role": "user"
        }
      ]
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Authorization
    }
  }).then(function (response) {
    let content = response.data.choices[0].message.content;
    let newHTML = '\
  <div class="message ai-message" id="start-message">\
  <div class="p1">' + marked.parse(content) + '</div>\
  </div>';
    // 替换“思考中……”提示为真正回答
    let thinkingMsg = voiceItem.querySelector(`#${thinkingId}`);
    if (thinkingMsg) {
      thinkingMsg.outerHTML = newHTML;
    } else {
      voiceItem.insertAdjacentHTML('beforeEnd', newHTML);
    }
  })
}

function getReturn1(req_content) {
  // 插入“思考中……”提示
  let chatItem = document.querySelectorAll(".chat-item")[0];
  let thinkingId = "thinking-message-chat";
  // 移除已有的“思考中……”提示，避免重复
  let oldThinking = chatItem.querySelector(`#${thinkingId}`);
  if (oldThinking) oldThinking.remove();
  let thinkingHTML = `
    <div class="message ai-message" id="${thinkingId}">
      <div class="p1">思考中……</div>
    </div>`;
  chatItem.insertAdjacentHTML('beforeEnd', thinkingHTML);

  axios({
    url: 'https://api.fastgpt.in/api/v1/chat/completions',
    method: 'post',
    data: JSON.stringify({
      "chatId": "111",//localStorage.getItem("username"),
      "stream": false,
      "detail": false,
      "messages": [
        {
          "content": req_content,
          "role": "user"
        }
      ]
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Authorization
    }
  }).then(function (response) {
    let content = response.data.choices[0].message.content;
    let newHTML = '\
  <div class="message ai-message" id="start-message">\
  <div class="p1">' + marked.parse(content) + '</div>\
  </div>';
    // 替换“思考中……”提示为真正回答
    let thinkingMsg = chatItem.querySelector(`#${thinkingId}`);
    if (thinkingMsg) {
      thinkingMsg.outerHTML = newHTML;
    } else {
      chatItem.insertAdjacentHTML('beforeEnd', newHTML);
    }
  })
}

//ai输入框效果
textarea1.addEventListener("keydown", function (e) {
  if (e.key === 'Enter') {
    if (isAllWhitespace(textarea1.value)) {
      // console.log("请先输入内容");
      e.preventDefault();
      return
    } else {
      // console.log(textarea.value);
      e.preventDefault();
      img1.src = "img/纸飞机（灰色版）.png"
      let newHTML = '\
                  <div class="message user-message" id="start-message">\
                  <div class="p1">' + textarea1.value + '</div>\
              </div>'
      let innnn = document.querySelectorAll(".chat-item")
      innnn[0].insertAdjacentHTML('beforeEnd', newHTML)
      getReturn1(textarea1.value)
      textarea1.value = ''
    }

  }
})
/*textarea2.addEventListener("keydown", function (e) {
  if (e.key === 'Enter') {
    if (isAllWhitespace(textarea2.value)) {
      // console.log("请先输入内容");
      e.preventDefault();
      return
    } else {
      // console.log(textarea.value);
      e.preventDefault();
      img2.src = "img/纸飞机（灰色版）.png"
      let newHTML = '\
                  <div class="message user-message" id="start-message">\
                  <div class="p1">' + textarea2.value + '</div>\
              </div>'
      let innnn = document.querySelectorAll(".voice-item")
      innnn[0].insertAdjacentHTML('beforeEnd', newHTML)
      getReturn(textarea2.value);
      textarea2.value = ''
    }

  }
})*/
img1.addEventListener("click", function () {
  if (isAllWhitespace(textarea1.value)) {
    // console.log("请先输入内容");
    return
  } else {
    // console.log(textarea.value);
    img1.src = "img/纸飞机（灰色版）.png"
    let newHTML = '\
                <div class="message user-message" id="start-message">\
                <div class="p1">' + textarea1.value + '</div>\
            </div>'
    let innnn = document.querySelectorAll(".chat-item")
    innnn[0].insertAdjacentHTML('beforeEnd', newHTML)
    //getReturn(textarea1.value);
    getReturn1(textarea1.value)
    textarea1.value = ''

  }
})
/*img2.addEventListener("click", function () {
  if (isAllWhitespace(textarea2.value)) {
    // console.log("请先输入内容");
    return
  } else {
    // console.log(textarea.value);
    img2.src = "img/纸飞机（灰色版）.png"
    let newHTML = '\
                <div class="message user-message" id="start-message">\
                <div class="p1">' + textarea2.value + '</div>\
            </div>'
    let innnn = document.querySelectorAll(".voice-item")
    innnn[0].insertAdjacentHTML('beforeEnd', newHTML)
    getReturn(textarea2.value)
    textarea2.value = ''
  }
})*/
img1.addEventListener("mouseover", function () {
  if (isAllWhitespace(textarea1.value)) {
    let please = document.querySelectorAll(".pleaseinput")[1]
    please.style.display = "block"
  }
})
/*img2.addEventListener("mouseover", function () {
  if (isAllWhitespace(textarea2.value)) {
    let please = document.querySelectorAll(".pleaseinput")[0]
    please.style.display = "block"
  }
})*/
img1.addEventListener("mouseout", function () {
  let please = document.querySelectorAll(".pleaseinput")[1]
  please.style.display = "none"
})
/*img2.addEventListener("mouseout", function () {
  let please = document.querySelectorAll(".pleaseinput")[0]
  please.style.display = "none"
})*/

//点击侧边栏选项功能实现
document.addEventListener('DOMContentLoaded', function () {
  // 获取所有 侧边栏类的元素
  var toggleItems = document.querySelectorAll('.side-footer');
  //console.log("yshi log: ",toggleItems)

  // 点击保持active，其他都不active
  toggleItems.forEach(function (item) {
    item.addEventListener('click', function () {
      // 移除所有元素的 active 类
      toggleItems.forEach(function (otherItem) {
        otherItem.classList.remove('active');
      });
      // 给被点击的元素添加 active 类
      this.classList.add('active');
    });
  });
  //获取所有对应module的元素
  var moduleItems = document.querySelectorAll('.module');
  var sidelogos = document.querySelectorAll('.sidelogo');
  let img_fff = ["img/speech_evaluation(fff).png", "img/voice(fff).png", "img/chat(fff).png", "img/magictool(fff).png", "img/history(fff).png", "img/love(fff).png", "img/share(fff).png", "img/use(fff).png"]
  let img_color = ["img/speech_evaluation(color).png", "img/voice(color).png", "img/chat(color).png", "img/magictool(color).png", "img/history(color).png", "img/love(color).png", "img/share(color).png", "img/use(color).png"]
  //点击module元素，显示对应的module内容
  toggleItems.forEach(function (item, index) {
    item.addEventListener('click', function () {
      if (index <= 5) {
        // 移除所有元素的module类
        moduleItems.forEach(function (module) {
          module.style.display = 'none';
        });
        //console.log(moduleItems)
        //console.log(index)

        //修改前面的tupian
        sidelogos.forEach(function (logo, index) {
          logo.src = img_color[index]
        });
        // 显示对应的模块
        var correspondingModule = moduleItems[index];
        //console.log(correspondingModule)
        correspondingModule.style.display = 'block';
        sidelogos[index].src = img_fff[index]
        //console.log(sidelogos[index])
        //console.log(img_fff[index]) 
      }
      //修改前面的tupian
      sidelogos.forEach(function (logo, index) {
        logo.src = img_color[index]
      });
      // 显示对应的模块
      var correspondingModule = moduleItems[index];
      // console.log(index)
      // console.log(correspondingModule)

      sidelogos[index].src = img_fff[index]
      // console.log(sidelogos[index])
      // console.log(img_fff[index])           
    });
    //显示对应的图片
  });

});

let bus = document.querySelectorAll(".toolchoice2 button")
console.log("yshi log: ", bus)
bus.forEach(function (bu) {
  bu.addEventListener('click', function (e) {
    bus.forEach(function (bu) {
      bu.classList.remove('active');
    });
    bu.classList.add('active');
    let toolname = bu.textContent;
    let tools = document.querySelectorAll(".tools")
    if (toolname.includes("All")) {
      //console.log(toolname)
      tools.forEach(function (tool) {
        tool.style.display = 'inline-block';
      });
    } else {
      tools.forEach(function (tool) {
        if (tool.classList.contains(toolname.split(" ")[0])) {
          tool.style.display = 'inline-block';
        } else {
          tool.style.display = 'none';
        }
      })
    }
  })
})


let startBtn = document.querySelector('.start-btn');
let stopBtn = document.querySelector('.stop-btn');

var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();
recognition.lang = 'zh-CN';
recognition.interimResults = true;
recognition.continuous = true;

startBtn.onclick = function () {
  recognition.start();
}

stopBtn.onclick = function () {
  recognition.stop();
  img2.src = "img/纸飞机（彩色版）.png"
  textarea2.value = result;
}

let result;
recognition.onresult = function (event) {
  result = event.results[0][0].transcript;
}


// script.js
document.addEventListener('DOMContentLoaded', function () {
  const select = document.getElementById('translateSelectLanguage');

  select.addEventListener('mouseover', function (event) {
    if (event.target.tagName === 'OPTION') {
      event.target.classList.add('option-hover');
    }
  });

  select.addEventListener('mouseout', function (event) {
    if (event.target.tagName === 'OPTION') {
      event.target.classList.remove('option-hover');
    }
  });
});

let toolbuttons = document.querySelectorAll(".tools")
let tooldisplay = document.querySelector(".tool-display")
toolbuttons.forEach(function (bu) {
  if (!bu.textContent.includes("Typing")) {
    bu.addEventListener('click', function (e) {
      tooldisplay.style.display = 'block';
      var moduleItems = document.querySelectorAll('.module');
      moduleItems.forEach(function (module) {
        module.style.display = 'none';
      });
    })
  }
})

var moduleItems = document.querySelectorAll('.module');
function closeToolDisplay() {
  tooldisplay.style.display = 'none';
  moduleItems[2].style.display = 'none';
  moduleItems[3].style.display = 'block';
}
function getReturn2(req_content) {
  axios({
    url: 'https://api.fastgpt.in/api/v1/chat/completions',
    method: 'post',
    data: JSON.stringify({
      "chatId": "111",//localStorage.getItem("username"),
      "stream": false,
      "detail": false,
      "messages": [
        {
          "content": "请写出一篇文章是关于" + req_content,//TODO
          "role": "user"
        },
      ]
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Authorization
    }
  }).then(function (response) {
    let content = response.data.choices[0].message.content;
    let chatItem = document.querySelectorAll(".chat-item")[0];
    // 找到“回答生成中”气泡
    let loadingMsg = chatItem.querySelector('.loading-message');
    let answerHTML = '\
      <div class="message ai-message" id="start-message">\
      <div class="p1">' + marked.parse(content) + '</div>\
      </div>';
    if (loadingMsg) {
      loadingMsg.outerHTML = answerHTML;
    } else {
      chatItem.insertAdjacentHTML('beforeEnd', answerHTML);
    }
  })
}
function generate() {
  tooldisplay.style.display = 'none';
  moduleItems[2].style.display = 'none';
  moduleItems[3].style.display = 'block';
  content = document.querySelector('.content111')
  console.log(content.value)
  let newHTML = '\
    <div class="message user-message" id="start-message">\
    <div class="p1">' + content.value + '</div>\
  </div>'
  let innnn = document.querySelectorAll(".chat-item")
  innnn[0].insertAdjacentHTML('beforeEnd', newHTML)
  // 插入“回答生成中”气泡
  let loadingHTML = '\
    <div class="message ai-message loading-message">\
      <div class="p1">回答生成中……请稍后</div>\
    </div>';
  innnn[0].insertAdjacentHTML('beforeEnd', loadingHTML)
  getReturn2(content.value)
  content.value = ''
  moduleItems[2].style.display = 'block';
  moduleItems[3].style.display = 'none';
}

