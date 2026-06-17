class ExamServiceModule {
    constructor() {
        this.container = document.querySelector('#exam-service');
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
            this.renderExamDashboard();
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
                <p>请先登录后查看考试冲刺服务</p>
                <button class="login-btn" onclick="window.location.href='login.html'" style="padding: 12px 30px; background: #12b4e3; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;">
                    <i class="ph ph-sign-in"></i>
                    前往登录
                </button>
            </div>
        `;
    }

    renderExamDashboard() {
        this.container.innerHTML = `
            <div class="exam-dashboard">
                <div class="dashboard-header">
                    <h2>考试冲刺中心</h2>
                    <div class="exam-tabs">
                        <button class="exam-tab active" data-exam="hskk">HSKK</button>
                        <button class="exam-tab" data-exam="putonghua">普通话水平测试</button>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-mini-card">
                        <i class="ph ph-exam mini-icon-svg"></i>
                        <div class="mini-info">
                            <span class="mini-value">15</span>
                            <span class="mini-label">已完成模考</span>
                        </div>
                    </div>
                    <div class="stat-mini-card">
                        <i class="ph ph-chart-line mini-icon-svg"></i>
                        <div class="mini-info">
                            <span class="mini-value">82%</span>
                            <span class="mini-label">平均得分</span>
                        </div>
                    </div>
                    <div class="stat-mini-card">
                        <i class="ph ph-clock mini-icon-svg"></i>
                        <div class="mini-info">
                            <span class="mini-value">3天</span>
                            <span class="mini-label">距考试</span>
                        </div>
                    </div>
                    <div class="stat-mini-card">
                        <i class="ph ph-warning-circle mini-icon-svg"></i>
                        <div class="mini-info">
                            <span class="mini-value">23</span>
                            <span class="mini-label">待复习错题</span>
                        </div>
                    </div>
                </div>

                <div class="exam-features-grid">
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-file-text exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>真题模考</h3>
                            <p>历年真题，全真模拟</p>
                            <button class="card-btn">开始模考</button>
                        </div>
                    </div>
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-desktop exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>机考模拟</h3>
                            <p>还原真实考试环境</p>
                            <button class="card-btn">进入模拟</button>
                        </div>
                    </div>
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-microphone exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>专项语音训练</h3>
                            <p>针对考试题型强化</p>
                            <button class="card-btn">开始训练</button>
                        </div>
                    </div>
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-graduation-cap exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>评分标准解读</h3>
                            <p>专家解析评分规则</p>
                            <button class="card-btn">查看解析</button>
                        </div>
                    </div>
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-robot exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>AI模考测评</h3>
                            <p>智能评分与分析</p>
                            <button class="card-btn">立即测评</button>
                        </div>
                    </div>
                    <div class="exam-feature-card">
                        <div class="exam-card-left">
                            <i class="ph ph-list-dashes exam-icon-svg"></i>
                        </div>
                        <div class="exam-card-right">
                            <h3>错题分析</h3>
                            <p>错题本与巩固练习</p>
                            <button class="card-btn">查看错题</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="float-buy-btn" onclick="showPurchaseModal('exam-service')">
                <i class="ph ph-shopping-cart buy-icon-svg"></i>
                <span class="buy-text">购买冲刺包</span>
            </div>
        `;

        this.bindExamTabEvents();
    }

    bindExamTabEvents() {
        const examTabs = this.container.querySelectorAll('.exam-tab');
        examTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                examTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

window.ExamServiceModule = ExamServiceModule;
