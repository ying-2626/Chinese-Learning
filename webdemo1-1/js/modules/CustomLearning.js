class CustomLearningModule {
    constructor() {
        this.container = document.querySelector('#custom-learning .profile-stats-container');
        if (this.container) {
            this.container.className = 'learning-profile-live';
            // HTML 里的示例档案只是占位，从不展示：直接清空，等真实数据渲染，避免首次打开时闪出示例内容。
            this.container.replaceChildren();
        }
        this.loadVersion = 0;
        this.generating = false;
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
        const user = LegacyContent.getUser();
        if (!user || user.id == null) {
            this.loadVersion++;
            this.reports = [];
            this.renderNotLoggedInState();
            return;
        }
        return this.loadAllData();
    }

    reportStorageKey(user = LegacyContent.getUser()) {
        if (!user || user.id == null) throw new Error('请先登录后查看个人信息');
        return 'analysis_reports:' + encodeURIComponent(String(user.id));
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
        return LegacyContent.headers(true);
    }

    async loadAllData() {
        const version = ++this.loadVersion;
        const userId = LegacyContent.getUser()?.id;
        // 请求较快时直接显示结果；超过 400ms 才提示加载中，避免一闪而过的中间态。
        const slow = setTimeout(() => {
            if (version === this.loadVersion) this.container.innerHTML = '<div class="loading-spinner">加载中...</div>';
        }, 400);
        try {
            const headers = this.getHeaders();
            const [profile, scores] = await Promise.all([
                axios({url: CONFIG.BACKEND_API + '/user/profile', method:'get', headers, withCredentials:true}).then(LegacyContent.result),
                ScoreService.findCurrentUserScoreActions()
            ]);
            if (version !== this.loadVersion || userId !== LegacyContent.getUser()?.id) return;
            if (!profile || typeof profile !== 'object') throw new Error('个人信息返回格式异常');
            this.profile = profile;
            this.scoreActions = scores.slice().sort((a,b) => Number(b.id) - Number(a.id));
            const stored = JSON.parse(localStorage.getItem(this.reportStorageKey()) || '[]');
            this.reports = Array.isArray(stored) ? stored.filter(r => r && typeof r.content === 'string') : [];
            this.renderPage();
        } catch (error) {
            if (version !== this.loadVersion) return;
            if (LegacyContent.isAuthError(error)) { this.renderNotLoggedInState(); return; }
            this.container.innerHTML = '<div class="cl-empty"><p></p><button class="cl-btn">重试</button></div>';
            this.container.querySelector('p').textContent = '加载失败：' + (error.message || '请检查连接');
            this.container.querySelector('button').onclick = () => this.checkAuth();
        } finally {
            clearTimeout(slow);
        }
    }

    renderPage() {
        const totalRecords = this.scoreActions.length;
        const avgScore = totalRecords > 0
            ? (this.scoreActions.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0) / totalRecords).toFixed(1)
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
                            <span class="cl-stat-value">${totalRecords > 0 ? Number(this.scoreActions[0].totalScore || 0).toFixed(1) : '--'}</span>
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
                    <span class="cl-profile-value">${LegacyContent.escapeHtml(p.nativeLanguage || '未设置')}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">当前水平</span>
                    <span class="cl-profile-value">${LegacyContent.escapeHtml(p.currentLevel || '未设置')}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习目标</span>
                    <span class="cl-profile-value">${LegacyContent.escapeHtml(p.learningGoal || '未设置')}</span>
                </div>
                <div class="cl-profile-row">
                    <span class="cl-profile-label">学习方向</span>
                    <span class="cl-profile-value">${LegacyContent.escapeHtml(p.learningDirection || '未设置')}</span>
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
                    <input type="text" class="cl-input" id="edit-learningGoal" value="${LegacyContent.escapeHtml(p.learningGoal || '')}" placeholder="如：通过HSK 3级考试">
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
                <button type="button" class="cl-report-header" aria-expanded="false" aria-controls="reportBody${index}" onclick="window.customLearningModule.toggleReport(${index}, this)">
                    <span class="cl-report-title">
                        <i class="ph ph-file-text"></i>
                        ${LegacyContent.escapeHtml(report.title)}
                    </span>
                    <div class="cl-report-meta">
                        <span class="cl-report-date">${LegacyContent.escapeHtml(report.date)}</span>
                        <i class="ph ph-caret-down cl-report-arrow" id="reportArrow${index}"></i>
                    </div>
                </button>
                <div class="cl-report-body markdown-body" id="reportBody${index}" style="display:none;">
                    ${LegacyContent.markdown(report.content)}
                </div>
            </div>
        `).join('');
    }

    toggleReport(index, trigger) {
        const body = document.getElementById('reportBody' + index);
        const arrow = document.getElementById('reportArrow' + index);
        if (!body) return;
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        trigger?.setAttribute('aria-expanded', String(!isOpen));
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

    async saveProfile() {
        if (this.savingProfile) return;
        this.savingProfile = true;
        const profile = {
            nativeLanguage: document.getElementById('edit-nativeLanguage').value,
            currentLevel: document.getElementById('edit-currentLevel').value,
            learningGoal: document.getElementById('edit-learningGoal').value,
            learningDirection: document.getElementById('edit-learningDirection').value
        };

        try {
            const response = await axios({url: CONFIG.BACKEND_API + '/user/updateProfile', method:'post', data:profile, headers:this.getHeaders(), withCredentials:true});
            LegacyContent.result(response);
            this.profile = profile;
            this.isEditing = false;
            this.renderPage();
        } catch (error) {
            alert('保存失败：' + (error.message || '请稍后重试'));
        } finally {
            this.savingProfile = false;
        }
    }

    async generateReport() {
        if (this.generating) return;
        const user = LegacyContent.getUser();
        if (!user || user.id == null) { this.renderNotLoggedInState(); return; }
        const storageKey = this.reportStorageKey(user);
        if (this.scoreActions.length === 0) {
            alert('暂无评测记录，请先完成语音评测后再生成报告');
            return;
        }

        this.generating = true;
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
            avgTotalScore: (this.scoreActions.reduce((s, a) => s + (Number(a.totalScore) || 0), 0) / this.scoreActions.length).toFixed(1),
            avgAccuracy: (this.scoreActions.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) / this.scoreActions.length).toFixed(1),
            avgFluency: (this.scoreActions.reduce((s, a) => s + (Number(a.fluency) || 0), 0) / this.scoreActions.length).toFixed(1),
            avgCompleteness: (this.scoreActions.reduce((s, a) => s + (Number(a.completeness) || 0), 0) / this.scoreActions.length).toFixed(1),
            recentScores: this.scoreActions.slice(0, 10).map(a => ({
                totalScore: Number(a.totalScore || 0).toFixed(1),
                accuracy: Number(a.accuracy || 0).toFixed(1),
                fluency: Number(a.fluency || 0).toFixed(1),
                completeness: Number(a.completeness || 0).toFixed(1)
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

        try {
        const response = await axios({
            url: `${CONFIG.BACKEND_API}/api/fastgpt/chat/completions`,
            method: 'post',
            data: JSON.stringify({
                chatId: 'report:' + user.id + ':' + crypto.randomUUID(),
                stream: false,
                detail: false,
                messages: [{ content: prompt, role: "user" }]
            }),
            headers: this.getHeaders(),
            withCredentials: true
        });
            const data = LegacyContent.result(response);
            const content = data?.choices?.[0]?.message?.content;
            if (typeof content !== 'string' || !content.trim()) throw new Error('服务未返回报告内容');
            if (user.id !== LegacyContent.getUser()?.id) return;
            const dateStr = new Date().toLocaleString('zh-CN', {hour12:false});
            const report = {title:`学习分析报告 - ${dateStr}`, date:dateStr, content};
            const reports = [report, ...this.reports];
            localStorage.setItem(storageKey, JSON.stringify(reports));
            this.reports = reports;
            this.renderPage();
        } catch (error) {
            if (user.id !== LegacyContent.getUser()?.id) return;
            if (reportArea) {
                reportArea.innerHTML = '<div class="cl-empty" role="status"></div>';
                reportArea.firstElementChild.textContent = '报告生成或保存失败：' + (error.message || '请稍后重试');
            }
        } finally {
            this.generating = false;
        }
    }
}

if (typeof window !== 'undefined') window.CustomLearningModule = CustomLearningModule;
if (typeof module !== 'undefined' && module.exports) module.exports = CustomLearningModule;
