class HistoryModule {
    constructor() {
        this.container = document.getElementById("history");
        this.init();
    }

    init() {
        if (!this.container) return;
        this.loadHistory();
    }

    loadHistory() {
        this.container.innerHTML = '<div class="loading-spinner">加载中...</div>';

        if (typeof ScoreService === 'undefined') {
            this.container.innerHTML = '<div class="error-message">服务未初始化</div>';
            return;
        }

        ScoreService.findCurrentUserScoreActions()
            .then(scoreActions => {
                if (!scoreActions || scoreActions.length === 0) {
                    this.renderEmptyState();
                    return;
                }
                this.renderHistoryList(scoreActions);
            })
            .catch(error => {
                console.error("Failed to load history:", error);
                this.container.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
            });
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <img src="img/side_logo.png" alt="No Data" style="width: 100px; opacity: 0.5; filter: grayscale(100%);">
                <p>暂无评测记录</p>
                <button onclick="document.querySelector('[data-target=\\'speech-evaluation\\']').click()">去评测</button>
            </div>
        `;
    }

    renderHistoryList(actions) {
        // Sort by ID descending (assuming higher ID is newer) as we don't have createTime
        const sortedActions = actions.sort((a, b) => b.id - a.id);

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
        const advice = action.advice || '暂无建议';

        return `
            <div class="history-card">
                <div class="card-header">
                    <div class="record-info">
                        <span class="record-id">#${action.id}</span>
                        <span class="record-type">语音评测</span>
                    </div>
                    <div class="total-score" style="color: ${scoreColor}">
                        <span class="score-value">${action.totalScore.toFixed(1)}</span>
                        <span class="score-label">总分</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">准确度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${action.accuracy}%; background-color: ${this.getScoreColor(action.accuracy)}"></div>
                            </div>
                            <span class="metric-value">${action.accuracy.toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">流畅度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${action.fluency}%; background-color: ${this.getScoreColor(action.fluency)}"></div>
                            </div>
                            <span class="metric-value">${action.fluency.toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">完整度</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${action.completeness}%; background-color: ${this.getScoreColor(action.completeness)}"></div>
                            </div>
                            <span class="metric-value">${action.completeness.toFixed(1)}</span>
                        </div>
                    </div>

                    <div class="sub-scores">
                        <span>声母: <strong>${action.initialSoundScore.toFixed(1)}</strong></span>
                        <span>韵母: <strong>${action.finalSoundScore.toFixed(1)}</strong></span>
                        <span>声调: <strong>${action.toneScore.toFixed(1)}</strong></span>
                    </div>

                    <div class="advice-section">
                        <div class="advice-title">💡 改进建议</div>
                        <div class="advice-content">${advice}</div>
                    </div>

                    ${action.audioUrl ? `
                        <div class="audio-player">
                            <audio controls src="${action.audioUrl}"></audio>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getScoreColor(score) {
        if (score >= 90) return '#28a745'; // Green
        if (score >= 80) return '#17a2b8'; // Cyan
        if (score >= 60) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    }
}

window.HistoryModule = HistoryModule;