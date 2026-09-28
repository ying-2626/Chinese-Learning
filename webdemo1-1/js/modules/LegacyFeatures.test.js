const test = require('node:test');
const assert = require('node:assert/strict');
const LegacyContent = require('./LegacyContent.js');
const Chatbot = require('./Chatbot.js');
const CustomLearning = require('./CustomLearning.js');
const History = require('./History.js');
const SpeechEval = require('./SpeechEval.js');
const ScoreService = require('../services/scoreService.js');

let store;
test.beforeEach(() => {
    store = new Map();
    global.localStorage = {getItem:key => store.get(key) ?? null, setItem:(key,value) => store.set(key,value)};
    global.window = {location:{href:'http://localhost:4193/index.html'}};
    global.LegacyContent = LegacyContent;
    global.ScoreService = ScoreService;
    global.CONFIG = {BACKEND_API:'http://localhost:4193'};
    global.axios = async () => { throw new Error('Unexpected network request'); };
    store.set('user_info', JSON.stringify({id:7,sessionId:'local-test-session'}));
});
function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return {promise,resolve};
}
function chatFixture() {
    const chat = Object.create(Chatbot.prototype);
    Object.assign(chat, {
        inputEl:{value:'你好',focus() {}}, statusEl:{textContent:''}, messagesContainer:{replaceChildren() {}},
        sending:false, loadingMessages:false, currentSessionId:7, currentChatId:'chat-7',
        sessions:[{id:7,title:'已有对话',chatId:'chat-7'}], appended:[], errors:[],
        updateControls(){}, renderSessionList(){},
        appendMessage(role,content) { const item={role,content}; this.appended.push(item); return {remove(){item.removed=true;}}; },
        showError(error) { this.errors.push(error); }
    });
    return chat;
}
test('HTTP success with a failed business code must not mark a score as saved', async () => {
    global.axios = async () => ({data:{code:1013,message:'登录已过期'}});
    await assert.rejects(ScoreService.createScoreAction({totalScore:80}), error => error.code === 1013);
});
test('unauthenticated score request stops before the network and malformed record lists reject', async () => {
    store.delete('user_info');
    await assert.rejects(ScoreService.findCurrentUserScoreActions(), /请先登录/);
    store.set('user_info',JSON.stringify({id:7,sessionId:'test'}));
    global.axios = async () => ({data:{code:0,result:{unexpected:true}}});
    await assert.rejects(ScoreService.findCurrentUserScoreActions(), /格式异常/);
});
test('a failed session create preserves input and never displays a saved message', async () => {
    const chat = chatFixture(); chat.currentSessionId = null;
    const calls = [];
    chat.request = async path => { calls.push(path); throw new Error('连接失败'); };
    await chat.sendMessage();
    assert.deepEqual(calls,['/chat/sessions']);
    assert.equal(chat.inputEl.value,'你好');
    assert.equal(chat.appended.length,0);
    assert.match(chat.errors[0].message,/连接失败/);
    assert.equal(chat.sending,false);
});
test('a failed user-message save never invokes the provider', async () => {
    const chat = chatFixture(); const calls=[];
    chat.request = async path => { calls.push(path); throw new Error('保存失败'); };
    await chat.sendMessage();
    assert.deepEqual(calls,['/chat/sessions/7/messages']);
    assert.equal(chat.inputEl.value,'你好');
    assert.equal(chat.appended.length,0);
});
test('in-flight conversation cannot switch and both messages persist to the captured session', async () => {
    const chat = chatFixture(); const provider = deferred(); const calls=[];
    chat.request = async (path,method,data) => {
        calls.push({path,method,data});
        if (path.startsWith('/api/')) return provider.promise;
        return {id:12};
    };
    const sending = chat.sendMessage();
    await Promise.resolve(); await Promise.resolve();
    await chat.switchSession(99);
    assert.equal(chat.currentSessionId,7);
    provider.resolve({choices:[{message:{content:'你好！'}}]});
    await sending;
    const writes=calls.filter(call=>call.path.endsWith('/messages'));
    assert.deepEqual(writes.map(call=>[call.path,call.data.role]),[
        ['/chat/sessions/7/messages','user'],['/chat/sessions/7/messages','assistant']
    ]);
    assert.equal(chat.errors.length,0);
});
test('provider and persistence failures are explicit instead of fabricated assistant success', async () => {
    const chat = chatFixture();
    chat.request = async path => {
        if (path.startsWith('/api/')) throw new Error('FastGPT 未配置');
        return {id:1};
    };
    await chat.sendMessage();
    assert.match(chat.errors[0].message,/消息已保存，回复失败.*未配置/);
    const other = chatFixture();
    other.request = async (path,method,data) => {
        if (path.startsWith('/api/')) return {choices:[{message:{content:'答复'}}]};
        if (data.role === 'assistant') throw new Error('数据库断开');
        return {id:1};
    };
    await other.sendMessage();
    assert.match(other.errors[0].message,/回复已生成，但对话保存未完成/);
});
test('Enter respects IME composition and Shift+Enter', () => {
    const handlers={}; let sends=0;
    const chat=Object.create(Chatbot.prototype);
    Object.assign(chat,{container:{querySelector:()=>({addEventListener(){}})}, inputEl:{addEventListener:(name,fn)=>handlers[name]=fn},newBtn:{addEventListener(){}},updateControls(){},sendMessage(){sends++;}});
    chat.bindEvents();
    const event={key:'Enter',preventDefault(){}};
    handlers.keydown({...event,isComposing:true});
    handlers.keydown({...event,shiftKey:true});
    handlers.keydown({...event,keyCode:229});
    assert.equal(sends,0);
    handlers.keydown(event);
    assert.equal(sends,1);
});
test('reports persist per user and discard provider results if the account changes', async () => {
    const learning=Object.create(CustomLearning.prototype);
    Object.assign(learning,{generating:false,profile:{},scoreActions:[{totalScore:80,accuracy:81,fluency:82,completeness:83}],reports:[],renderPage(){this.rendered=true;}});
    assert.notEqual(learning.reportStorageKey({id:7}),learning.reportStorageKey({id:8}));
    const area={innerHTML:'',firstElementChild:{textContent:''}};
    global.document={getElementById:()=>area};
    const provider=deferred(); global.axios=()=>provider.promise;
    const pending=learning.generateReport();
    store.set('user_info',JSON.stringify({id:8,sessionId:'other-test-session'}));
    provider.resolve({data:{code:0,result:{choices:[{message:{content:'第一位用户的报告'}}]}}});
    await pending;
    assert.equal(store.has('analysis_reports:7'),false);
    assert.equal(store.has('analysis_reports:8'),false);
    global.axios=async()=>({data:{code:0,result:{choices:[{message:{content:'第二位用户的报告'}}]}}});
    await learning.generateReport();
    assert.match(store.get('analysis_reports:8'),/第二位用户/);
    assert.equal(store.has('analysis_reports'),false);
});
test('history shows connectivity failures separately from unauthenticated state', async () => {
    const history=Object.create(History.prototype);
    const paragraph={textContent:''}, button={};
    Object.assign(history,{container:{innerHTML:'',querySelector:selector=>selector==='p'?paragraph:button},renderNotLoggedInState(){this.unauth=true;}});
    store.delete('user_info');
    await history.loadHistory(); assert.equal(history.unauth,true);
    history.unauth=false;
    store.set('user_info',JSON.stringify({id:7,sessionId:'test'}));
    global.axios=async()=>{throw new Error('Network Error');};
    await history.loadHistory();
    assert.equal(history.unauth,false);
    assert.match(paragraph.textContent,/记录加载失败.*Network Error/);
    assert.equal(typeof button.onclick,'function');
    assert.equal(history.audioUrl('/audios/local.wav'),'/audios/local.wav');
    assert.equal(history.audioUrl('javascript:alert(1)'),'');
});
test('old feedback cannot overwrite the next recording feedback', async () => {
    const speech=Object.create(SpeechEval.prototype);
    const suggestion={value:'',disabled:false};
    Object.assign(speech,{suggestionBox:suggestion,feedbackGeneration:0,feedbackSpeech:null,updateFeedbackSpeechUi(){}});
    global.document={querySelector:selector=>selector==='.suggestion-box'?suggestion:null};
    const provider=deferred(); global.axios=()=>provider.promise;
    const pending=speech.getAnalysis('{}');
    speech.prepareForNewFeedback('新录音'); suggestion.value='新的录音状态';
    provider.resolve({data:{code:0,result:{choices:[{message:{content:'旧的反馈'}}]}}});
    assert.equal(await pending,'旧的反馈');
    assert.equal(suggestion.value,'新的录音状态');
});
test('plain text fallback escapes stored and generated HTML', () => {
    assert.equal(LegacyContent.markdown('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.equal(LegacyContent.safeUrl('javascript:alert(1)'),'');
    assert.equal(LegacyContent.isAuthError(new Error('Network Error')),false);
});

function chatControlsFixture() {
    const element = () => ({
        children: [], textContent: '',
        append(child) { this.children.push(child); },
        replaceChildren() { this.children = []; },
        addEventListener() {}, querySelectorAll() { return []; }
    });
    global.document = {createElement: element};
    const chat = chatFixture();
    Object.assign(chat, {
        statusEl: element(), sessionListEl: element(), sendBtnEl: {}, newBtn: {}, sendIcon: {},
        updateControls: Chatbot.prototype.updateControls, showError: Chatbot.prototype.showError
    });
    return chat;
}

test('guest chat loads no sessions and uses the existing login entry', async () => {
    store.delete('user_info');
    const chat = chatControlsFixture();
    let requests = 0;
    chat.request = async () => { requests++; throw new Error('502'); };
    await chat.loadSessions();
    await chat.sendMessage();
    assert.equal(requests, 0);
    assert.equal(chat.inputEl.value, '你好');
    assert.equal(chat.sendBtnEl.disabled, true);
    assert.equal(chat.newBtn.disabled, true);
    assert.equal(chat.statusEl.children.at(-1).href, 'login.html');
    assert.match(chat.statusEl.children[0].textContent, /请先登录/);
});

test('expired chat session shows login and disables sending instead of retrying with stale credentials', async () => {
    const chat = chatControlsFixture();
    global.axios = async () => ({data:{code:2004,message:'登录已过期'}});
    await chat.loadSessions();
    assert.equal(chat.authRequired, true);
    assert.equal(chat.sendBtnEl.disabled, true);
    assert.equal(chat.newBtn.disabled, true);
    assert.equal(chat.statusEl.children.at(-1).href, 'login.html');
});

test('provider failure keeps the chat draft and never invents an answer', async () => {
    const chat = chatFixture();
    chat.request = async path => {
        if (path.startsWith('/api/')) throw new Error('服务未配置');
        return {id: 1};
    };
    await chat.sendMessage();
    assert.equal(chat.inputEl.value, '你好');
    assert.equal(chat.appended.filter(item => item.role === 'assistant' && !item.removed).length, 0);
    assert.match(chat.errors[0].message, /消息已保存，回复失败/);
});

test('successful chat clears the draft only after both messages have persisted', async () => {
    const chat = chatFixture();
    chat.request = async (path, method, data) => {
        assert.equal(chat.inputEl.value, '你好');
        if (path.startsWith('/api/')) return {choices:[{message:{content:'答复'}}]};
        return {id: 1};
    };
    await chat.sendMessage();
    assert.equal(chat.inputEl.value, '');
    const failed = chatFixture();
    failed.request = async (path, method, data) => {
        if (path.startsWith('/api/')) return {choices:[{message:{content:'答复'}}]};
        if (data.role === 'assistant') throw new Error('保存失败');
        return {id:1};
    };
    await failed.sendMessage();
    assert.equal(failed.inputEl.value, '你好');
});

function speechSaveFixture() {
    const speech = Object.create(SpeechEval.prototype);
    Object.assign(speech, {
        feedbackGeneration: 0, audioChunks: [new Uint8Array([1, 2]).buffer], statuses: [],
        getAnalysis: async () => '实际生成的建议',
        showSaveStatus(message) { this.statuses.push(message); }
    });
    return speech;
}
const measuredScores = {accuracy:83, fluency:84, completeness:90, initialSoundScore:81, finalSoundScore:82, toneScore:80, totalScore:85};

test('advice failure preserves the measured scores and successfully uploaded recording', async () => {
    const speech = speechSaveFixture();
    speech.getAnalysis = async () => { throw new Error('AI 服务未配置'); };
    let saved;
    global.ScoreService = {
        async uploadAudioFile(blob) { assert.equal(blob.type, 'audio/wav'); return '/audios/recording.wav'; },
        async createScoreAction(data) { saved = data; return {id:3}; }
    };
    await speech.saveEvaluation(measuredScores, '{}');
    assert.deepEqual(saved, {...measuredScores, advice:null, audioUrl:'/audios/recording.wav'});
    assert.match(speech.statuses.at(-1), /评分和录音已保存.*AI 建议未生成.*未配置/);
});

test('audio failure preserves scores and available advice without claiming the recording was saved', async () => {
    const speech = speechSaveFixture();
    let saved;
    global.ScoreService = {
        async uploadAudioFile() { throw new Error('磁盘写入失败'); },
        async createScoreAction(data) { saved = data; return {id:3}; }
    };
    await speech.saveEvaluation(measuredScores, '{}');
    assert.deepEqual(saved, {...measuredScores, advice:'实际生成的建议', audioUrl:null});
    assert.match(speech.statuses.at(-1), /本次评分已保存.*录音未保存.*磁盘/);
});

test('two supplemental failures still save scores; persistence failure is never reported as saved', async () => {
    const speech = speechSaveFixture();
    speech.getAnalysis = async () => { throw new Error('建议失败'); };
    const writes = [];
    global.ScoreService = {
        async uploadAudioFile() { throw new Error('上传失败'); },
        async createScoreAction(data) { writes.push(data); return {id:3}; }
    };
    await speech.saveEvaluation(measuredScores, '{}');
    assert.deepEqual(writes, [{...measuredScores, advice:null, audioUrl:null}]);
    assert.match(speech.statuses.at(-1), /评分已保存.*AI 建议未生成.*录音未保存/);
    global.ScoreService.createScoreAction = async () => { throw new Error('数据库不可用'); };
    await speech.saveEvaluation(measuredScores, '{}');
    assert.match(speech.statuses.at(-1), /^本次评测未保存.*数据库/);
});

test('saving an older recording cannot overwrite a newer recording status or save under a different login', async () => {
    const speech = speechSaveFixture();
    const analysis = deferred();
    speech.getAnalysis = () => analysis.promise;
    let saves = 0;
    global.ScoreService = {async uploadAudioFile(){return '/audios/test.wav';}, async createScoreAction(){saves++;}};
    const pending = speech.saveEvaluation(measuredScores, '{}');
    speech.feedbackGeneration++;
    speech.showSaveStatus('新的录音状态');
    analysis.resolve('上一次的建议');
    await pending;
    assert.equal(saves, 1);
    assert.equal(speech.statuses.at(-1), '新的录音状态');

    const other = speechSaveFixture();
    const nextAnalysis = deferred();
    other.getAnalysis = () => nextAnalysis.promise;
    const otherPending = other.saveEvaluation(measuredScores, '{}');
    store.set('user_info', JSON.stringify({id:8,sessionId:'other-session'}));
    nextAnalysis.resolve('上一位用户的建议');
    await otherPending;
    assert.equal(saves, 1);
    assert.match(other.statuses.at(-1), /未保存.*登录状态已变化/);
});

test('recording button exposes actual lifecycle states to the motion layer', () => {
    const speech = Object.create(SpeechEval.prototype);
    speech.btnControl = {dataset:{},setAttribute(){}};
    global.document = {getElementById(){return null;},querySelectorAll(){return [];}};
    for (const [status, state, disabled] of [
        ['CONNECTING','connecting',true], ['OPEN','recording',false],
        ['CLOSING','closing',true], ['CLOSED','idle',false]
    ]) {
        speech.changeBtnStatus(status);
        assert.equal(speech.btnControl.dataset.state, state);
        assert.equal(speech.btnControl.disabled, disabled);
    }
});
