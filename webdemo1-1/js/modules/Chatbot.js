
class ChatbotModule {
    constructor() {
        this.input = document.querySelector(".chat-input");
        this.sendBtn = document.querySelector(".input-container img");
        this.chatItem = document.querySelector(".chat-item");
        this.pleaseInputTip = document.querySelectorAll(".pleaseinput")[0]; // Assuming it's the first or we need to be specific
        
        // Use config for authorization
        this.authorization = CONFIG.FASTGPT.API_KEY;
        
        this.init();
    }

    init() {
        if (!this.input || !this.sendBtn) return;
        this.bindEvents();
    }

    bindEvents() {
        // Input event to change send button icon
        this.input.addEventListener("input", () => {
            if (this.input.value.length > 0) {
                this.sendBtn.src = "img/纸飞机（彩色版）.png";
            } else {
                this.sendBtn.src = "img/纸飞机（灰色版）.png";
            }
        });

        // Enter key to send
        this.input.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Click send button
        this.sendBtn.addEventListener("click", () => {
            this.sendMessage();
        });

        // Mouseover/out for tooltip
        this.sendBtn.addEventListener("mouseover", () => {
            if (this.isAllWhitespace(this.input.value)) {
                // Find the correct pleaseinput. 
                // In original code: let please = document.querySelectorAll(".pleaseinput")[1] for chat-input?
                // Let's rely on relative position or just find the one inside input-container
                const tip = this.input.parentElement.querySelector(".pleaseinput");
                if(tip) tip.style.display = "block";
            }
        });

        this.sendBtn.addEventListener("mouseout", () => {
            const tip = this.input.parentElement.querySelector(".pleaseinput");
            if(tip) tip.style.display = "none";
        });
    }

    isAllWhitespace(text) {
        return /^\s*$/.test(text);
    }

    sendMessage() {
        if (this.isAllWhitespace(this.input.value)) return;

        const content = this.input.value;
        this.input.value = '';
        this.sendBtn.src = "img/纸飞机（灰色版）.png";

        // Render User Message
        const userHtml = `
            <div class="message user-message">
                <div class="p1">${content}</div>
            </div>`;
        this.chatItem.insertAdjacentHTML('beforeend', userHtml);

        // Call API
        this.fetchResponse(content);
    }

    fetchResponse(req_content) {
        const thinkingId = "thinking-message-chat-" + Date.now();
        const thinkingHTML = `
            <div class="message ai-message" id="${thinkingId}">
                <div class="p1">思考中……</div>
            </div>`;
        this.chatItem.insertAdjacentHTML('beforeend', thinkingHTML);

        axios({
            url: 'https://api.fastgpt.in/api/v1/chat/completions',
            method: 'post',
            data: JSON.stringify({
                "chatId": "111", // Should be dynamic based on user
                "stream": false,
                "detail": false,
                "messages": [
                    {
                        "content": req_content,
                        "role": "user"
                    }
                ]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.authorization
            }
        }).then((response) => {
            let content = response.data.choices[0].message.content;
            let newHTML = `
                <div class="message ai-message">
                    <div class="p1">${marked.parse(content)}</div>
                </div>`;
            
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.outerHTML = newHTML;
            } else {
                this.chatItem.insertAdjacentHTML('beforeend', newHTML);
            }
        }).catch(err => {
            console.error(err);
            const thinkingMsg = document.getElementById(thinkingId);
            if(thinkingMsg) thinkingMsg.innerHTML = '<div class="p1" style="color:red">Error: Failed to get response.</div>';
        });
    }
}

window.ChatbotModule = ChatbotModule;
