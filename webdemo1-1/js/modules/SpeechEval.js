
class SpeechEvalModule {
    constructor() {
        this.btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"
        this.btnControl = document.getElementById("btn_control");
        this.iseWS = null;
        this.recorder = null;
        this.audioChunks = []; // Initialize audioChunks
        this.suggestionBox = document.querySelector('.suggestion-box');
        this.feedbackSpeechButton = document.getElementById('feedback_speech_toggle');
        this.feedbackSpeechIcon = document.getElementById('feedback_speech_icon');
        this.feedbackSpeechLabel = document.getElementById('feedback_speech_label');
        this.feedbackSpeechRate = document.getElementById('feedback_speech_rate');
        this.feedbackSpeechStatus = document.getElementById('feedback_speech_status');
        this.feedbackSpeech = typeof FeedbackSpeech !== 'undefined' ? new FeedbackSpeech() : null;
        this.feedbackReady = false;
        this.feedbackGeneration = 0;

        this.init();
    }

    init() {
        if (!this.btnControl) return;
        this.buttonLabel = this.btnControl.querySelector('.recording-label');
        const capsule = this.btnControl.closest('.recording-capsule');
        this.recordingCapsule = capsule && typeof RecordingCapsule !== 'undefined' ? new RecordingCapsule(capsule) : null;
        this.changeBtnStatus("CLOSED");

        this.bindFeedbackSpeech();
        this.bindFeedbackSpeechLifecycle();

        // Initialize Recorder
        // Assuming RecorderManager is globally available from dist/index.umd.js
        if (typeof RecorderManager !== 'undefined') {
            this.bindEvents();
        } else {
            console.error("RecorderManager is not defined.");
            this.btnControl.disabled = true;
            this.showRecordingStatus('录音组件未加载，请刷新页面');
        }
    }

    bindFeedbackSpeech() {
        if (!this.feedbackSpeechButton || !this.suggestionBox) return;

        if (!this.feedbackSpeech?.isSupported()) {
            this.updateFeedbackSpeechUi({
                label: '听反馈',
                icon: 'ph-speaker-slash',
                status: '当前设备暂时无法朗读，请阅读文字反馈',
                disabled: true,
            });
            return;
        }

        this.feedbackSpeechButton.addEventListener('click', () => {
            if (this.feedbackSpeech.isReading()) {
                this.stopFeedbackSpeech(true);
                return;
            }

            try {
                this.updateFeedbackSpeechUi({
                    label: '停止',
                    icon: 'ph-stop-circle',
                    status: '正在准备朗读',
                    disabled: false,
                });

                this.feedbackSpeech.speak(this.suggestionBox.value, {
                    rate: Number(this.feedbackSpeechRate?.value || 0.85),
                    onStart: () => {
                        this.updateFeedbackSpeechUi({
                            label: '停止',
                            icon: 'ph-stop-circle',
                            status: '正在朗读反馈',
                            disabled: false,
                        });
                    },
                    onEnd: () => {
                        this.updateFeedbackSpeechUi({
                            label: '再听一遍',
                            icon: 'ph-arrow-counter-clockwise',
                            status: '朗读完成',
                            disabled: false,
                        });
                    },
                    onError: () => {
                        this.updateFeedbackSpeechUi({
                            label: '再试一次',
                            icon: 'ph-arrow-counter-clockwise',
                            status: '朗读失败，请重试或阅读文字',
                            disabled: false,
                        });
                    },
                });

            } catch (error) {
                this.updateFeedbackSpeechUi({
                    label: '再试一次',
                    icon: 'ph-arrow-counter-clockwise',
                    status: error.message || '朗读失败，请重试或阅读文字',
                    disabled: !this.feedbackReady,
                });
            }
        });
    }

