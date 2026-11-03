
class MagicToolModule {
    constructor() {
        this.container = document.getElementById("magic-tool");
        this.filterButtons = this.container.querySelectorAll(".toolchoice2 button");
        this.tools = this.container.querySelectorAll(".tools");
        
        this.init();
    }

    init() {
        if (!this.container) return;
        this.bindEvents();
    }

    bindEvents() {
        // Tab Filtering
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                this.filterButtons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                this.filterTools(btn.dataset.category);
            });
        });

        // Tool Click Handling
        this.tools.forEach(tool => {
            tool.addEventListener('click', () => {
                const toolName = tool.querySelector('.h1p')?.textContent;
                console.log(`Tool clicked: ${toolName}`);
                
                // 原「单词本」外链 typing-word.ttentau.top 已失效，与其他未上线工具统一提示。
                if (toolName === '写作生成') {
                    // TODO: Restore Writing Generator functionality
                    // The original code referenced .tool-display which is missing from DOM.
                    alert('写作生成正在升级中，敬请期待。');
                } else {
                    alert(`「${toolName}」即将上线，敬请期待。`);
                }
            });
        });
    }

    filterTools(category) {
        this.tools.forEach(tool => {
            tool.style.display = category === 'all' || tool.dataset.category === category ? '' : 'none';
        });
    }
}

window.MagicToolModule = MagicToolModule;
