
class Sidebar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.items = [
            { id: 'speech-evaluation', name: '语音测评', icon: 'speech_evaluation', module: 'speech-evaluation' },
            { id: 'voice', name: '语音交互', icon: 'voice', module: 'voice' },
            { id: 'chat-bot', name: 'AI 对话', icon: 'chat', module: 'chatbot2' },
            { id: 'magic-tool', name: '工具', icon: 'magictool', module: 'magic-tool2' },
            { id: 'custom-learning', name: '个性化学习', icon: 'magictool', module: 'custom-learning' },
            { id: 'exam-service', name: '考试冲刺', icon: 'speech_evaluation', module: 'exam-service' },
            { id: 'history', name: '评测记录', icon: 'history', module: 'history' },
        ];
        this.bottomItems = [
            { id: 'love', name: '用户反馈', icon: 'love', module: 'love' },
            { id: 'home', name: '回到首页', icon: 'share', link: 'entry.html' }
        ];
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();

        // Open the module named in the URL hash (e.g. #exam-service), else the first item
        if (this.items.length > 0) {
            const target = this.items.find(item => location.hash === `#${item.id}`) || this.items[0];
            const firstItem = this.container.querySelector(`.side-footer.${target.id}`);
            if (firstItem) {
                firstItem.click();
            }
        }
    }

    render() {
        const headerHtml = document.body.classList.contains('ui-workspace')
            ? `<div class="side-header"><img src="./img/side_logo.png" alt="" class="logo"><span>声动汉语</span></div>`
            : `<div class="side-header"><img src="./img/logo.png" alt="logo" class="logo"></div>`;

        let contentHtml = '<div class="side-content">';

        // Main items
        this.items.forEach(item => {
            contentHtml += `
                <div class="side-footer ${item.id}" data-module="${item.module}" data-id="${item.id}" role="button" tabindex="0" aria-pressed="false">
                    ${this.renderIcon(item.id)}
                    <p>${item.name}</p>
                </div>
            `;
        });

        contentHtml += '<div class="Dividing-line"></div>';

        // Bottom items
        this.bottomItems.forEach(item => {
            if (item.link) {
                contentHtml += `
                    <a href="${item.link}" style="display:block; color:inherit; text-decoration:none;">
                        <div class="side-footer ${item.id}">
                            ${this.renderIcon(item.id)}
                            <p>${item.name}</p>
                        </div>
                    </a>
                `;
            } else {
                contentHtml += `
                    <div class="side-footer ${item.id}" data-module="${item.module}" data-id="${item.id}" role="button" tabindex="0" aria-pressed="false">
                        ${this.renderIcon(item.id)}
                        <p>${item.name}</p>
                    </div>
                `;
            }
        });

        contentHtml += '<div id="translate"></div></div>';

        this.container.innerHTML = headerHtml + contentHtml;
    }

    renderIcon(id) {
        const paths = {
            'speech-evaluation': '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
            voice: '<path d="M4 9v6m4-10v14m4-17v20m4-17v14m4-10v6"/>',
            'chat-bot': '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M7 9h9M7 13h6"/>',
            'magic-tool': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
            'custom-learning': '<path d="M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/>',
            'exam-service': '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3"/>',
            history: '<path d="M3 11a9 9 0 1 1 2.4 7M3 4v7h7M12 7v5l3 2"/>',
            love: '<path d="m12 21-8.3-8.3a5.5 5.5 0 0 1 7.8-7.8L12 5.4l.5-.5a5.5 5.5 0 0 1 7.8 7.8Z"/>',
            home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM9 21v-8h6v8"/>'
        };
        return `<svg class="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths['magic-tool']}</svg>`;
    }

    bindEvents() {
        const toggleItems = this.container.querySelectorAll('.side-footer');
        const moduleItems = document.querySelectorAll('.module');

        toggleItems.forEach((item, index) => {
            if (item.hasAttribute('data-module')) {
                item.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        item.click();
                    }
                });
            }
            item.addEventListener('click', (e) => {
                // If it's a link, let it bubble
                if (item.parentElement.tagName === 'A') return;

                // Remove active class from all
                toggleItems.forEach(i => {
                    i.classList.remove('active');
                    if (i.hasAttribute('data-module')) i.setAttribute('aria-pressed', 'false');
                });
                item.classList.add('active');
                item.setAttribute('aria-pressed', 'true');

                // Handle module switching
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    // Hide all modules
                    moduleItems.forEach(m => m.style.display = 'none');

                    // Show target module
                    // Use specific selector to avoid selecting sidebar items themselves (which might have the same class name)
                    // We target elements that have both .module class and the specific module class
                    const targetModule = document.querySelector(`.module.${moduleId}`);

                    if (targetModule) {
                        if (moduleId === 'love') {
                            targetModule.style.display = 'flex';
                        } else {
                            targetModule.style.display = 'block';
                        }
                    } else {
                        // Fallback: Try by ID if class selector fails
                        const targetById = document.getElementById(moduleId);
                        if (targetById) {
                            if (moduleId === 'love') {
                                targetById.style.display = 'flex';
                            } else {
                                targetById.style.display = 'block';
                            }
                        }
                    }

                    if (moduleId === 'history') window.historyModule?.loadHistory();
                    if (moduleId === 'custom-learning' && typeof CustomLearningModule !== 'undefined') {
                        if (!window.customLearningModule) window.customLearningModule = new CustomLearningModule();
                        else window.customLearningModule.checkAuth();
                    }

                    const heading = document.querySelector('.workspace-title');
                    if (heading) heading.textContent = item.querySelector('p').textContent;

                }
            });
        });
    }
}

// Export for usage
window.Sidebar = Sidebar;
