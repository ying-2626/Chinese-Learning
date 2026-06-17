class CustomLearningModule {
    constructor() {
        this.container = document.querySelector('#custom-learning');
        this.isEditing = false;
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
            this.loadUserProfile();
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
                <p>请先登录后查看个性化学习方案</p>
                <button class="login-btn" onclick="window.location.href='login.html'" style="padding: 12px 30px; background: #12b4e3; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;">
                    <i class="ph ph-sign-in"></i>
                    前往登录
                </button>
            </div>
        `;
    }

    loadUserProfile() {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const sessionId = userInfo.sessionId;

        axios({
            url: CONFIG.BACKEND_API + '/user/profile',
            method: 'get',
            headers: {
                'session': sessionId
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0 && response.data.result) {
                this.renderDashboard(response.data.result);
            } else {
                this.renderDefaultDashboard();
            }
        }).catch(error => {
            console.error('Failed to load profile:', error);
            this.renderDefaultDashboard();
        });
    }

    renderDefaultDashboard() {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const user = userInfo.user || {};
        
        const profile = {
            nativeLanguage: user.nativeLanguage || '英语 (美国)',
            currentLevel: user.currentLevel || 'HSK 2级',
            learningGoal: user.learningGoal || '通过HSK 3级考试',
            learningDirection: user.learningDirection || '考试冲刺'
        };

        this.renderDashboard(profile);
    }

    renderDashboard(profile) {
        this.container.innerHTML = `
            <div class="learning-dashboard">
                <div class="dashboard-header">
                    <h2>我的个性化学习方案</h2>
                    <div class="user-plan-info">
                        <span class="plan-badge">进阶版</span>
                        <span class="plan-expire">有效期至：2025-12-31</span>
                    </div>
                </div>

                <div class="profile-stats-container">
                    <div class="user-profile-section">
                        <div class="section-header-with-action">
                            <h3>个人档案</h3>
                            <button class="edit-profile-btn" onclick="window.customLearningModule.toggleEdit()">
                                <i class="ph ph-pencil-simple"></i>
                                <span class="edit-btn-text">修改</span>
                            </button>
                        </div>
                        <div class="profile-card">
                            <div class="profile-avatar">
                                <i class="ph ph-user-circle"></i>
                            </div>
                            <div class="profile-info">
                                <div class="profile-row">
                                    <span class="profile-label">母语背景</span>
                                    ${this.isEditing ? 
                                        `<select class="profile-input" id="nativeLanguage">
                                            <option value="英语 (美国)" ${profile.nativeLanguage === '英语 (美国)' ? 'selected' : ''}>英语 (美国)</option>
                                            <option value="日语" ${profile.nativeLanguage === '日语' ? 'selected' : ''}>日语</option>
                                            <option value="韩语" ${profile.nativeLanguage === '韩语' ? 'selected' : ''}>韩语</option>
                                            <option value="法语" ${profile.nativeLanguage === '法语' ? 'selected' : ''}>法语</option>
                                            <option value="西班牙语" ${profile.nativeLanguage === '西班牙语' ? 'selected' : ''}>西班牙语</option>
                                            <option value="俄语" ${profile.nativeLanguage === '俄语' ? 'selected' : ''}>俄语</option>
                                            <option value="其他" ${profile.nativeLanguage === '其他' ? 'selected' : ''}>其他</option>
                                        </select>` : 
                                        `<span class="profile-value">${profile.nativeLanguage || '英语 (美国)'}</span>`
                                    }
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">当前水平</span>
                                    ${this.isEditing ? 
                                        `<select class="profile-input" id="currentLevel">
                                            <option value="HSK 1级" ${profile.currentLevel === 'HSK 1级' ? 'selected' : ''}>HSK 1级</option>
                                            <option value="HSK 2级" ${profile.currentLevel === 'HSK 2级' ? 'selected' : ''}>HSK 2级</option>
                                            <option value="HSK 3级" ${profile.currentLevel === 'HSK 3级' ? 'selected' : ''}>HSK 3级</option>
                                            <option value="HSK 4级" ${profile.currentLevel === 'HSK 4级' ? 'selected' : ''}>HSK 4级</option>
                                            <option value="HSK 5级" ${profile.currentLevel === 'HSK 5级' ? 'selected' : ''}>HSK 5级</option>
                                            <option value="HSK 6级" ${profile.currentLevel === 'HSK 6级' ? 'selected' : ''}>HSK 6级</option>
                                        </select>` : 
                                        `<span class="profile-value">${profile.currentLevel || 'HSK 2级'}</span>`
                                    }
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">学习目标</span>
                                    ${this.isEditing ? 
                                        `<input type="text" class="profile-input" id="learningGoal" value="${profile.learningGoal || '通过HSK 3级考试'}" placeholder="请输入学习目标">` : 
                                        `<span class="profile-value">${profile.learningGoal || '通过HSK 3级考试'}</span>`
                                    }
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">学习方向</span>
                                    ${this.isEditing ? 
                                        `<select class="profile-input" id="learningDirection">
                                            <option value="考试冲刺" ${profile.learningDirection === '考试冲刺' ? 'selected' : ''}>考试冲刺</option>
                                            <option value="商务交流" ${profile.learningDirection === '商务交流' ? 'selected' : ''}>商务交流</option>
                                            <option value="日常交流" ${profile.learningDirection === '日常交流' ? 'selected' : ''}>日常交流</option>
                                            <option value="文化旅游" ${profile.learningDirection === '文化旅游' ? 'selected' : ''}>文化旅游</option>
                                        </select>` : 
                                        `<span class="profile-value">${profile.learningDirection || '考试冲刺'}</span>`
                                    }
                                </div>
                                ${this.isEditing ? `
                                    <div class="edit-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                                        <button onclick="window.customLearningModule.saveProfile()" style="padding: 8px 20px; background: #12b4e3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                            <i class="ph ph-check"></i> 保存
                                        </button>
                                        <button onclick="window.customLearningModule.cancelEdit()" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                            <i class="ph ph-x"></i> 取消
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="stats-column">
                        <div class="stat-mini-card">
                            <i class="ph ph-chart-pie-slice mini-icon-svg"></i>
                            <div class="mini-info">
                                <span class="mini-value">68%</span>
                                <span class="mini-label">总体完成度</span>
                            </div>
                        </div>
                        <div class="stat-mini-card">
                            <i class="ph ph-check-circle mini-icon-svg"></i>
                            <div class="mini-info">
                                <span class="mini-value">45</span>
                                <span class="mini-label">已完成课时</span>
                            </div>
                        </div>
                        <div class="stat-mini-card">
                            <i class="ph ph-book-open mini-icon-svg"></i>
                            <div class="mini-info">
                                <span class="mini-value">21</span>
                                <span class="mini-label">剩余课时</span>
                            </div>
                        </div>
                        <div class="stat-mini-card">
                            <i class="ph ph-fire mini-icon-svg"></i>
                            <div class="mini-info">
                                <span class="mini-value">12天</span>
                                <span class="mini-label">连续学习</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-modules-section">
                    <h3>功能模块</h3>
                    <div class="feature-modules-grid">
                        <div class="feature-mini-card">
                            <i class="ph ph-clipboard-text feature-icon-svg"></i>
                            <h4>水平评估</h4>
                            <p>查看评估报告</p>
                        </div>
                        <div class="feature-mini-card">
                            <i class="ph ph-trend-up feature-icon-svg"></i>
                            <h4>月度跟踪</h4>
                            <p>学习数据分析</p>
                        </div>
                        <div class="feature-mini-card">
                            <i class="ph ph-chalkboard-teacher feature-icon-svg"></i>
                            <h4>专家答疑</h4>
                            <p>剩余2次</p>
                        </div>
                        <div class="feature-mini-card">
                            <i class="ph ph-users feature-icon-svg"></i>
                            <h4>学习社群</h4>
                            <p>加入交流</p>
                        </div>
                        <div class="feature-mini-card">
                            <i class="ph ph-books feature-icon-svg"></i>
                            <h4>推荐资源</h4>
                            <p>个性化推荐</p>
                        </div>
                        <div class="feature-mini-card">
                            <i class="ph ph-target feature-icon-svg"></i>
                            <h4>学习目标</h4>
                            <p>调整规划</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="float-buy-btn" onclick="showPurchaseModal('custom-learning')">
                <i class="ph ph-shopping-cart buy-icon-svg"></i>
                <span class="buy-text">购买/升级</span>
            </div>
        `;
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.loadUserProfile();
    }

    cancelEdit() {
        this.isEditing = false;
        this.loadUserProfile();
    }

    saveProfile() {
        const profile = {
            nativeLanguage: document.getElementById('nativeLanguage').value,
            currentLevel: document.getElementById('currentLevel').value,
            learningGoal: document.getElementById('learningGoal').value,
            learningDirection: document.getElementById('learningDirection').value
        };

        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const sessionId = userInfo.sessionId;

        axios({
            url: CONFIG.BACKEND_API + '/user/updateProfile',
            method: 'post',
            data: profile,
            headers: {
                'Content-Type': 'application/json',
                'session': sessionId
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0) {
                alert('保存成功！');
                this.isEditing = false;
                this.loadUserProfile();
            } else {
                alert('保存失败：' + response.data.message);
            }
        }).catch(error => {
            console.error('Save profile failed:', error);
            alert('保存失败，请稍后重试');
        });
    }
}

window.CustomLearningModule = CustomLearningModule;
