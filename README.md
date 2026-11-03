# 声动汉语 (Chinese-Learning) - 智能口语学习专家

前后端界面与数字人互动现已统一开发。当前工作树、交接范围、Live2D 参考项目和下一步见[统一开发记录](docs/PROJECT_STATUS.md)。

## 本地预览与已有后端联调（当前动效分支）

当前 `codex/unified-development` 分支在原 HTML 页面上优化玻璃质感、导航与交互动效，并接回旧版已有的登录注册、聊天会话、个人资料、测评保存和历史接口。前端仍以 `webdemo1-1` 与 `feat/feedback-listening` 已有内容为依据，保留原正文、价格和入口；支付、课程、专家答疑等原有占位功能不新增实现。

现有 `.local/runtime.env` 已配置好独立本地环境，可直接复用；该文件和 `.local/` 均被 Git 忽略，不应提交或打印其中的凭据。已有服务运行时，直接打开 [首页](http://127.0.0.1:4195/entry.html) 或 [工作台](http://127.0.0.1:4195/index.html)。

| 服务 | 本机地址/端口 |
| --- | --- |
| 前端与同源 API 代理 | `127.0.0.1:4195` |
| Spring Boot 后端 | `127.0.0.1:8091` |
| 独立 MySQL | `127.0.0.1:23306` |
| 独立 Redis | `127.0.0.1:26379` |
| 测试 SMTP 收件箱 | `127.0.0.1:21025` |

服务未启动时，在项目根目录执行：

```sh
docker compose --env-file .local/runtime.env -f compose.local.yml up -d
mvn -f backend/pom.xml package -DskipTests
```

然后分别在三个终端启动常驻进程：

```sh
# 终端 1：只接收测试邮件，保存为 .local/mail/*.eml，不向外网投递。
/usr/bin/python3 scripts/mail_sink.py
```

```sh
# 终端 2：读取 .local/runtime.env，启动已有后端。
python3 scripts/run_backend.py
```

```sh
# 终端 3：打开前端，并将已有 API 与 /audios 请求转发给本地后端。
python3 scripts/preview.py --port 4195 --backend http://127.0.0.1:8091
```

测试收件箱使用标准库 `smtpd`，要求 Python ≤ 3.11；当前 macOS 的 `/usr/bin/python3` 为 3.9，可直接运行。验证码邮件只写入 `.local/mail`，可用本地文本编辑器查看。已有收件箱进程运行时，不要重复启动占用同一端口。

新建环境时，可从 `backend/.env.example` 复制一份到 `.local/runtime.env` 并设置本地凭据：另加 Compose 所需的 `MYSQL_ROOT_PASSWORD`；设置 `DB_USERNAME=chinese_learning`，`DB_URL` 使用 `127.0.0.1:23306/chinese_learning`，`REDIS_PORT=26379`，`SERVER_PORT=8091`，`MAIL_HOST=127.0.0.1`、`MAIL_PORT=21025`、`MAIL_AUTH=false`、`MAIL_STARTTLS=false`，`MAIL_USERNAME` 使用测试发件地址。`DB_PASSWORD` 同时供 Compose 和后端使用。首次创建空 MySQL 数据卷时，Compose 会按顺序执行 `create_table.sql`、`add_user_profile_fields.sql`、`add_chat_tables.sql`；已有数据卷不会重复初始化。`run_backend.py` 负责加载环境文件，Spring Boot 本身不会自动读取 `.env`。数据库和 Redis 数据保留在该 Compose 项目的独立卷中。

本轮已实测通过本地数据库、Redis 会话与测试 SMTP 链路。**腾讯语音测评、FastGPT、真实邮件投递和数字人服务尚未实测**；缺少供应商配置或后端不可达时显示实际错误，不生成示例回复或评分。测试邮件成功不代表真实邮件投递已验证。

玻璃效果使用原生 CSS/SVG，动效使用 Web Animations API，无新增前端运行时依赖；支持减少动态效果与减少透明度偏好。参考 [Apple Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) 与 [Aave 的网页玻璃实现](https://aave.com/design/building-glass-for-the-web)。

录音按钮会随真实状态展开为波形、计时与停止控件，音量复用录音器的 PCM 帧，不额外获取麦克风。评分值按位过渡，最终文本仍来自测评结果。交互参考 [Voice Pill](https://reactbits.dev/micro/voice-pill) 与 [NumberFlow](https://number-flow.barvian.me/vanilla)，本页采用原生实现。拒绝麦克风、切换模块和连接失败会恢复控件；等待浏览器权限时不会并发开启第二次录音。

前端针对性检查：

```sh
node --test webdemo1-1/js/modules/FeedbackSpeech.test.js webdemo1-1/js/modules/LegacyFeatures.test.js webdemo1-1/js/modules/RecordingLifecycle.test.js
```

## 工作台互动底座

「语音交互」已加入数字人画面内的互动卡，支持收起、放到画面下方和窄屏布局。访问 [画面内互动](http://127.0.0.1:4195/index.html#voice-interaction)，复用当前账号和 8091 后端。当前卡片可以准备台词；托管数字人的外部播报接口尚未接通，准备完成不代表人物说出。详见 [接入说明](docs/interaction/README.md)。

## 📖 产品简介
“声动汉语”是一款专为汉语学习者打造的智能化口语学习与测评平台。我们致力于通过先进的人工智能技术，解决传统语言学习中“开口难、发音准、反馈慢”的痛点。平台结合了高精度的语音评测引擎与生成式 AI 大模型，为用户提供沉浸式的练习环境和像真人老师一样的即时指导，帮助学习者有效提升口语水平。

## 🎯 核心业务功能

### 1. 多维度口语实战测评
我们提供分层级的口语练习模式，满足不同阶段的学习需求：
*   **字正腔圆（读汉字模式）**：
    *   专注于汉语发音的基础——声母、韵母和声调。
    *   系统对每一个汉字进行微观分析，精准定位发音缺陷，帮助用户夯实基础。
*   **连词成句（读句子模式）**：
    *   从单字过渡到语流，重点评估句子的连贯性、准确度和流利度。
    *   智能识别错读、漏读字词，提升口语表达的完整性。
*   **篇章朗读（读段落模式）**：
    *   模拟真实语境，综合考查语流音变、停顿节奏和整体语感。
    *   培养用户在长文本中的语言驾驭能力。

### 2. AI 智能助教与个性化反馈
不仅仅是打分，更是教学：
*   **深度分析**：利用大语言模型（LLM）对评测数据进行深度解读。
*   **自然语言点评**：生成通俗易懂、如真人老师般的点评语，指出具体的发音问题（如“翘舌音不明显”、“声调过高”等）。
*   **纠音建议**：提供针对性的改进建议和练习技巧，拒绝冷冰冰的分数，让反馈更有温度。

### 3. 可视化学习报告
*   **多维数据展示**：直观展示准确度、流利度、完整度及声韵调得分。
*   **色彩标记反馈**：通过颜色（红/黄/绿）实时标记文本中的发音问题，让用户一目了然地看到哪里读得好，哪里需要加强。

### 4. 学习档案与回溯
*   **云端记录**：自动保存每一次的练习录音和评测报告。
*   **成长回放**：支持随时回放历史录音，对比练习前后的变化，见证每一点进步。

## � 适用人群
*   汉语作为第二语言的学习者 (CSL/CFL)
*   希望纠正发音、练习普通话的人群
*   准备汉语水平考试 (HSK) 的考生
*   对外汉语教学机构及教师
