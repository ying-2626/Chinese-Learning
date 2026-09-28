class ChatbotModule {
    constructor() {
        this.container = document.getElementById('chat-bot');
        this.currentSessionId = null;
        this.currentChatId = null;
        this.sessions = [];
        this.sending = false;
        this.loadingMessages = false;
        this.authRequired = false;
        this.sessionRequest = 0;
        if (!this.container) return;
        this.renderLayout();
        this.bindEvents();
        this.loadSessions();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="chat-layout">
                <aside class="chat-sidebar">
                    <button class="chat-new-btn" id="chatNewBtn" type="button"><i class="ph ph-plus"></i> 新建对话</button>
                    <div class="chat-session-list" id="chatSessionList"></div>
                </aside>
                <div class="chat-main">
                    <div class="chat-status" id="chatStatus" role="status" aria-live="polite"></div>
                    <div class="chat-messages" id="chatMessages" aria-label="对话消息"></div>
                    <form class="chat-input-area">
                        <div class="input-container">
                            <textarea class="chat-input" id="chatInput" placeholder="Please input your question..." aria-label="输入消息"></textarea>
                            <button type="submit" class="chat-send-btn" id="chatSendBtn" aria-label="发送">
                                <img src="img/纸飞机（灰色版）.png" alt="">
                            </button>
                            <div class="pleaseinput" style="display:none;">请输入你的问题</div>
                        </div>
                    </form>
                </div>
            </div>`;
        this.messagesContainer = document.getElementById('chatMessages');
        this.inputEl = document.getElementById('chatInput');
        this.sendBtnEl = document.getElementById('chatSendBtn');
        this.sendIcon = this.sendBtnEl.querySelector('img');
        this.newBtn = document.getElementById('chatNewBtn');
        this.sessionListEl = document.getElementById('chatSessionList');
        this.statusEl = document.getElementById('chatStatus');
        this.appendMessage('assistant', '请输入你的问题，输入问题后，AI将给出答案');
    }

    bindEvents() {
        this.container.querySelector('form').addEventListener('submit', event => {
            event.preventDefault();
            this.sendMessage();
        });
        this.inputEl.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
                event.preventDefault();
                this.sendMessage();
            }
        });
        this.inputEl.addEventListener('input', () => this.updateControls());
        this.newBtn.addEventListener('click', () => this.createNewSession());
        this.updateControls();
    }

    async request(path, method = 'get', data) {
        const response = await axios({
            url: CONFIG.BACKEND_API + path,
            method, data,
            headers: LegacyContent.headers(data !== undefined),
            withCredentials: true
        });
        return LegacyContent.result(response);
    }

    updateControls() {
        const signedIn = Boolean(LegacyContent.getUser()) && !this.authRequired;
        this.sendBtnEl.disabled = !signedIn || this.sending || this.loadingMessages || !this.inputEl.value.trim();
        this.inputEl.disabled = this.sending;
        this.newBtn.disabled = !signedIn || this.sending;
        this.sessionListEl.querySelectorAll('button').forEach(button => { button.disabled = !signedIn || this.sending; });
        this.sendIcon.src = this.inputEl.value.trim() ? 'img/纸飞机（彩色版）.png' : 'img/纸飞机（灰色版）.png';
    }

    showError(error, retry) {
        this.statusEl.replaceChildren();
        const message = document.createElement('span');
        message.textContent = error?.message || '连接失败，请稍后重试';
        this.statusEl.append(message);
        if (LegacyContent.isAuthError(error) || !LegacyContent.getUser() || this.authRequired) {
            this.authRequired = true;
            this.updateControls();
            const login = document.createElement('a');
            login.href = 'login.html';
            login.textContent = '前往登录';
            this.statusEl.append(login);
        } else if (retry) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = '重试';
            button.addEventListener('click', retry);
            this.statusEl.append(button);
        }
    }

    async loadSessions() {
        if (!LegacyContent.getUser()) {
            this.sessionListEl.textContent = '';
            this.showError(new Error('请先登录后使用此功能'));
            this.updateControls();
            return;
        }
        this.authRequired = false;
        this.statusEl.textContent = '';
        this.sessionListEl.textContent = '加载中...';
        try {
            const sessions = await this.request('/chat/sessions');
            if (!Array.isArray(sessions)) throw new Error('对话列表格式异常，请重试');
            this.sessions = sessions;
            this.renderSessionList();
            if (sessions.length) await this.switchSession(sessions[0].id);
        } catch (error) {
            this.sessionListEl.textContent = '';
            this.showError(error, () => this.loadSessions());
        } finally {
            this.updateControls();
        }
    }

    renderSessionList() {
        this.sessionListEl.replaceChildren();
        if (!this.sessions.length) {
            this.sessionListEl.textContent = '暂无对话';
            return;
        }
        this.sessions.forEach(session => {
            const row = document.createElement('div');
            row.className = 'chat-session-item' + (session.id === this.currentSessionId ? ' active' : '');
            const select = document.createElement('button');
            select.type = 'button';
            select.className = 'chat-session-title';
            select.textContent = session.title || '新对话';
            select.title = session.title || '新对话';
            select.setAttribute('aria-pressed', String(session.id === this.currentSessionId));
            select.addEventListener('click', () => this.switchSession(session.id));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'chat-session-delete';
            remove.setAttribute('aria-label', '删除对话');
            remove.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i>';
            remove.addEventListener('click', () => this.deleteSession(session.id));
            row.append(select, remove);
            this.sessionListEl.append(row);
        });
        this.updateControls();
    }

    async switchSession(sessionId) {
        if (this.sending) return;
        const session = this.sessions.find(item => item.id === sessionId);
        if (!session) return;
        const requestVersion = ++this.sessionRequest;
        this.currentSessionId = sessionId;
        this.currentChatId = session.chatId;
        this.loadingMessages = true;
        this.renderSessionList();
        this.messagesContainer.textContent = '加载中...';
        this.statusEl.textContent = '';
        try {
            const messages = await this.request('/chat/sessions/' + sessionId + '/messages');
            if (requestVersion !== this.sessionRequest) return;
            if (!Array.isArray(messages)) throw new Error('消息格式异常，请重试');
            this.messagesContainer.replaceChildren();
            messages.forEach(message => {
                if (['user', 'assistant'].includes(message.role)) this.appendMessage(message.role, message.content);
            });
        } catch (error) {
            if (requestVersion !== this.sessionRequest) return;
            this.messagesContainer.replaceChildren();
            this.showError(error, () => this.switchSession(sessionId));
        } finally {
            if (requestVersion === this.sessionRequest) {
                this.loadingMessages = false;
                this.updateControls();
            }
        }
    }

    appendMessage(role, content) {
        const message = document.createElement('div');
        message.className = 'message ' + (role === 'user' ? 'user-message' : 'ai-message');
        const bubble = document.createElement('div');
        bubble.className = 'p1';
        if (role === 'assistant') bubble.innerHTML = LegacyContent.markdown(content);
        else bubble.textContent = content;
        message.append(bubble);
        this.messagesContainer.append(message);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return message;
    }

    async createNewSession() {
        if (this.sending) return;
        this.newBtn.disabled = true;
        try {
            const session = await this.request('/chat/sessions', 'post', { title: '新对话' });
            if (!session?.id || !session.chatId) throw new Error('创建对话失败，请重试');
            this.sessions.unshift(session);
            await this.switchSession(session.id);
        } catch (error) {
            this.showError(error, () => this.createNewSession());
        } finally {
            this.updateControls();
        }
    }

    async deleteSession(sessionId) {
        if (this.sending) return;
        try {
            await this.request('/chat/sessions/' + sessionId, 'delete');
            this.sessions = this.sessions.filter(session => session.id !== sessionId);
            if (this.currentSessionId === sessionId) {
                ++this.sessionRequest;
                this.currentSessionId = null;
                this.currentChatId = null;
                this.messagesContainer.replaceChildren();
                if (this.sessions.length) await this.switchSession(this.sessions[0].id);
            }
            this.renderSessionList();
        } catch (error) {
            this.showError(error, () => this.deleteSession(sessionId));
        }
    }

    async sendMessage() {
        const content = this.inputEl.value.trim();
        if (!content || this.sending || this.loadingMessages) return;
        if (!LegacyContent.getUser() || this.authRequired) {
            this.showError(new Error('请先登录后使用此功能'));
            this.updateControls();
            return;
        }
        this.sending = true;
        this.statusEl.textContent = '';
        this.updateControls();
        let thinking;
        let userSaved = false;
        let answerReceived = false;
        try {
            if (!this.currentSessionId) {
                const session = await this.request('/chat/sessions', 'post', { title: '新对话' });
                if (!session?.id || !session.chatId) throw new Error('创建对话失败，请重试');
                this.sessions.unshift(session);
                this.currentSessionId = session.id;
                this.currentChatId = session.chatId;
                this.messagesContainer.replaceChildren();
                this.renderSessionList();
            }
            // Capture the destination before any asynchronous provider call.
            const sessionId = this.currentSessionId;
            const chatId = this.currentChatId;
            await this.request('/chat/sessions/' + sessionId + '/messages', 'post', { role: 'user', content });
            userSaved = true;
            this.appendMessage('user', content);
            thinking = this.appendMessage('assistant', '思考中……');
            const result = await this.request('/api/fastgpt/chat/completions', 'post', {
                chatId, stream: false, detail: false, messages: [{ content, role: 'user' }]
            });
            const answer = result?.choices?.[0]?.message?.content;
            if (typeof answer !== 'string' || !answer.trim()) throw new Error('AI 未返回有效回复，请重试');
            thinking.remove();
            thinking = null;
            this.appendMessage('assistant', answer);
            answerReceived = true;
            await this.request('/chat/sessions/' + sessionId + '/messages', 'post', { role: 'assistant', content: answer });
            const session = this.sessions.find(item => item.id === sessionId);
            if (session?.title === '新对话') {
                const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
                await this.request('/chat/sessions/' + sessionId, 'put', { title });
                session.title = title;
                this.renderSessionList();
            }
            this.inputEl.value = '';
        } catch (error) {
            if (thinking) thinking.remove();
            const errorCode = LegacyContent.isAuthError(error) ? 1013 : error.code;
            if (answerReceived) error = new Error('回复已生成，但对话保存未完成：' + error.message);
            else if (userSaved) error = new Error('消息已保存，回复失败：' + error.message);
            error.code = errorCode;
            this.showError(error);
        } finally {
            this.sending = false;
            this.updateControls();
            this.inputEl.focus();
        }
    }
}

if (typeof window !== 'undefined') window.ChatbotModule = ChatbotModule;
if (typeof module !== 'undefined' && module.exports) module.exports = ChatbotModule;