    bindFeedbackSpeechLifecycle() {
        window.addEventListener('pagehide', () => {
            this.feedbackSpeech?.stop();
            this.finishRecording();
        });

        document.addEventListener('click', (event) => {
            const moduleNavigation = event.target.closest?.('[data-module]');
            if (moduleNavigation && moduleNavigation.dataset.module !== 'speech-evaluation') {
                this.stopFeedbackSpeech(false);
                this.finishRecording();
            }
        });
    }

    updateFeedbackSpeechUi({ label, icon, status, disabled }) {
        if (this.feedbackSpeechLabel) {
            this.feedbackSpeechLabel.textContent = label;
        }
        if (this.feedbackSpeechIcon) {
            this.feedbackSpeechIcon.className = `ph ${icon}`;
        }
        if (this.feedbackSpeechStatus) {
            this.feedbackSpeechStatus.textContent = status;
        }
        if (this.feedbackSpeechButton) {
            this.feedbackSpeechButton.disabled = disabled;
            this.feedbackSpeechButton.setAttribute('aria-label', label);
        }
    }

    stopFeedbackSpeech(userInitiated = false) {
        const wasReading = Boolean(this.feedbackSpeech?.isReading());
        this.feedbackSpeech?.stop();

        if ((wasReading || userInitiated) && this.feedbackReady) {
            this.updateFeedbackSpeechUi({
                label: '再听一遍',
                icon: 'ph-arrow-counter-clockwise',
                status: '已停止',
                disabled: false,
            });
        }
    }

    prepareForNewFeedback(status) {
        this.feedbackGeneration++;
        this.feedbackSpeech?.stop();
        this.feedbackReady = false;

        if (!this.feedbackSpeech?.isSupported()) {
            this.updateFeedbackSpeechUi({
                label: '听反馈',
                icon: 'ph-speaker-slash',
                status: '当前设备暂时无法朗读，请阅读文字反馈',
                disabled: true,
            });
            return;
        }

        this.updateFeedbackSpeechUi({
            label: '听反馈',
            icon: 'ph-speaker-high',
            status,
            disabled: true,
        });
    }

    bindEvents() {
        this.btnControl.onclick = () => {
            if (this.btnStatus === "UNDEFINED" || this.btnStatus === "CLOSED") {
                this.connectWebSocket();
            } else if (this.btnStatus === "OPEN") {
                this.changeBtnStatus("CLOSING");
                this.activeRecording.stopping = true;
                this.recorder.stop();
            }
        };
    }

    bindRecorder(attempt) {
        const current = () => attempt.active && this.activeRecording === attempt;
        attempt.recorder.onStart = () => {
            if (!current()) {
                attempt.recorder.stop();
                return;
            }
            attempt.started = true;
            this.prepareForNewFeedback('完成本次朗读后可以听新反馈');
            this.audioChunks = [];
            this.changeBtnStatus("OPEN");
        };

        attempt.recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
            if (!current()) return;
            if (frameBuffer?.byteLength) {
                this.audioChunks.push(frameBuffer);
                this.recordingCapsule?.pushFrame(frameBuffer);
            }
            if (attempt.socket?.readyState === WebSocket.OPEN && !attempt.endSent) {
                if (frameBuffer?.byteLength) attempt.socket.send(frameBuffer);
                if (isLastFrame) {
                    attempt.endSent = true;
                    attempt.socket.send(JSON.stringify({ type: "end" }));
                    this.changeBtnStatus("CLOSING");
                }
            }
        };

