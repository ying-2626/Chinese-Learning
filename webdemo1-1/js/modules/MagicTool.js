
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

                const filterName = btn.textContent.trim();
                this.filterTools(filterName);
            });
        });

        // Tool Click Handling
        this.tools.forEach(tool => {
            tool.addEventListener('click', () => {
                const toolName = tool.querySelector('.h1p')?.textContent;
                console.log(`Tool clicked: ${toolName}`);
                
                if (toolName === '单词本') {
                     // Handled by inline onclick in HTML or link
                     // window.location.href='https://typing-word.ttentau.top'
                } else if (toolName === '写作生成') {
                    // TODO: Restore Writing Generator functionality
                    // The original code referenced .tool-display which is missing from DOM.
                    alert("Writing Generator functionality is currently under maintenance.");
                } else {
                    // Other tools
                }
            });
        });
    }

    filterTools(category) {
        if (category.includes("All")) {
            this.tools.forEach(tool => tool.style.display = '');
        } else {
            this.tools.forEach(tool => {
                // The original code matched by class name.
                // HTML classes: "tools Tool1", "tools Content", "tools Questions", etc.
                // Category names: "Planning", "Content", "Questions", etc.
                // We need to check if the tool has the class matching the category.
                // Note: The category string might need processing (e.g., "Intellectual Prep" -> class?)
                // Original code: if (tool.classList.contains(toolname.split(" ")[0]))
                
                const matchClass = category.split(" ")[0];
                if (tool.classList.contains(matchClass)) {
                    tool.style.display = '';
                } else {
                    tool.style.display = 'none';
                }
            });
        }
    }
}

window.MagicToolModule = MagicToolModule;
