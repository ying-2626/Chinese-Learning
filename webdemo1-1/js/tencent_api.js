(function () {
  let btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"

  const btnControl = document.getElementById("btn_control");


  const recorder = new RecorderManager("dist");
  recorder.onStart = () => {
    console.log("onStart");
    changeBtnStatus("OPEN");
  }

  let iseWS;

  function getWebSocketUrl() {
    const APPID = "1347318735";
    //TODO：这里填入
    const SECRET_ID = "AKIDHPM6g3JNE1ax61jDTWO3XZO0Riz2rTr2"
    const SECRET_KEY = "1oPs79h292hARUJwMYYjogT3a8cxGPL3"

    const SERVER_ENGINE_TYPE = "16k_zh"; // 中文标准版
    const VOICE_ID = crypto.randomUUID(); // 生成唯一音频流标识
    const REF_TEXT = document.getElementById("evalText")?.innerText || "你好";
    const TIMESTAMP = Math.floor(Date.now() / 1000);
    const NONCE = Math.floor(Math.random() * 1000000000);
    const EXPIRED = TIMESTAMP + 86400; // 1 天有效期
    const selectedMode = document.querySelector('input[type="radio"][name="group"]:checked').nextSibling.textContent.trim();
    console.log("mode is: ", selectedMode);
    let EVAL_MODE = 0
    if (selectedMode === "读句子") {
      EVAL_MODE = 1
    } else if (selectedMode === "读单词") {
      EVAL_MODE = 0
    } else if (selectedMode === "读段落") {
      EVAL_MODE = 2
    }


    const SCORE_COEFF = 1.0; // 评分严格度

    const params = `eval_mode=${EVAL_MODE}&expired=${EXPIRED}&nonce=${NONCE}&ref_text=${REF_TEXT}&score_coeff=${SCORE_COEFF}&secretid=${SECRET_ID}&server_engine_type=${SERVER_ENGINE_TYPE}&text_mode=0&timestamp=${TIMESTAMP}&voice_format=1&voice_id=${VOICE_ID}`;

    const SIGNATURE_STRING = `soe.cloud.tencent.com/soe/api/${APPID}?${params}`;
    const SIGNATURE = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(SIGNATURE_STRING, SECRET_KEY));
    const ENCODED_SIGNATURE = encodeURIComponent(SIGNATURE);

    return `wss://soe.cloud.tencent.com/soe/api/${APPID}?${params}&signature=${ENCODED_SIGNATURE}`;
  }



  //通常用于将二进制数据（如音频或视频数据）转换为可以在网络上传输的字符串。  
  function toBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function changeBtnStatus(status) {
    btnStatus = status;
    if (status === "CONNECTING") {
      btnControl.innerText = "建立连接中";
    } else if (status === "OPEN") {
      btnControl.innerText = "录音中...";
    } else if (status === "CLOSING") {
      btnControl.innerText = "关闭连接中";
    } else if (status === "CLOSED") {
      btnControl.innerText = "开始录音";
    }
  }

  function connectWebSocket() {
    const websocketUrl = getWebSocketUrl();
    if ("WebSocket" in window) {
      iseWS = new WebSocket(websocketUrl);
    } else {
      alert("浏览器不支持WebSocket");
      return;
    }
    changeBtnStatus("CONNECTING");
    iseWS.onopen = () => {
      recorder.start({ sampleRate: 16000, frameSize: 1280 });
    };

    iseWS.onmessage = (e) => {
      console.log("收到消息:", JSON.parse(e.data));
      renderResult(e.data);

      if (JSON.parse(e.data).final === 1) {
        iseWS.close();
      }
    };

    iseWS.onerror = (e) => {
      console.error(e);
      recorder.stop();
      changeBtnStatus("CLOSED");
    };
    iseWS.onclose = () => {
      recorder.stop();
      changeBtnStatus("CLOSED");
    };
  }

  //调用fastgpt分析朗读结果
let Authorization = 'Bearer fastgpt-zqwHxu6FNdgPMOHiSngQkwZmITk9CDHpiPPQknc70ZNOxdIsFKZZvQEc3BkO71P'
  //generate 分析
  function getAnalysis(req_content) {

    const prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括一句里每个字的音素和音素得分：({
          Word: item.Word,
          // 遍历 PhoneInfos 并提取 Phone 和 PronAccuracy
          PhoneInfos: item.PhoneInfos.map(phoneItem => ({
            Phone: phoneItem.Phone,
            PronAccuracy: phoneItem.PronAccuracy
          })
          然后对这位汉语学习者给出练习建议。
          注意：
          1. 分析和建议各控制在300字以内
          2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以“你”来称呼对方
          3. 如果没有音素得分有可能是因为漏读了
          4. 避免列举具体数字
          5. 开头直接分析就行，不需要引入语
    `      
    
    axios({
      url: 'https://api.fastgpt.in/api/v1/chat/completions',
      method: 'post',
      data: JSON.stringify({
        "chatId": "111", // localStorage.getItem("username"),
        "stream": false,
        "detail": false,
        "messages": [
          {
            "content": req_content + prompt, //TODO
            "role": "user"
          }
        ]
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Authorization
      }
    }).then(function (response) {
      // 获取 AI 返回的内容
      let content = response.data.choices[0].message.content;
    
      // 选中 textarea
      let suggestionBox = document.querySelector(".suggestion-box");
    
      if (suggestionBox) {
        suggestionBox.value = content; // 设置返回内容
      } else {
        console.error("未找到 .suggestion-box 元素");
      }
    });
  }
  // 测评结果显示***********************************************************************************************
  function renderResult(resultData) {
    // 识别结束
    // console.log("resultData", resultData);
    let jsonData = JSON.parse(resultData);
    // console.log("jsonData", jsonData);
    if (jsonData.result != null) {

      document.getElementById("accuracy_score").innerText =
        jsonData.result.PronAccuracy;
      document.getElementById("fluency_score").innerText =
        jsonData.result.PronFluency * 100;
      document.getElementById("integrity_score").innerText =
        jsonData.result.PronCompletion * 100;
      document.getElementById("total_score").innerText =
        jsonData.result.SuggestedScore;


      //单字PronAccuracy低于60标红，60-80标黄
      const evalText = document.getElementById("evalText");
      let coloredText = "";
      for (let i = 0; i < jsonData.result.Words.length; i++) {
        let word = jsonData.result.Words[i].Word
        let word_accuracy = jsonData.result.Words[i].PronAccuracy
        let randomColor = `rgb(0, 0, 0)`;
        if (word != "*") {
          if (word_accuracy < 60) {
            randomColor = `rgb(255, 0, 0)`;
          } else if (word_accuracy >= 60 && word_accuracy < 80) {
            randomColor = `rgb(255, 165, 0)`;
          }
          coloredText += `<span style="color: ${randomColor}">${word}</span>`;
        }
      }

        // 遍历words并提取每个字的信息
        const analysisData = jsonData.result.Words.map(item => ({
          Word: item.Word,
          // 遍历 PhoneInfos 并提取 Phone 和 PronAccuracy
          PhoneInfos: item.PhoneInfos.map(phoneItem => ({
            Phone: phoneItem.Phone,
            PronAccuracy: phoneItem.PronAccuracy
          }))
        }));
        const jsonString = JSON.stringify(analysisData, null, 2); // 2 表示格式化缩进
        getAnalysis(jsonString);
        
        evalText.innerHTML = coloredText; // 直接修改 HTML


        evalText.addEventListener("input", function (event) {
          // 获取当前文本（去除 HTML 结构）
          let plainText = evalText.innerText;

          // 重新渲染为黑色（确保所有字符都是黑色）
          evalText.innerHTML = `<span style="color: black;">${plainText}</span>`;

          // 设置光标位置到文本末尾
          setCursorToEnd(evalText);
        });

        // 光标移动到文本末尾（避免光标跳动）
        function setCursorToEnd(el) {
          let range = document.createRange();
          let selection = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // let text = evalText.innerText;
        // let coloredText = "";

        // text.split("").forEach((char, index) => {
        //     let randomColor = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
        //     coloredText += `<span style="color: ${randomColor}">${char}</span>`;
        // });

        // evalText.innerHTML = coloredText; // 直接修改 HTML


        // evalText.addEventListener("input", applyColors);
        // document.getElementById("evalText").innerText =
      
    }
  }


  recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
    if (iseWS.readyState === iseWS.OPEN) {
      iseWS.send(frameBuffer);
      if (isLastFrame) {
        iseWS.send(JSON.stringify({ type: "end" }));
        changeBtnStatus("CLOSING");
      }
    }
  };
  recorder.onStop = (audioBuffers) => {
  };

  btnControl.onclick = function () {
    if (btnStatus === "UNDEFINED" || btnStatus === "CLOSED") {
      console.log("开始录音");
      connectWebSocket();
    } else if (btnStatus === "CONNECTING" || btnStatus === "OPEN") {
      console.log("停止录音");
      recorder.stop();
    }
  };
})();
