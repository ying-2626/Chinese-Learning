class CustomLearningModule {
    constructor() {
        this.container = document.querySelector('#custom-learning');
        this.isEditing = false;
        this.profile = {};
        this.scoreActions = [];
        this.reports = [];
        this.init();
    }

    init() {
        if (!this.container) return;
        this.checkAuth();
    }

    checkAuth() {
        const userInfo = localStorage.getItem('user_info');
        if (!userInfo) {
            this.renderNotLoggedInState();
            return;
        }
        try {
            const user = JSON.parse(userInfo);
            if (!user.sessionId) {
                this.renderNotLoggedInState();
                return;
            }
            this.loadAllData();
        } catch (error) {
            console.error('Parse user info failed:', error);
            this.renderNotLoggedInState();
        }
    }

    renderNotLoggedInState() {
        this.container.innerHTML = `
            <div class="not-logged-in-state" style="text-align: center; padding: 100px 20px;">
                <i class="ph ph-user-circle" style="font-size: 64px; color: #12b4e3; margin-bottom: 20px;"></i>
                <h3>未登录状态</h3>
                <p>请先登录后查看个人信息</p>
                <button class="login-btn" onclick="window.location.href='login.html'" style="padding: 12px 30px; background: #12b4e3; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;">
                    <i class="ph ph-sign-in"></i>
                    前往登录
                </button>
            </div>
        `;
    }

    getHeaders() {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        return { 'session': userInfo.sessionId };
    }

    loadAllData() {
        this.container.innerHTML = '<div class="loading-spinner" style="text-align:center;padding:60px;color:#888;">加载中...</div>';

        const profilePromise = axios({
            url: CONFIG.BACKEND_API + '/user/profile',
            method: 'get',
            headers: this.getHeaders(),
            withCredentials: true
        }).then(r => r.data.code === 0 ? r.data.result : null).catch(() => null);

        const scoresPromise = axios({
            url: CONFIG.BACKEND_API + '/user/findCurrentUserScoreActions',
            method: 'get',
            headers: this.getHeaders(),
            withCredentials: true
        }).then(r => r.data.code === 0 ? (Array.isArray(r.data.result) ? r.data.result : []) : []).catch(() => []);

        const reportsStr = localStorage.getItem('analysis_reports') || '[]';
        this.reports = JSON.parse(reportsStr);

        Promise.all([profilePromise, scoresPromise]).then(([profile, scores]) => {
            this.profile = profile || this.getProfileFromLocal();
            this.scoreActions = scores;
            this.renderPage();
        });
    }

    getProfileFromLocal() {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const user = userInfo.user || {};
        return {
            nativeLanguage: user.nativeLanguage || '',
            currentLevel: user.currentLevel || '',
            learningGoal: user.learningGoal || '',
            learningDirection: user.learningDirection || ''
        };
    }

    renderPage() {
        const totalRecords = this.scoreActions.length;
        const avgScore = totalRecords > 0
            ? (this.scoreActions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / totalRecords).toFixed(1)
            : '--';

        this.container.innerHTML = `
            <div class="cl-page">
                <div class="cl-section">
                    <div class="cl-section-header">
                        <h3><i class="ph ph-user-circle"></i> 个人信息</h3>
                        <button class="cl-btn cl-btn-sm" onclick="window.customLearningModule.toggleEdit()">
                            <i class="ph ph-pencil-simple"></i>
                            <span>${this.isEditing ? '取消编辑' : '编辑'}</span>
                        </button>
                    </div>
                    <div class="cl-profile-card">
                        ${this.isEditing ? this.renderEditForm() : this.renderProfileDisplay()}
                    </div>
                </div>

                <div class="cl-section">
                    <div class="cl-section-header">
                        <h3><i class="ph ph-chart-bar"></i> 评测记录汇总</h3>
                    </div>
                    <div class="cl-stats-row">
                        <div class="cl-stat-item">
                            <span class="cl-stat-value">${totalRecords}</span>
                            <span class="cl-stat-label">评测次数</span>
                        </div>
                        <div class="cl-stat-item">
                            <span class="cl-stat-value">${avgScore}</span>
                            <span class="cl-stat-label">平均总分</span>
                        </div>
                        <div class="cl-stat-item">
                            <span class="cl-stat-value">${totalRecords > 0 ? this.scoreActions[0].totalScore?.toFixed(1) || '--' : '--'}</span>
                            <span class="cl-stat-label">最近得分</span>
                        </div>
                    </div>
                </div>

                <div class="cl-section">
                    <div class="cl-section-header">
                        <h3><i class="ph ph-file-text"></i> 分析报告</h3>
                        <button class="cl-btn cl-btn-primary cl-btn-sm" onclick="window.customLearningModule.generateReport()">
                            <i class="ph ph-sparkle"></i> 生成新报告
                        </button>
                    </div>
                    <div class="cl-report-area" id="reportArea">
                        ${this.reports.length > 0 ? this.renderReportList() : '<div class="cl-empty">暂无报告，点击上方按钮生成分析报告</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    renderProfileDisplay() {
        const p = this.profile;
        return `
            <div class="cl-profile-grid">
                <div class="cl-profile-row">
                    <span class="cl-profile-label">母语背景</span>
                    <span class="cl-profile-value">${p.nativeLanguage || '未设置'}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">当前水平</span>
                    <span class="cl-profile-value">${p.currentLevel || '未设置'}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习目标</span>
                    <span class="cl-profile-value">${p.learningGoal || '未设置'}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习方向</span>
                    <span class="cl-profile-value">${p.learningDirection || '未设置'}</span>
                </div>
            </div>
        `;
    }

    renderEditForm() {
        const p = this.profile;
        return `
            <div class="cl-profile-grid">
                <div class="cl-profile-row">
                    <span class="cl-profile-label">母语背景</span>
                    <select class="cl-input" id="edit-nativeLanguage">
                        <option value="英语 (美国)" ${p.nativeLanguage === '英语 (美国)' ? 'selected' : ''}>英语 (美国)</option>
                        <option value="英语 (英国)" ${p.nativeLanguage === '英语 (英国)' ? 'selected' : ''}>英语 (英国)</option>
                        <option value="日语" ${p.nativeLanguage === '日语' ? 'selected' : ''}>日语</option>
                        <option value="韩语" ${p.nativeLanguage === '韩语' ? 'selected' : ''}>韩语</option>
                        <option value="法语" ${p.nativeLanguage === '法语' ? 'selected' : ''}>法语</option>
                        <option value="西班牙语" ${p.nativeLanguage === '西班牙语' ? 'selected' : ''}>西班牙语</option>
                        <option value="俄语" ${p.nativeLanguage === '俄语' ? 'selected' : ''}>俄语</option>
                        <option value="其他" ${p.nativeLanguage === '其他' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">当前水平</span>
                    <select class="cl-input" id="edit-currentLevel">
                        <option value="HSK 1级" ${p.currentLevel === 'HSK 1级' ? 'selected' : ''}>HSK 1级</option>
                        <option value="HSK 2级" ${p.currentLevel === 'HSK 2级' ? 'selected' : ''}>HSK 2级</option>
                        <option value="HSK 3级" ${p.currentLevel === 'HSK 3级' ? 'selected' : ''}>HSK 3级</option>
                        <option value="HSK 4级" ${p.currentLevel === 'HSK 4级' ? 'selected' : ''}>HSK 4级</option>
                        <option value="HSK 5级" ${p.currentLevel === 'HSK 5级' ? 'selected' : ''}>HSK 5级</option>
                        <option value="HSK 6级" ${p.currentLevel === 'HSK 6级' ? 'selected' : ''}>HSK 6级</option>
                    </select>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习目标</span>
                    <input type="text" class="cl-input" id="edit-learningGoal" value="${p.learningGoal || ''}" placeholder="如：通过HSK 3级考试">
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习方向</span>
                    <select class="cl-input" id="edit-learningDirection">
                        <option value="考试冲刺" ${p.learningDirection === '考试冲刺' ? 'selected' : ''}>考试冲刺</option>
                        <option value="商务交流" ${p.learningDirection === '商务交流' ? 'selected' : ''}>商务交流</option>
                        <option value="日常交流" ${p.learningDirection === '日常交流' ? 'selected' : ''}>日常交流</option>
                        <option value="文化旅游" ${p.learningDirection === '文化旅游' ? 'selected' : ''}>文化旅游</option>
                    </select>
                </div>
            </div>
            <div class="cl-edit-actions">
                <button class="cl-btn cl-btn-primary" onclick="window.customLearningModule.saveProfile()">
                    <i class="ph ph-check"></i> 保存
                </button>
                <button class="cl-btn" onclick="window.customLearningModule.cancelEdit()">
                    <i class="ph ph-x"></i> 取消
                </button>
            </div>
        `;
    }

    renderReportList() {
        return this.reports.map((report, index) => `
            <div class="cl-report-card">
                <div class="cl-report-header" onclick="window.customLearningModule.toggleReport(${index})">
                    <span class="cl-report-title">
                        <i class="ph ph-file-text"></i>
                        ${report.title}
                    </span>
                    <div class="cl-report-meta">
                        <span class="cl-report-date">${report.date}</span>
                        <i class="ph ph-caret-down cl-report-arrow" id="reportArrow${index}"></i>
                    </div>
                </div>
                <div class="cl-report-body markdown-body" id="reportBody${index}" style="display:none;">
                    ${typeof marked !== 'undefined' ? marked.parse(report.content) : report.content}
                </div>
            </div>
        `).join('');
    }

    toggleReport(index) {
        const body = document.getElementById('reportBody' + index);
        const arrow = document.getElementById('reportArrow' + index);
        if (!body) return;
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        if (arrow) {
            arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
        }
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.renderPage();
    }

    cancelEdit() {
        this.isEditing = false;
        this.renderPage();
    }

    saveProfile() {
        const profile = {
            nativeLanguage: document.getElementById('edit-nativeLanguage').value,
            currentLevel: document.getElementById('edit-currentLevel').value,
            learningGoal: document.getElementById('edit-learningGoal').value,
            learningDirection: document.getElementById('edit-learningDirection').value
        };

        axios({
            url: CONFIG.BACKEND_API + '/user/updateProfile',
            method: 'post',
            data: profile,
            headers: {
                'Content-Type': 'application/json',
                ...this.getHeaders()
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0) {
                this.profile = profile;
                this.isEditing = false;
                this.renderPage();
            } else {
                alert('保存失败：' + (response.data.message || '未知错误'));
            }
        }).catch(error => {
            console.error('Save profile failed:', error);
            alert('保存失败，请稍后重试');
        });
    }

    generateReport() {
        if (this.scoreActions.length === 0) {
            alert('暂无评测记录，请先完成语音评测后再生成报告');
            return;
        }

        const reportArea = document.getElementById('reportArea');
        if (reportArea) {
            reportArea.innerHTML = `
                <div class="cl-report-generating">
                    <div class="cl-generating-spinner"></div>
                    <span>正在分析你的评测数据，生成报告中</span>
                </div>
            `;
        }

        const summary = {
            totalRecords: this.scoreActions.length,
            avgTotalScore: (this.scoreActions.reduce((s, a) => s + (a.totalScore || 0), 0) / this.scoreActions.length).toFixed(1),
            avgAccuracy: (this.scoreActions.reduce((s, a) => s + (a.accuracy || 0), 0) / this.scoreActions.length).toFixed(1),
            avgFluency: (this.scoreActions.reduce((s, a) => s + (a.fluency || 0), 0) / this.scoreActions.length).toFixed(1),
            avgCompleteness: (this.scoreActions.reduce((s, a) => s + (a.completeness || 0), 0) / this.scoreActions.length).toFixed(1),
            recentScores: this.scoreActions.slice(0, 10).map(a => ({
                totalScore: a.totalScore?.toFixed(1),
                accuracy: a.accuracy?.toFixed(1),
                fluency: a.fluency?.toFixed(1),
                completeness: a.completeness?.toFixed(1)
            })),
            userProfile: this.profile
        };

        const prompt = `你是一位专业的中文口语学习分析老师。请根据以下学生的语音评测数据和个人信息，生成一份学习分析报告。

学生信息：母语${summary.userProfile.nativeLanguage || '未知'}，当前水平${summary.userProfile.currentLevel || '未知'}，学习目标${summary.userProfile.learningGoal || '未知'}，学习方向${summary.userProfile.learningDirection || '未知'}。

评测数据汇总：
- 总评测次数：${summary.totalRecords}
- 平均总分：${summary.avgTotalScore}
- 平均准确度：${summary.avgAccuracy}
- 平均流利度：${summary.avgFluency}
- 平均完整度：${summary.avgCompleteness}
- 最近10次评测得分：${JSON.stringify(summary.recentScores)}

请生成包含以下内容的分析报告：
1. 学习现状概述
2. 优势与不足分析
3. 学习趋势判断（是否有进步）
4. 针对性学习建议

注意：
- 使用亲切的老师口吻
- 可以使用markdown格式
- 建议要具体可操作
- 控制在500字以内`;

        axios({
            url: `${CONFIG.BACKEND_API}/api/fastgpt/chat/completions`,
            method: 'post',
            data: JSON.stringify({
                chatId: "report",
                stream: false,
                detail: false,
                messages: [{ content: prompt, role: "user" }]
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => {
            const data = response.data;
            if (data.code !== 0) {
                throw new Error(data.message || '生成失败');
            }
            const content = data.result.choices[0].message.content;
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

            const report = {
                title: `学习分析报告 - ${dateStr}`,
                date: dateStr,
                content: content
            };

            this.reports.unshift(report);
            localStorage.setItem('analysis_reports', JSON.stringify(this.reports));
            this.renderPage();
        }).catch(err => {
            console.error('Generate report failed:', err);
            if (reportArea) {
                reportArea.innerHTML = `<div class="cl-empty" style="color:#dc3545;">报告生成失败，请稍后重试</div>`;
            }
        });
    }
}

window.CustomLearningModule = CustomLearningModule;
window.customLearningModule = new CustomLearningModule();
