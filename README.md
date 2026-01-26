# 声动汉语 (Chinese-Learning) - AI 辅助汉语口语学习平台

本项目是一个基于 AI 技术的汉语口语学习与测评平台，旨在帮助汉语学习者通过实时语音评测和 AI 智能反馈来提高口语水平。

## 📚 项目简介

“声动汉语”集成了腾讯云语音评测技术和 FastGPT 大模型能力，提供多维度的口语练习场景。用户可以进行汉字、句子和段落的朗读练习，系统会实时分析发音准确度、流利度、完整度以及声韵调的准确性，并由 AI 助教提供个性化的改进建议。

## ✨ 核心功能

*   **多模式口语测评**：
    *   **读汉字**：针对单字发音进行精细化评分（声母、韵母、声调）。
    *   **读句子**：评估句子层面的准确度和流利度，识别错读字词。
    *   **读段落**：综合评估语流音变、停顿和整体语感。
*   **AI 智能反馈**：利用 FastGPT 分析测评数据，生成像老师一样的自然语言点评和练习建议。
*   **可视化报告**：直观展示准确度、流利度、完整度及声韵调得分，并通过颜色标记错读部分。
*   **历史记录与回放**：保存用户的练习记录和音频，支持随时回放和复盘（后端支持）。
*   **用户系统**：注册、登录、个人中心（基于 JWT 认证）。

## 🛠️ 技术栈

### 前端 (Frontend)
*   **架构**：原生 HTML5 / CSS3 / JavaScript (ES6+)
*   **模块化**：采用 ES Modules 进行模块管理
*   **网络请求**：Axios
*   **UI 风格**：自定义 CSS，响应式布局

### 后端 (Backend)
*   **语言**：Java 17
*   **框架**：Spring Boot 3.1.0
*   **ORM**：MyBatis-Plus 3.5.5
*   **数据库**：MySQL 8.0, Redis (缓存/会话)
*   **认证**：JWT (JSON Web Token)
*   **工具**：Lombok, Maven

### AI 与 云服务
*   **语音评测**：腾讯云语音评测 (SOE) / 科大讯飞 (备选)
*   **大语言模型**：FastGPT (OpenAI 接口兼容)
*   **音频处理**：Web Audio API (前端录音与格式转换)

## 📂 目录结构

```text
Chinese-Learning/
├── backend/                # 后端项目根目录
│   ├── src/main/java/      # Java 源代码
│   ├── src/main/resources/ # 配置文件 (application.yml)
│   └── pom.xml             # Maven 依赖配置
├── webdemo1-1/             # 前端项目根目录
│   ├── js/
│   │   ├── config/         # 配置文件 (config.js, prompts.js)
│   │   ├── modules/        # 业务模块 (SpeechEval.js, Chatbot.js 等)
│   │   └── services/       # API 服务层 (scoreService.js)
│   ├── styles/             # CSS 样式文件
│   └── index.html          # 主入口文件
├── create_table.sql        # 数据库初始化脚本
└── README.md               # 项目说明文档
```
