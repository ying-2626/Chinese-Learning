
class SpeechEvalModule {
    constructor() {
        this.btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"
        this.btnControl = document.getElementById("btn_control");
        this.iseWS = null;
        this.recorder = null;

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
            this.changeBtnStatus("OPEN");
        }

        this.recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
            if (this.iseWS && this.iseWS.readyState === this.iseWS.OPEN) {
                this.iseWS.send(
                    JSON.stringify({
                        business: {
                            aue: "raw",
                            cmd: "auw",
                            aus: isLastFrame ? 4 : 2,
                        },
                        data: {
                            status: isLastFrame ? 2 : 1,
                            data: this.toBase64(frameBuffer),
                            data_type: 1
                        },
                    })
                );
                if (isLastFrame) {
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
        var url = "wss://ise-api.xfyun.cn/v2/open-ise";
        var host = "ise-api.xfyun.cn";
        var apiKey = CONFIG.XUNFEI.API_KEY;
        var apiSecret = CONFIG.XUNFEI.API_SECRET;
        var date = new Date().toGMTString();
        var algorithm = "hmac-sha256";
        var headers = "host date request-line";
        var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/open-ise HTTP/1.1`;
        var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        var signature = CryptoJS.enc.Base64.stringify(signatureSha);
        var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        var authorization = btoa(authorizationOrigin);
        url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
        return url;
    }

    toBase64(buffer) {
        var binary = "";
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
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

    renderResult(resultData) {
        // 识别结束
        let jsonData = JSON.parse(resultData);
        console.log(jsonData.data);

        if (jsonData.data && jsonData.data.data) {
            let data = window.atob(jsonData.data.data);
            let grade = parser.parse(data, {
                attributeNamePrefix: "",
                ignoreAttributes: false,
            });
            console.log(grade);

            const readSentence = grade?.xml_result?.read_sentence?.rec_paper?.read_chapter;

            const setText = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.innerText = text;
            };

            setText("accuracy_score", readSentence?.accuracy_score);
            setText("fluency_score", readSentence?.fluency_score);
            setText("integrity_score", readSentence?.integrity_score);
            setText("phone_score", readSentence?.phone_score || 0);
            setText("tone_score", readSentence?.tone_score || 0);
            setText("emotion_score", readSentence?.emotion_score || 0);
            setText("total_score", readSentence?.total_score);

            if (readSentence?.syll) setText("syll", readSentence.syll);

            // Detailed result rendering
            let sentence = readSentence?.word || [];
            let resultStr = "";
            sentence.forEach((item) => {
                if (item?.word) {
                    item.word.forEach((wt) => {
                        let flag = false;
                        if (wt.syll?.phone) {
                            flag = wt.syll.phone.some((pt) => pt?.perr_msg != 0);
                        } else {
                            wt.syll.forEach((st) => {
                                if (Array.isArray(st?.phone)) {
                                    flag = st.phone.some((pt) => pt?.perr_msg != 0);
                                }
                            });
                        }
                        if (flag) {
                            resultStr += `<span class="err">${wt.content}</span>`;
                        } else {
                            resultStr += wt.content;
                        }
                    });
                } else if (item?.syll) {
                    let flag = false;
                    if (item.syll?.phone) {
                        flag = item.syll.phone.some((pt) => pt?.perr_msg != 0);
                    } else {
                        item.syll.forEach((st) => {
                            if (Array.isArray(st?.phone)) {
                                flag = st.phone.some((pt) => pt?.perr_msg != 0);
                            }
                        });
                    }
                    if (flag) {
                        resultStr += `<span class="err">${item.content}</span>`;
                    } else {
                        resultStr += item.content;
                    }
                }
            });
            if (resultStr) {
                const rightDiv = document.getElementById("right");
                const resultDiv = document.getElementById("result");
                if (rightDiv) rightDiv.style.display = "block";
                if (resultDiv) resultDiv.innerHTML = resultStr;
            } else {
                const rightDiv = document.getElementById("right");
                if (rightDiv) rightDiv.style.display = "none";
            }
        }
        if (jsonData.code === 0 && jsonData.data.status === 2) {
            this.iseWS.close();
        }
        if (jsonData.code !== 0) {
            this.iseWS.close();
            console.error(jsonData);
        }
    }

    connectWebSocket() {
        const websocketUrl = this.getWebSocketUrl();
        if ("WebSocket" in window) {
            this.iseWS = new WebSocket(websocketUrl);
        } else if ("MozWebSocket" in window) {
            this.iseWS = new MozWebSocket(websocketUrl);
        } else {
            alert("浏览器不支持WebSocket");
            return;
        }
        this.changeBtnStatus("CONNECTING");

        this.iseWS.onopen = (e) => {
            // 开始录音
            this.recorder.start({
                sampleRate: 16000,
                frameSize: 1280,
            });
            var params = {
                common: {
                    app_id: CONFIG.XUNFEI.APPID,
                },
                business: {
                    category: "read_sentence",
                    rstcd: "utf8",
                    group: "pupil",
                    sub: "ise",
                    tte: "utf-8",
                    cmd: "ssb",
                    auf: "audio/L16;rate=16000",
                    ent: "en_vip",
                    aus: 1,
                    aue: "raw",
                    text: "\uFEFF" + (document.getElementById("evalText")?.innerText || "where are you"), // Changed to evalText innerText
                },
                data: {
                    status: 0,
                },
            };
            this.iseWS.send(JSON.stringify(params));
        };

        this.iseWS.onmessage = (e) => {
            this.renderResult(e.data);
        };

        this.iseWS.onerror = (e) => {
            console.error(e);
            this.recorder.stop();
            this.changeBtnStatus("CLOSED");
        };

        this.iseWS.onclose = (e) => {
            this.recorder.stop();
            this.changeBtnStatus("CLOSED");
        };
    }
}

window.SpeechEvalModule = SpeechEvalModule;
