class HistoryModule {
    constructor() {
        this.container = document.querySelector("#history .history-container");
        this.init();
    }

    init() {
        if (!this.container) return;
        this.loadHistory();
    }

    async loadHistory() {
        if (!LegacyContent.getUser()) { this.renderNotLoggedInState(); return; }
        // 请求较快时直接显示结果；超过 400ms 才提示加载中，避免一闪而过的中间态。
        const slow = setTimeout(() => { this.container.innerHTML = '<div class="loading-spinner">加载中...</div>'; }, 400);
        try {
            const scoreActions = await ScoreService.findCurrentUserScoreActions();
            if (scoreActions.length === 0) { this.renderEmptyState(); return; }
            this.renderHistoryList(scoreActions);
        } catch (error) {
            if (LegacyContent.isAuthError(error)) { this.renderNotLoggedInState(); return; }
            this.container.innerHTML = '<div class="history-load-error"><p></p><button class="retry-btn">重试</button></div>';
            this.container.querySelector('p').textContent = '记录加载失败：' + (error.message || '请检查连接后重试');
            this.container.querySelector('button').onclick = () => this.loadHistory();
        } finally {
            clearTimeout(slow);
        }
    }

    renderNotLoggedInState() {
        this.container.innerHTML = `
            <div class="not-logged-in-state">
                <i class="ph ph-user-circle" style="font-size: 64px; color: #12b4e3; margin-bottom: 20px;"></i>
                <h3>未登录状态</h3>
                <p>请先登录后查看历史记录</p>
                <button class="login-btn" onclick="window.location.href='login.html'">
                    <i class="ph ph-sign-in"></i>
                    前往登录
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <p>暂无评测记录</p>
                <button class="start-evaluation">去评测</button>
            </div>
        `;
        this.container.querySelector('.start-evaluation').onclick = () => {
            document.querySelector('#sidebar [data-id="speech-evaluation"]')?.click();
        };
    }

    renderHistoryList(actions) {
        // Sort by ID descending (assuming higher ID is newer) as we don't have createTime
        const sortedActions = actions.slice().sort((a, b) => b.id - a.id);

        let html = `
            <div class="history-header">
                <h2>评测记录</h2>
                <span class="badge" style="background: #e9ecef; padding: 5px 10px; border-radius: 20px; color: #495057; font-size: 0.9em;">${actions.length} 条记录</span>
            </div>
            <div class="history-list">
        `;

        sortedActions.forEach((action, index) => {
            html += this.createHistoryCard(action, index);
        });

        html += '</div>';
        this.container.innerHTML = html;
    }

    createHistoryCard(action, index) {
        const scoreColor = this.getScoreColor(action.totalScore);
        const advice = LegacyContent.markdown(action.advice || '暂无建议');
        const audioUrl = this.audioUrl(action.audioUrl);

        return `
            <div class="history-card">
                <div class="card-header">
                    <div class="record-info">
                        <span class="record-id">#${LegacyContent.escapeHtml(action.id)}</span>
                        <span class="record-type">语音评测</span>
                    </div>
                    <div class="total-score" style="color: ${scoreColor}">
                        <span class="score-value">${this.score(action.totalScore).toFixed(1)}</span>
                        <span class="score-label">总分</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">准确度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.score(action.accuracy)}%; background-color: ${this.getScoreColor(action.accuracy)}"></div>
                            </div>
                            <span class="metric-value">${this.score(action.accuracy).toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">流畅度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.score(action.fluency)}%; background-color: ${this.getScoreColor(action.fluency)}"></div>
                            </div>
                            <span class="metric-value">${this.score(action.fluency).toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">完整度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.score(action.completeness)}%; background-color: ${this.getScoreColor(action.completeness)}"></div>
                            </div>
                            <span class="metric-value">${this.score(action.completeness).toFixed(1)}</span>
                        </div>
                    </div>

                    <div class="sub-scores">
                    <span>声母: <strong>${this.score(action.initialSoundScore).toFixed(1)}</strong></span>
                    <span>韵母: <strong>${this.score(action.finalSoundScore).toFixed(1)}</strong></span>
                    <span>声调: <strong>${this.score(action.toneScore).toFixed(1)}</strong></span>
                </div>

                    <div class="advice-section">
                        <div class="advice-title">💡 改进建议</div>
                        <div class="advice-content">${advice}</div>
                    </div>

                    ${audioUrl ? `
                        <div class="audio-player">
                            <audio controls src="${LegacyContent.escapeHtml(audioUrl)}"></audio>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    score(value) {
        return Math.max(0, Math.min(100, Number(value) || 0));
    }

    audioUrl(value) {
        if (typeof value !== 'string' || !value) return '';
        try {
            const url = new URL(value, window.location.href);
            if (!['https:', 'http:'].includes(url.protocol)) return '';
            // Preserve same-origin relative audio paths returned by the current backend.
            return value;
        } catch { return ''; }
    }

    getScoreColor(score) {
        if (score >= 90) return '#28a745'; // Green
        if (score >= 80) return '#17a2b8'; // Cyan
        if (score >= 60) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    }
}

if (typeof window !== 'undefined') window.HistoryModule = HistoryModule;
if (typeof module !== 'undefined' && module.exports) module.exports = HistoryModule;