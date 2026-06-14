(function () {
  let btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"

  const btnControl = document.getElementById("btn_control");


  const recorder = new RecorderManager("dist");
  recorder.onStart = () => {
    console.log("onStart");
    changeBtnStatus("OPEN");
  }

  let iseWS;

  /**
   * 从后端获取签名后的 WebSocket URL
   * 避免在前端暴露腾讯云密钥
   */
  async function getWebSocketUrlFromBackend() {
    const selectedMode = document.querySelector('input[type="radio"][name="group"]:checked').nextSibling.textContent.trim();
    console.log("mode is: ", selectedMode);
    
    let evalMode = 0;
    if (selectedMode === "读句子") {
      evalMode = 1;
    } else if (selectedMode === "读单词") {
      evalMode = 0;
    } else if (selectedMode === "读段落") {
      evalMode = 2;
    }

    const refText = document.getElementById("evalText")?.innerText || "你好";

    try {
      const response = await fetch(`${CONFIG.BACKEND_API}/api/tencent/soe/websocket-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refText: refText,
          evalMode: evalMode,
          scoreCoeff: 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || '获取连接失败');
      }

      return result.result;
    } catch (error) {
      console.error("获取 WebSocket URL 失败:", error);
      alert("连接服务失败，请稍后重试");
      throw error;
    }
  }

  // 旧方法：直接在前端生成 URL（已弃用，密钥已泄露）
  // function getWebSocketUrl() {
  //   const { APPID, SECRET_ID, SECRET_KEY } = CONFIG.TENCENT;
  //   ...
  // }



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

  async function connectWebSocket() {
    try {
      const websocketUrl = await getWebSocketUrlFromBackend();
      
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
    } catch (error) {
      console.error("连接失败:", error);
      changeBtnStatus("CLOSED");
    }
  }

  //调用fastgpt分析朗读结果 - 应该通过后端代理
  // TODO: 将 FastGPT 调用迁移到后端，避免暴露 API Key
  let Authorization = CONFIG.FASTGPT.API_KEY;
  
  //generate 分析
  function getAnalysis(req_content) {

    const prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括一句里每个字的音素和音素得分：({
          Word: item.Word,
          // 遍历 PhoneInfos 并提取 Phone 和 PronAccuracy
          PhoneInfos: item.PhoneInfos.map(phoneItem => ({
            Phone: phoneItem.Phone,
            PronAccuracy: phoneItem.PronAccuracy
          })
          // 遍历Tone,若Valid=false,则无效；若Valid=Ture,提取RefTone和HypothesisTone进行比对。如果比对结果是不相等，则说明该字的韵母声调错误，一定要明确指出该字的声调错误。
          然后对这位汉语学习者给出练习建议。
          注意：
          1. 分析和建议各控制在300字以内
          2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以"你"来称呼对方
          3. 如果没有音素得分有可能是因为漏读了
          4. 避免列举具体数字
          5. 开头直接分析就行，不需要引入语
          6. 需要从音素的声母、韵母，整体的准确度、流利度等多个维度进行分析
          7. 如果单字的Tone:Valid=true说明启用了声调评测，启用时你才需要额外分析声调是否正确，HypothesisTone为-1代表该字的声调读错了
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

      // 计算声母分、韵母分和声调分
      let initialScore = 0; // 声母分
      let finalScore = 0;   // 韵母分
      let toneScore = 0;    // 声调分
      let wordCount = jsonData.result.Words.length;

      // 计算声母分和韵母分
      let initialTotal = 0;
      let finalTotal = 0;
      let toneCorrect = 0;

      for (let i = 0; i < wordCount; i++) {
        let word = jsonData.result.Words[i];
        
        // 累加声母分（每个词的第一个音素）
        if (word.PhoneInfos.length > 0) {
          initialTotal += word.PhoneInfos[0].PronAccuracy;
        }
        
        // 累加韵母分（每个词的第二个音素）
        if (word.PhoneInfos.length > 1) {
          finalTotal += word.PhoneInfos[1].PronAccuracy;
        }
        
        // 计算声调分
        if (word.Tone && word.Tone.Valid) {
          if (word.Tone.HypothesisTone !== -1) {
            toneCorrect++;
          }
        }
      }

      // 计算平均分
      if (wordCount > 0) {
        initialScore = initialTotal / wordCount;
        finalScore = finalTotal / wordCount;
        toneScore = (toneCorrect / wordCount) * 100;
      }

      // 显示分数
      document.getElementById("initial_score").innerText = initialScore.toFixed(2);
      document.getElementById("final_score").innerText = finalScore.toFixed(2);
      document.getElementById("tone_score").innerText = toneScore.toFixed(2);

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

      // 移除之前的事件监听器（如果存在）
      if (evalText._compositionListener) {
        evalText.removeEventListener("compositionend", evalText._compositionListener);
      }
      if (evalText._inputListener) {
        evalText.removeEventListener("input", evalText._inputListener);
      }

      // 定义组合输入结束后的处理函数
      const compositionEndHandler = function (event) {
        // 获取纯文本内容
        let plainText = evalText.textContent;
        // 重置为黑色
        evalText.textContent = plainText;
        // 设置光标位置
        setCursorToEnd(evalText);
      };

      // 定义普通输入处理函数（英文/数字等）
      const inputHandler = function (event) {
        // 防止组合输入时触发
        if (evalText._isComposing) return;
        // 获取纯文本内容
        let plainText = evalText.textContent;
        // 重置为黑色
        evalText.textContent = plainText;
        // 设置光标位置
        setCursorToEnd(evalText);
      };

      // 组合输入开始标志
      evalText.addEventListener("compositionstart", () => {
        evalText._isComposing = true;
      });

      // 组合输入结束标志
      evalText.addEventListener("compositionend", () => {
        evalText._isComposing = false;
        // 延迟执行以确保最终字符已提交
        setTimeout(() => {
          compositionEndHandler();
        }, 0);
      });

      // 保存监听器引用以便后续移除
      evalText._compositionListener = compositionEndHandler;
      evalText._inputListener = inputHandler;

      // 添加事件监听器
      evalText.addEventListener("compositionstart", () => {
        evalText._isComposing = true;
      });
      evalText.addEventListener("compositionend", () => {
        evalText._isComposing = false;
        setTimeout(() => {
          compositionEndHandler();
        }, 0);
      });
      evalText.addEventListener("input", inputHandler);

      // 光标移动到文本末尾（避免光标跳动）
      function setCursorToEnd(el) {
        let range = document.createRange();
        let selection = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
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
