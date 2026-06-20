class ChatbotModule {
    constructor() {
        this.chatItem = document.querySelector(".chat-item");
        this.currentSessionId = null;
        this.currentChatId = null;
        this.sessions = [];
        this.init();
    }

    init() {
        if (!this.chatItem) return;
        this.renderLayout();
        this.bindEvents();
        this.loadSessions();
    }

    getHeaders() {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        return { 'Content-Type': 'application/json', 'session': userInfo.sessionId };
    }

    renderLayout() {
        const container = this.chatItem.closest('.module') || this.chatItem.parentElement;
        if (!container) return;

        container.innerHTML = `
            <div class="chat-layout">
                <div class="chat-sidebar" id="chatSidebar">
                    <div class="chat-sidebar-header">
                        <button class="chat-new-btn" id="chatNewBtn">
                            <i class="ph ph-plus"></i> 新建对话
                        </button>
                    </div>
                    <div class="chat-session-list" id="chatSessionList">
                        <div class="chat-empty-tip">暂无对话</div>
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-input-area">
                        <div class="input-container">
                            <input type="text" class="chat-input" id="chatInput" placeholder="输入消息..." />
                            <img src="img/纸飞机（灰色版）.png" alt="发送" class="chat-send-btn" id="chatSendBtn" />
                            <div class="pleaseinput" style="display:none;">请输入内容</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer = document.getElementById('chatMessages');
        this.inputEl = document.getElementById('chatInput');
        this.sendBtnEl = document.getElementById('chatSendBtn');
        this.sessionListEl = document.getElementById('chatSessionList');
    }

    bindEvents() {
        this.sendBtnEl.addEventListener('click', () => this.sendMessage());

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.inputEl.addEventListener('input', () => {
            if (this.inputEl.value.trim().length > 0) {
                this.sendBtnEl.src = "img/纸飞机（彩色版）.png";
            } else {
                this.sendBtnEl.src = "img/纸飞机（灰色版）.png";
            }
        });

        this.sendBtnEl.addEventListener('mouseover', () => {
            if (!this.inputEl.value.trim()) {
                const tip = this.sendBtnEl.parentElement.querySelector('.pleaseinput');
                if (tip) tip.style.display = 'block';
            }
        });

        this.sendBtnEl.addEventListener('mouseout', () => {
            const tip = this.sendBtnEl.parentElement.querySelector('.pleaseinput');
            if (tip) tip.style.display = 'none';
        });

        document.getElementById('chatNewBtn').addEventListener('click', () => this.createNewSession());
    }

    async loadSessions() {
        try {
            const resp = await axios({
                url: CONFIG.BACKEND_API + '/chat/sessions',
                method: 'get',
                headers: this.getHeaders(),
                withCredentials: true
            });
            if (resp.data.code === 0) {
                this.sessions = resp.data.result || [];
                this.renderSessionList();
                if (this.sessions.length > 0) {
                    this.switchSession(this.sessions[0].id);
                }
            }
        } catch (e) {
            console.error('加载会话列表失败:', e);
        }
    }

    renderSessionList() {
        if (this.sessions.length === 0) {
            this.sessionListEl.innerHTML = '<div class="chat-empty-tip">暂无对话</div>';
            return;
        }

        this.sessionListEl.innerHTML = this.sessions.map(s => `
            <div class="chat-session-item ${s.id === this.currentSessionId ? 'active' : ''}" data-id="${s.id}">
                <span class="chat-session-title" title="${s.title}">${s.title}</span>
                <button class="chat-session-delete" data-id="${s.id}" title="删除">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `).join('');

        this.sessionListEl.querySelectorAll('.chat-session-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.chat-session-delete')) return;
                this.switchSession(parseInt(el.dataset.id));
            });
        });

        this.sessionListEl.querySelectorAll('.chat-session-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(parseInt(btn.dataset.id));
            });
        });
    }

    async switchSession(sessionId) {
        this.currentSessionId = sessionId;
        const session = this.sessions.find(s => s.id === sessionId);
        this.currentChatId = session ? session.chatId : null;

        this.renderSessionList();
        this.messagesContainer.innerHTML = '<div class="chat-loading">加载中...</div>';

        try {
            const resp = await axios({
                url: CONFIG.BACKEND_API + '/chat/sessions/' + sessionId + '/messages',
                method: 'get',
                headers: this.getHeaders(),
                withCredentials: true
            });
            if (resp.data.code === 0) {
                const messages = resp.data.result || [];
                this.renderMessages(messages);
            }
        } catch (e) {
            console.error('加载消息失败:', e);
            this.messagesContainer.innerHTML = '';
        }
    }

    renderMessages(messages) {
        this.messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            if (msg.role === 'user') {
                this.appendUserMessage(msg.content, false);
            } else if (msg.role === 'assistant') {
                this.appendAssistantMessage(msg.content, false);
            }
        });
        this.scrollToBottom();
    }

    appendUserMessage(content, scroll = true) {
        const html = `<div class="message user-message"><div class="p1">${this.escapeHtml(content)}</div></div>`;
        this.messagesContainer.insertAdjacentHTML('beforeend', html);
        if (scroll) this.scrollToBottom();
    }

    appendAssistantMessage(content, scroll = true) {
        const parsed = typeof marked !== 'undefined' ? marked.parse(content) : this.escapeHtml(content);
        const html = `<div class="message ai-message"><div class="p1">${parsed}</div></div>`;
        this.messagesContainer.insertAdjacentHTML('beforeend', html);
        if (scroll) this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async createNewSession() {
        try {
            const resp = await axios({
                url: CONFIG.BACKEND_API + '/chat/sessions',
                method: 'post',
                data: { title: '新对话' },
                headers: this.getHeaders(),
                withCredentials: true
            });
            if (resp.data.code === 0) {
                const session = resp.data.result;
                this.sessions.unshift(session);
                this.switchSession(session.id);
            }
        } catch (e) {
            console.error('创建会话失败:', e);
        }
    }

    async deleteSession(sessionId) {
        try {
            const resp = await axios({
                url: CONFIG.BACKEND_API + '/chat/sessions/' + sessionId,
                method: 'delete',
                headers: this.getHeaders(),
                withCredentials: true
            });
            if (resp.data.code === 0) {
                this.sessions = this.sessions.filter(s => s.id !== sessionId);
                if (this.currentSessionId === sessionId) {
                    this.currentSessionId = null;
                    this.currentChatId = null;
                    this.messagesContainer.innerHTML = '';
                    if (this.sessions.length > 0) {
                        this.switchSession(this.sessions[0].id);
                    } else {
                        this.renderSessionList();
                    }
                } else {
                    this.renderSessionList();
                }
            }
        } catch (e) {
            console.error('删除会话失败:', e);
        }
    }

    async sendMessage() {
        const content = this.inputEl.value.trim();
        if (!content) return;

        if (!this.currentSessionId) {
            await this.createNewSession();
        }

        this.inputEl.value = '';
        this.sendBtnEl.src = "img/纸飞机（灰色版）.png";
        this.appendUserMessage(content);

        const thinkingId = "thinking-chat-" + Date.now();
        const thinkingHTML = `<div class="message ai-message" id="${thinkingId}"><div class="p1">思考中……</div></div>`;
        this.messagesContainer.insertAdjacentHTML('beforeend', thinkingHTML);
        this.scrollToBottom();

        try {
            const fastgptResp = await axios({
                url: `${CONFIG.BACKEND_API}/api/fastgpt/chat/completions`,
                method: 'post',
                data: JSON.stringify({
                    chatId: this.currentChatId || "111",
                    stream: false,
                    detail: false,
                    messages: [{ content: content, role: "user" }]
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = fastgptResp.data;
            if (data.code !== 0) throw new Error(data.message || '请求失败');

            const aiContent = data.result.choices[0].message.content;

            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();
            this.appendAssistantMessage(aiContent);

            axios({
                url: CONFIG.BACKEND_API + '/chat/sessions/' + this.currentSessionId + '/messages',
                method: 'post',
                data: { role: 'user', content: content },
                headers: this.getHeaders(),
                withCredentials: true
            }).catch(() => {});

            axios({
                url: CONFIG.BACKEND_API + '/chat/sessions/' + this.currentSessionId + '/messages',
                method: 'post',
                data: { role: 'assistant', content: aiContent },
                headers: this.getHeaders(),
                withCredentials: true
            }).catch(() => {});

            if (this.sessions[0] && this.sessions[0].id === this.currentSessionId && this.sessions[0].title === '新对话') {
                const title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
                this.sessions[0].title = title;
                axios({
                    url: CONFIG.BACKEND_API + '/chat/sessions/' + this.currentSessionId,
                    method: 'put',
                    data: { title: title },
                    headers: this.getHeaders(),
                    withCredentials: true
                }).catch(() => {});
                this.renderSessionList();
            }

        } catch (err) {
            console.error('发送消息失败:', err);
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) {
                thinkingEl.innerHTML = '<div class="p1" style="color:#666">抱歉，获取回复失败，请稍后重试。</div>';
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.ChatbotModule = ChatbotModule;