        attempt.recorder.onStop = () => {
            if (current() && this.btnStatus === 'OPEN') this.changeBtnStatus('CLOSING');
        };
    }

    finishRecording(attempt = this.activeRecording) {
        if (!attempt) return;
        attempt.active = false;
        if (!attempt.stopping) {
            attempt.stopping = true;
            attempt.recorder.stop();
        }
        if (attempt.socket && attempt.socket.readyState < 2) attempt.socket.close();
        if (this.activeRecording === attempt) {
            this.activeRecording = null;
            this.iseWS = null;
            this.changeBtnStatus('CLOSED');
        }
    }

    showRecordingStatus(message, needsLogin = false) {
        const status = document.getElementById('recording_status');
        if (!status) return;
        status.textContent = message;
        if (needsLogin) {
            const link = document.createElement('a');
            link.href = 'login.html';
            link.textContent = '前往登录';
            status.append(link);
        }
    }

    async getWebSocketUrl() {
        const selectedModeElement = document.querySelector('input[type="radio"][name="group"]:checked');
        let selectedMode = "读汉字";
        if (selectedModeElement) {
            selectedMode = selectedModeElement.value || selectedModeElement.nextSibling.textContent.trim();
        }

        console.log("mode is: ", selectedMode);
        let evalMode = 0;
        if (selectedMode === "读句子") {
            evalMode = 1;
        } else if (selectedMode === "读段落") {
            evalMode = 2;
        } else {
            evalMode = 0;
        }

        const refText = document.getElementById("evalText").innerText.trim();

        try {
            const response = await fetch(`${CONFIG.BACKEND_API}/api/tencent/soe/websocket-url`, {
                method: 'POST',
                headers: LegacyContent.headers(true),
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
                const error = new Error(result.message || '获取连接失败');
                error.code = result.code;
                throw error;
            }

            return result.result;
        } catch (error) {
            console.error("获取 WebSocket URL 失败:", error);
            throw error;
        }
    }

    changeBtnStatus(status) {
        this.btnStatus = status;
        this.btnControl.dataset.state = {
            CONNECTING: 'connecting', OPEN: 'recording', CLOSING: 'closing', CLOSED: 'idle'
        }[status] || 'idle';
        this.btnControl.disabled = status === "CONNECTING" || status === "CLOSING";
        const label = { CONNECTING: '建立连接中', OPEN: '停止录音', CLOSING: '正在测评', CLOSED: '开始录音' }[status] || '开始录音';
        if (this.buttonLabel) this.buttonLabel.textContent = label;
        else this.btnControl.innerText = label;
        this.btnControl.setAttribute('aria-label', label);
        this.btnControl.setAttribute('aria-busy', String(this.btnControl.disabled));
        this.recordingCapsule?.setState(this.btnControl.dataset.state);
        const busy = ['CONNECTING', 'OPEN', 'CLOSING'].includes(status);
        document.getElementById('evalText')?.setAttribute('contenteditable', String(!busy));
        document.querySelectorAll('input[name="group"]').forEach(input => { input.disabled = busy; });
    }

    displayScore(id, value) {
        const element = document.getElementById(id);
        const text = String(Math.round(value));
        if (typeof ScoreMotion !== 'undefined') ScoreMotion.set(element, text);
        else element.innerText = text;
        // 进度条和环形图读取 --score
        const score = Math.max(0, Math.min(100, value));
        element.closest('.metric, .score-card')?.style.setProperty('--score', score);
        if (id === 'total_score') this.displayGrade(score);
    }

    displayGrade(score) {
        const card = document.querySelector('.score-card');
        const grade = document.getElementById('score_grade');
        if (!card || !grade) return;
        const [label, level] = score >= 85 ? ['优秀', 'good'] : score >= 70 ? ['良好', 'good'] : score >= 60 ? ['合格', 'warn'] : ['需加强', 'bad'];
        card.dataset.state = 'scored';
        grade.textContent = label;
        grade.dataset.level = level;
    }

    async getAnalysis(req_content) {
        const headers = LegacyContent.headers(true);
        const selectedModeElement = document.querySelector('input[name="group"]:checked');
        const selectedMode = selectedModeElement ? selectedModeElement.value : '读句子';

        this.prepareForNewFeedback('AI 老师正在生成建议');
        const generation = this.feedbackGeneration;

        let suggestionBox = this.suggestionBox;
        if (suggestionBox) {
            suggestionBox.value = "正在分析你的录音，请稍候...";
            suggestionBox.disabled = true;
        }

        let loadingDots = 0;
        const loadingInterval = setInterval(() => {
            if (!suggestionBox) {
                suggestionBox = document.querySelector(".suggestion-box");
            }
            if (generation === this.feedbackGeneration && suggestionBox && suggestionBox.disabled) {
                loadingDots = (loadingDots + 1) % 4;
                suggestionBox.value = "正在分析你的录音" + ".".repeat(loadingDots) + "   ".repeat(3 - loadingDots);
            }
        }, 500);

        let prompt;

        if (typeof PROMPTS !== 'undefined') {
            if (selectedMode === '读段落') {
                prompt = PROMPTS.PARAGRAPH;
            } else {
                prompt = PROMPTS.DEFAULT;
            }
        } else {
            if (selectedMode === '读段落') {
                prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括整体的准确度、流利度、完整度以及总分。
                  然后对这位汉语学习者给出练习建议。
                  注意：
                  1. 分析和建议各控制在300字以内
                  2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以"你"来称呼对方
                  3. 重点分析整体的朗读效果，如停顿、语速、情感表达等
                  4. 避免列举具体数字
                  5. 开头直接分析就行，不需要引入语
                  6. 由于是段落朗读，请更多关注语流音变和整体语感`;
            } else {
                prompt = `你是一位中文口语老师，以下是口语测评数据，请分析并给出评价。数据包括一句里每个字的音素和音素得分。
                      分析步骤：
                      1. 整体评价：根据总分、准确度、流利度、完整度给出鼓励性评价
                      2. 共性问题归纳：找出所有低分字中反复出现的共性问题，统一说明（如多个字声调未识别、声母普遍偏弱等），不要逐字重复
                      3. 逐字分析：只对有独特问题的字单独分析，共性问题不要重复
                      4. 练习建议：针对问题给出简洁建议
                      注意：
                      1. 分析和建议各控制在300字以内
                      2. 输出应该模仿老师的语言风格，避免出现markdown等特殊格式的字符，并以"你"来称呼对方
                      3. 避免重复：共性问题只说一次，不要每个字都复制粘贴相同的分析
                      4. 避免列举具体数字
                      5. 开头直接分析就行，不需要引入语
                      6. 如果单字的Tone:Valid=true说明启用了声调评测，HypothesisTone为-1代表声调读错`;
            }
        }

        return axios({
            url: `${CONFIG.BACKEND_API}/api/fastgpt/chat/completions`,
            method: 'post',
            data: JSON.stringify({
                "chatId": "evaluation:" + crypto.randomUUID(),
                "stream": false,
                "detail": false,
                "messages": [
                    {
                        "content": req_content + prompt,
                        "role": "user"
                    }
                ]
            }),
            headers,
            withCredentials: true
        }).then((response) => {
            const data = response.data;
            if (data.code !== 0) {
                throw new Error(data.message || '分析请求失败');
            }
            let content = data.result?.choices?.[0]?.message?.content;
            if (typeof content !== 'string' || !content.trim()) throw new Error('服务未返回反馈内容');
            clearInterval(loadingInterval);
            if (generation !== this.feedbackGeneration) return content;
            let suggestionBox = document.querySelector(".suggestion-box");

            if (suggestionBox) {
                suggestionBox.value = content;
                suggestionBox.disabled = false;
                this.feedbackReady = Boolean(content?.trim());
                const speechSupported = Boolean(this.feedbackSpeech?.isSupported());
                this.updateFeedbackSpeechUi({
                    label: '听反馈',
                    icon: speechSupported ? 'ph-speaker-high' : 'ph-speaker-slash',
                    status: !speechSupported
                        ? '当前设备暂时无法朗读，请阅读文字反馈'
                        : (this.feedbackReady ? '可以阅读，也可以听' : '暂无可朗读反馈'),
                    disabled: !this.feedbackReady || !speechSupported,
                });
            } else {
                console.error("未找到 .suggestion-box 元素");
            }
            return content;
        }).catch(err => {
            clearInterval(loadingInterval);
            if (generation === this.feedbackGeneration) {
                if (suggestionBox) {
                    suggestionBox.value = '分析失败：' + (err.message || '请重试');
                    suggestionBox.disabled = false;
                }
                this.feedbackReady = false;
                this.updateFeedbackSpeechUi({label:'听反馈', icon:'ph-speaker-high', status:'暂无可朗读反馈', disabled:true});
            }
            throw err;
        });
    }

    showSaveStatus(message) {
        const status = document.getElementById('score_save_status');
        if (status) status.textContent = message;
    }

    async saveEvaluation(scores, analysisRequest) {
        const sessionId = LegacyContent.getUser()?.sessionId;
        this.showSaveStatus('正在保存本次评测');
        const analysisPromise = this.getAnalysis(analysisRequest);
        const generation = this.feedbackGeneration;
        const audioPromise = (async () => {
            const wavBuffer = this.addWavHeader(this.mergeAudioChunks());
            return ScoreService.uploadAudioFile(new Blob([wavBuffer], { type: 'audio/wav' }));
        })();

        try {
            // Advice and audio can fail independently without discarding the measured scores.
            const [analysis, audio] = await Promise.allSettled([analysisPromise, audioPromise]);
            if (sessionId !== LegacyContent.getUser()?.sessionId) {
                throw new Error('登录状态已变化，请重新登录后评测');
            }
            await ScoreService.createScoreAction({
                ...scores,
                advice: analysis.status === 'fulfilled' ? analysis.value : null,
                audioUrl: audio.status === 'fulfilled' ? audio.value : null
            });
            if (generation !== this.feedbackGeneration) return;
            const missing = [];
            if (analysis.status === 'rejected') missing.push('AI 建议未生成：' + (analysis.reason?.message || '请稍后重试'));
            if (audio.status === 'rejected') missing.push('录音未保存：' + (audio.reason?.message || '请检查连接'));
            this.showSaveStatus(missing.length
                ? (audio.status === 'fulfilled' ? '本次评分和录音已保存；' : '本次评分已保存；') + missing.join('；')
                : '本次评测已保存，可在历史记录中查看');
        } catch (error) {
            if (generation === this.feedbackGeneration) {
                this.showSaveStatus('本次评测未保存：' + (error.message || '请检查连接后重试'));
            }
        }
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
            let initialScore = 0;
            let finalScore = 0;
            let toneScore = 0;

            // 显示整体分数
            this.displayScore('accuracy_score', jsonData.result.PronAccuracy);
            this.displayScore('fluency_score', jsonData.result.PronFluency * 100);
            this.displayScore('integrity_score', jsonData.result.PronCompletion * 100);
            this.displayScore('total_score', jsonData.result.SuggestedScore);

            // Determine mode
            const selectedModeElement = document.querySelector('input[name="group"]:checked');
            const selectedMode = selectedModeElement ? (selectedModeElement.value || selectedModeElement.nextSibling.textContent.trim()) : '读句子';

            console.log(`[SpeechEval] Render Mode: ${selectedMode}, IsFinal: ${isFinal}`);

            if (selectedMode !== '读段落') {
                // 计算声母分、韵母分和声调分
                let wordCount = jsonData.result.Words.length;
                let initialTotal = 0;
                let finalTotal = 0;
                let toneCorrect = 0;

                for (let i = 0; i < wordCount; i++) {
                    let word = jsonData.result.Words[i];

                    // 累加声母分（每个词的第一个音素）
                    if (word.PhoneInfos && word.PhoneInfos.length > 0) {
                        initialTotal += word.PhoneInfos[0].PronAccuracy;
                    }

                    // 累加韵母分（每个词的第二个音素）
                    if (word.PhoneInfos && word.PhoneInfos.length > 1) {
                        finalTotal += word.PhoneInfos[1].PronAccuracy;
                    }

                    // 计算声调分
                    if (word.Tone && word.Tone.Valid) {
                        // -1 表示未检测到有效声调或发音错误
                        if (word.Tone.HypothesisTone !== -1) {
                            toneCorrect++;
                        }
                    }
                }

                // 计算平均分
                if (wordCount > 0) {
                    initialScore = initialTotal / wordCount;
                    // 如果大部分字都有声韵母，这样计算没问题；如果有很多零声母字，分母应该调整吗？
                    // 暂时保持原逻辑，但添加日志
                    finalScore = finalTotal / wordCount;
                    toneScore = (toneCorrect / wordCount) * 100;
                }

                console.log(`[SpeechEval] Calculated Scores -> Initial: ${initialScore}, Final: ${finalScore}, Tone: ${toneScore}, WordCount: ${wordCount}`);

                // 显示分数
                this.displayScore('initial_score', initialScore);
                this.displayScore('final_score', finalScore);
                this.displayScore('tone_score', toneScore);

                document.getElementById("initial_score_wrapper").style.display = "block";
                document.getElementById("final_score_wrapper").style.display = "block";
                document.getElementById("tone_score_wrapper").style.display = "block";
            } else {
                // 段落模式下隐藏声韵调分数 UI
                document.getElementById("initial_score_wrapper").style.display = "none";
                document.getElementById("final_score_wrapper").style.display = "none";
                document.getElementById("tone_score_wrapper").style.display = "none";
            }

            //单字PronAccuracy低于60标红，60-80标黄
            const evalText = document.getElementById("evalText");
            let coloredText = "";
            const weakWords = [];
            for (let i = 0; i < jsonData.result.Words.length; i++) {
                let word = jsonData.result.Words[i].Word
                let word_accuracy = jsonData.result.Words[i].PronAccuracy
                if (word != "*") {
                    // 低于 60 为错误，60-80 待改进，80 以上准确
                    const level = word_accuracy < 60 ? 'bad' : word_accuracy < 80 ? 'warn' : 'good';
                    if (level !== 'good' && !weakWords.includes(word)) weakWords.push(word);
                    coloredText += `<span class="eval-word" data-level="${level}" title="准确度 ${Math.round(word_accuracy)}">${LegacyContent.escapeHtml(word)}</span>`;
                }
            }

            const focus = document.getElementById('score_focus');
            if (focus) focus.textContent = weakWords.length ? `需要加强：${weakWords.slice(0, 6).join('、')}` : '每个字都读得很准确';

            // 准备传给 AI 的分析数据
            let analysisRequestData = {};

            if (selectedMode === '读段落') {
                // 段落模式：包含整体分数，简化 Words 数据（避免 Token 过长）
                analysisRequestData = {
                    TotalScore: jsonData.result.SuggestedScore,
                    Accuracy: jsonData.result.PronAccuracy,
                    Fluency: jsonData.result.PronFluency * 100,
                    Integrity: jsonData.result.PronCompletion * 100,
                    Words: jsonData.result.Words.map(item => ({
                        Word: item.Word,
                        PronAccuracy: item.PronAccuracy
                    }))
                };
            } else {
                // 句子/汉字模式：包含整体分数和详细的音素信息
                analysisRequestData = {
                    TotalScore: jsonData.result.SuggestedScore,
                    Accuracy: jsonData.result.PronAccuracy,
                    Fluency: jsonData.result.PronFluency * 100,
                    Integrity: jsonData.result.PronCompletion * 100,
                    Words: jsonData.result.Words.map(item => ({
                        Word: item.Word,
                        PronAccuracy: item.PronAccuracy,
                        PhoneInfos: item.PhoneInfos ? item.PhoneInfos.map(phoneItem => ({
                            Phone: phoneItem.Phone,
                            PronAccuracy: phoneItem.PronAccuracy
                        })) : [],
                        Tone: item.Tone
                    }))
                };
            }

            const jsonString = JSON.stringify(analysisRequestData, null, 2);

            if (isFinal) {
                this.saveEvaluation({
                    accuracy: jsonData.result.PronAccuracy,
                    fluency: jsonData.result.PronFluency * 100,
                    completeness: jsonData.result.PronCompletion * 100,
                    initialSoundScore: initialScore,
                    finalSoundScore: finalScore,
                    toneScore: toneScore,
                    totalScore: jsonData.result.SuggestedScore
                }, jsonString);
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

    async connectWebSocket() {
        if (['CONNECTING', 'OPEN', 'CLOSING'].includes(this.btnStatus)) return;
        // RecorderManager shares a worker; don't overlap an unresolved microphone prompt with a new start.
        if (this.pendingRecorderStart) {
            this.showRecordingStatus('请先处理浏览器的麦克风权限提示');
            return;
        }
        if (!document.getElementById('evalText').innerText.trim()) {
            this.showRecordingStatus('请输入朗读内容');
            document.getElementById('evalText').focus();
            return;
        }
        if (!LegacyContent.getUser()) {
            this.showRecordingStatus('请先登录后开始录音', true);
            return;
        }
        const attempt = { active: true, recorder: new RecorderManager('dist'), started: false, stopping: false, final: false };
        const current = () => attempt.active && this.activeRecording === attempt;
        this.activeRecording = attempt;
        this.recorder = attempt.recorder;
        this.bindRecorder(attempt);
        this.changeBtnStatus("CONNECTING");
        this.showRecordingStatus('');
        this.showSaveStatus('');
        try {
            const websocketUrl = await this.getWebSocketUrl();
            if (!current()) return;
            if ("WebSocket" in window) {
                attempt.socket = this.iseWS = new WebSocket(websocketUrl);
            } else {
                throw new Error("浏览器不支持WebSocket");
            }
            attempt.socket.onopen = async () => {
                if (!current()) return;
                this.pendingRecorderStart = attempt;
                try {
                    // The legacy recorder logs permission failures instead of rejecting.
                    await attempt.recorder.start({ sampleRate: 16000, frameSize: 1280 });
                    if (current() && !attempt.started) {
                        throw new Error('无法启动麦克风，请检查浏览器权限和输入设备');
                    }
                } catch (error) {
                    if (!current()) return;
                    this.showRecordingStatus(error.message || '无法启动麦克风，请重试');
                    this.finishRecording(attempt);
                } finally {
                    if (this.pendingRecorderStart === attempt) this.pendingRecorderStart = null;
                }
            };

            attempt.socket.onmessage = (e) => {
                if (!current()) return;
                let data;
                try { data = JSON.parse(e.data); } catch { this.showRecordingStatus('评测服务返回格式异常'); this.finishRecording(attempt); return; }
                if (data.code && data.code !== 0) {
                    this.showRecordingStatus('评测失败：' + (data.message || '请重新录音'));
                    this.finishRecording(attempt);
                    return;
                }
                const isFinal = data.final === 1;
                this.renderResult(e.data, isFinal);

                if (isFinal) {
                    attempt.final = true;
                    this.finishRecording(attempt);
                }
            };

            attempt.socket.onerror = () => {
                if (!current()) return;
                this.showRecordingStatus('评测连接中断，请重新录音');
                this.finishRecording(attempt);
            };
            attempt.socket.onclose = () => {
                if (!current()) return;
                if (!attempt.final) this.showRecordingStatus('连接已结束，未收到完整测评结果，请重试');
                this.finishRecording(attempt);
            };
        } catch (error) {
            if (!current()) return;
            this.showRecordingStatus('连接服务失败：' + (error.message || '请稍后重试'), LegacyContent.isAuthError(error));
            this.finishRecording(attempt);
        }
    }
}

if (typeof window !== 'undefined') window.SpeechEvalModule = SpeechEvalModule;
if (typeof module !== 'undefined' && module.exports) module.exports = SpeechEvalModule;
