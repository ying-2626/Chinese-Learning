
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
        // Clear current content
        this.container.innerHTML = '<h2>历史聊天记录</h2><p>加载中...</p>';

        if (typeof ScoreService === 'undefined') {
            this.container.innerHTML = '<h2>历史聊天记录</h2><p>服务未初始化</p>';
            return;
        }

        ScoreService.findCurrentUserScoreActions()
            .then(scoreActions => {
                if (!scoreActions || scoreActions.length === 0) {
                    this.container.innerHTML = '<h2>历史聊天记录</h2><p>暂无记录</p>';
                    return;
                }

                let html = '<h2>历史聊天记录</h2><div class="history-list">';
                scoreActions.forEach(action => {
                    const date = new Date().toLocaleDateString(); // Ideally use a created_at from backend if available
                    html += `
                        <div class="history-item" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                            <p><strong>总分:</strong> <span style="color: #007bff; font-weight: bold;">${action.totalScore}</span></p>
                            <p><strong>准确度:</strong> ${action.accuracy} | <strong>流畅度:</strong> ${action.fluency} | <strong>完整度:</strong> ${action.completeness}</p>
                            <p><strong>声母分:</strong> ${action.initialSoundScore} | <strong>韵母分:</strong> ${action.finalSoundScore} | <strong>声调分:</strong> ${action.toneScore}</p>
                            <p><strong>建议:</strong> ${action.advice || '无'}</p>
                            ${action.audioUrl ? `<audio controls src="${action.audioUrl}" style="width: 100%; margin-top: 5px;"></audio>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
                this.container.innerHTML = html;
            })
            .catch(error => {
                console.error("Failed to load history:", error);
                this.container.innerHTML = `<h2>历史聊天记录</h2><p style="color:red;">加载失败: ${error.message}</p>`;
            });
    }
}

window.HistoryModule = HistoryModule;
