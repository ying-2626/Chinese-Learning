
class Sidebar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.items = [
            { id: 'speech-evaluation', name: '语音测评', icon: 'speech_evaluation', module: 'speech-evaluation' },
            { id: 'voice', name: '语音交互', icon: 'voice', module: 'voice' },
            { id: 'chat-bot', name: '聊天机器', icon: 'chat', module: 'chatbot2' },
            { id: 'magic-tool', name: '工具', icon: 'magictool', module: 'magic-tool2' },
            { id: 'history', name: '历史聊天', icon: 'history', module: 'history' },
        ];
        this.bottomItems = [
             { id: 'love', name: '喜欢♥', icon: 'love', action: 'love' },
             { id: 'home', name: '回到首页', icon: 'share', link: 'entry.html' },
             { id: 'feedback', name: '使用反馈', icon: 'use', link: 'https://v.wjx.cn/vm/wcgDtu5.aspx#' }
        ];
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const headerHtml = `
            <div class="side-header">
                <img src="./img/logo.png" alt="logo" class="logo">
            </div>
        `;

        let contentHtml = '<div class="side-content">';
        
        // Main items
        this.items.forEach(item => {
            contentHtml += `
                <div class="side-footer ${item.id}" data-module="${item.module}" data-id="${item.id}">
                    <img src="./img/${item.icon}(color).png" alt="" class="sidelogo" data-base="${item.icon}">
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
                            <img src="./img/${item.icon}(color).png" alt="" class="sidelogo" data-base="${item.icon}">
                            <p>${item.name}</p>
                        </div>
                    </a>
                `;
            } else {
                contentHtml += `
                    <div class="side-footer ${item.id}">
                        <img src="./img/${item.icon}(color).png" alt="" class="sidelogo" data-base="${item.icon}">
                        <p>${item.name}</p>
                    </div>
                `;
            }
        });

        contentHtml += '<div id="translate"></div></div>';

        this.container.innerHTML = headerHtml + contentHtml;
    }

    bindEvents() {
        const toggleItems = this.container.querySelectorAll('.side-footer');
        const moduleItems = document.querySelectorAll('.module');
        const sidelogos = this.container.querySelectorAll('.sidelogo');

        toggleItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                // If it's a link, let it bubble
                if (item.parentElement.tagName === 'A') return;

                // Remove active class from all
                toggleItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Handle module switching
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    // Hide all modules
                    moduleItems.forEach(m => m.style.display = 'none');
                    
                    // Show target module
                    const targetModule = document.querySelector(`.${moduleId}`); // Assuming class name matches module id or passed in
                    // In the original code, it used index mapping which is brittle. 
                    // Let's try to find by ID or Class.
                    // Original code: var correspondingModule = moduleItems[index]; 
                    // But index includes bottom items too?
                    // The original code had: if (index <= 5) check.
                    
                    // Better approach: use data-module attribute to find the element
                    if (targetModule) {
                        targetModule.style.display = 'block';
                    } else {
                         // Fallback for original index-based logic if needed, but let's try to rely on class/id
                         // The original HTML had IDs like id="speech-evaluation", id="voice", etc.
                         const targetById = document.getElementById(moduleId) || document.querySelector(`.${moduleId}`);
                         if (targetById) targetById.style.display = 'block';
                    }

                    // Update Icons (Color vs White)
                    sidelogos.forEach(logo => {
                        const base = logo.getAttribute('data-base');
                        logo.src = `./img/${base}(color).png`;
                    });
                    
                    const activeLogo = item.querySelector('.sidelogo');
                    if (activeLogo) {
                         const base = activeLogo.getAttribute('data-base');
                         activeLogo.src = `./img/${base}(fff).png`;
                    }
                }
            });
        });
    }
}

// Export for usage
window.Sidebar = Sidebar;
