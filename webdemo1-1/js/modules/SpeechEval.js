
class SpeechEvalModule {
    constructor() {
        this.btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"
        this.btnControl = document.getElementById("btn_control");
        this.iseWS = null;
        this.recorder = null;
        this.audioChunks = []; // Initialize audioChunks

        this.init();
    }

    init() {
        if (!this.btnControl) return;

        // Initialize Recorder
        // Assuming RecorderManager is globally available from dist/index.umd.js
        if (typeof RecorderManager !== 'undefined') {
            this.recorder = new RecorderManager("dist");
            this.bindEvents();
        } else {
            console.error("RecorderManager is not defined.");
        }
    }

    bindEvents() {
        this.recorder.onStart = () => {
            console.log("onStart");
            this.audioChunks = [];
            this.changeBtnStatus("OPEN");
        }

        this.recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
            if (frameBuffer) {
                this.audioChunks.push(frameBuffer);
            }
            if (this.iseWS && this.iseWS.readyState === this.iseWS.OPEN) {
                this.iseWS.send(frameBuffer);
                if (isLastFrame) {
                    this.iseWS.send(JSON.stringify({ type: "end" }));
                    this.changeBtnStatus("CLOSING");
                }
            }
        };

        this.recorder.onStop = () => {
        };

        this.btnControl.onclick = () => {
            if (this.btnStatus === "UNDEFINED" || this.btnStatus === "CLOSED") {
                this.connectWebSocket();
            } else if (this.btnStatus === "CONNECTING" || this.btnStatus === "OPEN") {
                // 结束录音
                console.log("停止录音");
                this.recorder.stop();
            }
        };
    }

    getWebSocketUrl() {
        const APPID = CONFIG.TENCENT.APPID;
        const SECRET_ID = CONFIG.TENCENT.SECRET_ID;
        const SECRET_KEY = CONFIG.TENCENT.SECRET_KEY;

        const SERVER_ENGINE_TYPE = "16k_zh"; // 中文标准版
        const VOICE_ID = crypto.randomUUID(); // 生成唯一音频流标识
        //添加声调评测标识
        const REF_TEXT = "{::cmd{F_TDET=true}}" + (document.getElementById("evalText")?.innerText || "你好");
        const TIMESTAMP = Math.floor(Date.now() / 1000);
        const NONCE = Math.floor(Math.random() * 1000000000);
        const EXPIRED = TIMESTAMP + 86400; // 1 天有效期

        let selectedMode = "读单词";
        const checkedRadio = document.querySelector('input[type="radio"][name="group"]:checked');
        if (checkedRadio && checkedRadio.nextSibling) {
            selectedMode = checkedRadio.nextSibling.textContent.trim();
        }

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

    changeBtnStatus(status) {
        this.btnStatus = status;
        if (status === "CONNECTING") {
            this.btnControl.innerText = "建立连接中";
        } else if (status === "OPEN") {
            this.btnControl.innerText = "录音中...";
        } else if (status === "CLOSING") {
            this.btnControl.innerText = "关闭连接中";
        } else if (status === "CLOSED") {
            this.btnControl.innerText = "开始录音";
        }
    }

    getAnalysis(req_content) {
        const Authorization = CONFIG.FASTGPT.API_KEY;

        // Determine mode from UI (radio buttons)
        const selectedModeElement = document.querySelector('input[name="group"]:checked');
        const selectedMode = selectedModeElement ? selectedModeElement.value : '读句子'; // Default to Sentence if not found

        let prompt;
        // Import PROMPTS if module system allows, or define here if not using modules fully yet.
        // Assuming global access or defined in config.js/prompts.js loaded before this.
        // Since we created prompts.js, we need to ensure it's loaded. 
        // For now, I will inline the logic to match the existing style, 
        // but referencing the "PROMPTS" object if I can ensure it's available.
        // Given the environment, I'll use a safer approach: check if PROMPTS exists, else fallback.

        if (typeof PROMPTS !== 'undefined') {
            if (selectedMode === '读段落') {
                prompt = PROMPTS.PARAGRAPH;
            } else {
                prompt = PROMPTS.DEFAULT;
            }
        } else {
            // Fallback if PROMPTS not loaded
            if (selectedMode === '读段落') {
                prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括整体的准确度、流利度、完整度以及总分。
                  然后对这位汉语学习者给出练习建议。
                  注意：
                  1. 分析和建议各控制在300字以内
                  2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以“你”来称呼对方
                  3. 重点分析整体的朗读效果，如停顿、语速、情感表达等
                  4. 避免列举具体数字
                  5. 开头直接分析就行，不需要引入语
                  6. 由于是段落朗读，请更多关注语流音变和整体语感`;
            } else {
                prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括一句里每个字的音素和音素得分：({
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
                      2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以“你”来称呼对方
                      3. 如果没有音素得分有可能是因为漏读了
                      4. 避免列举具体数字
                      5. 开头直接分析就行，不需要引入语
                      6. 需要从音素的声母、韵母，整体的准确度、流利度等多个维度进行分析
                      7. 如果单字的Tone:Valid=true说明启用了声调评测，启用时你才需要额外分析声调是否正确，HypothesisTone为-1代表该字的声调读错了`;
            }
        }

        return axios({
            url: 'https://api.fastgpt.in/api/v1/chat/completions',
            method: 'post',
            data: JSON.stringify({
                "chatId": "111",
                "stream": false,
                "detail": false,
                "messages": [
                    {
                        "content": req_content + prompt,
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
            let suggestionBox = document.querySelector(".suggestion-box");

            if (suggestionBox) {
                suggestionBox.value = content;
            } else {
                console.error("未找到 .suggestion-box 元素");
            }
            return content;
        });
    }

    mergeAudioChunks() {
        const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of this.audioChunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }
        return result.buffer;
    }

    addWavHeader(samples) {
        const dataLength = samples.byteLength;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 16000, true);
        view.setUint32(28, 32000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        new Uint8Array(buffer, 44).set(new Uint8Array(samples));

        return buffer;
    }

    renderResult(resultData, isFinal = false) {
        // 识别结束
        let jsonData = JSON.parse(resultData);
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
                    } else {
                        randomColor = `rgb(34, 139, 34)`; // Green for >= 80
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
            const jsonString = JSON.stringify(analysisData, null, 2);

            if (isFinal) {
                // 1. Get Analysis
                const analysisPromise = this.getAnalysis(jsonString);

                // 2. Upload Audio
                const pcmBuffer = this.mergeAudioChunks();
                const wavBuffer = this.addWavHeader(pcmBuffer);
                const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                const audioUploadPromise = ScoreService.uploadAudioFile(audioBlob);

                Promise.all([analysisPromise, audioUploadPromise])
                    .then(([advice, audioUrl]) => {
                        // 3. Create Score Action
                        const scoreData = {
                            audioUrl: audioUrl,
                            accuracy: jsonData.result.PronAccuracy,
                            fluency: jsonData.result.PronFluency * 100,
                            completeness: jsonData.result.PronCompletion * 100,
                            initialSoundScore: initialScore,
                            finalSoundScore: finalScore,
                            toneScore: toneScore,
                            totalScore: jsonData.result.SuggestedScore,
                            advice: advice
                        };
                        return ScoreService.createScoreAction(scoreData);
                    })
                    .then(res => {
                        console.log("Score saved successfully:", res);
                        // alert("评分已保存！");
                    })
                    .catch(err => {
                        console.error("Failed to save score:", err);
                        // alert("保存评分失败: " + err.message);
                    });
            }

            evalText.innerHTML = coloredText;

            // 移除之前的事件监听器（如果存在）
            if (evalText._compositionListener) {
                evalText.removeEventListener("compositionend", evalText._compositionListener);
            }
            if (evalText._inputListener) {
                evalText.removeEventListener("input", evalText._inputListener);
            }

            // 定义组合输入结束后的处理函数
            const compositionEndHandler = function (event) {
                let plainText = evalText.textContent;
                evalText.textContent = plainText;
                setCursorToEnd(evalText);
            };

            // 定义普通输入处理函数（英文/数字等）
            const inputHandler = function (event) {
                if (evalText._isComposing) return;
                let plainText = evalText.textContent;
                evalText.textContent = plainText;
                setCursorToEnd(evalText);
            };

            // 组合输入开始标志
            evalText.addEventListener("compositionstart", () => {
                evalText._isComposing = true;
            });

            // 组合输入结束标志
            evalText.addEventListener("compositionend", () => {
                evalText._isComposing = false;
                setTimeout(() => {
                    compositionEndHandler();
                }, 0);
            });

            // 保存监听器引用以便后续移除
            evalText._compositionListener = compositionEndHandler;
            evalText._inputListener = inputHandler;

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

    connectWebSocket() {
        const websocketUrl = this.getWebSocketUrl();
        if ("WebSocket" in window) {
            this.iseWS = new WebSocket(websocketUrl);
        } else {
            alert("浏览器不支持WebSocket");
            return;
        }
        this.changeBtnStatus("CONNECTING");
        this.iseWS.onopen = () => {
            this.recorder.start({ sampleRate: 16000, frameSize: 1280 });
        };

        this.iseWS.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("收到消息:", data);
            const isFinal = data.final === 1;
            this.renderResult(e.data, isFinal);

            if (isFinal) {
                this.iseWS.close();
            }
        };

        this.iseWS.onerror = (e) => {
            console.error(e);
            this.recorder.stop();
            this.changeBtnStatus("CLOSED");
        };
        this.iseWS.onclose = () => {
            this.recorder.stop();
            this.changeBtnStatus("CLOSED");
        };
    }
}

window.SpeechEvalModule = SpeechEvalModule;
