# 数字人画面内互动

当前入口：<http://127.0.0.1:4195/index.html#voice-interaction>，仍使用 `codex/unified-development` 的工作台和现有 8091 后端。

## 受控数字人原型（2026-11-03）

「语音交互」的人物画面已从 Light4AI 托管页换成同源页面 `avatar-stage.html`，人物、发声和口型都由本项目控制：

```text
互动卡（场景上下文 + 学习者的话）
  → POST /api/interaction/event  type=agent.ask
  → 后端拼接：固定朗读规则 + 场景上下文 + 最近 6 轮对话 + 本轮输入 → OpenAI 兼容接口（沿用 FASTGPT_API_KEY / FASTGPT_API_URL，可选 INTERACTION_AGENT_MODEL）
  → 回复台词（最多 300 字）→ AvatarBridge → avatar-stage.html
  → /api/interaction/tts 合成 WAV → 浏览器播放，同一路音频的音量驱动 Live2D 张嘴
  → 自然播完才发 speech.ended
```

- 互动卡有两种方式：「数字人回答」把上下文和学习者的话交给大模型；「直接播报」原样朗读台词（`text.submit`，不调用大模型），适合出题等固定台词。
- 对话历史存在本次交互会话里，点「重新开始」清空；换场景时建议重新开始。
- 大模型未配置或调用失败返回 502 `agent_failed`，数字人不开口，卡片显示原因。
- 人物渲染在 `js/interaction/live2d-stage.js`：Cubism Core 计算顶点，本项目用 WebGL 绘制，遮罩用模板缓冲近似；待机呼吸、眨眼、轻微摆头为程序参数，未播放 motion3 动作、未接物理。
- 语音合成由 `INTERACTION_TTS_PROVIDER` 选择：默认 `tencent`，调用腾讯云 TextToVoice（按句切成 ≤150 字分段合成 16k PCM，拼成一段 WAV；音色 `TENCENT_TTS_VOICE_TYPE`，默认 101001 智瑜）；`local` 为 macOS `say`，仅供本机预览。学习者语音输入（ASR）和腾讯评测尚未接入此链路。
- 浏览器可能要求在人物画面内点一次「点击启用语音」才允许出声。

人物沿用原 Light4AI 托管页的形象：Shizuku + 「可爱城市」动态背景，取自开源项目 [awesome-digital-human-live2d](https://github.com/wan-h/awesome-digital-human-live2d) 的 `web/public/sentio/`（原托管页加载的是同一组文件）。取景在 `avatar-stage.html` 的 `framing` 参数中调整。

素材与许可：`js/vendor/live2dcubismcore.min.js` 来自 Live2D 官方 CDN（Live2D Proprietary Software License），年营收 1000 万日元以上的主体发布前需签 Cubism SDK 发行许可。开源仓库代码为 MIT，但未单独写明 `live2d/Shizuku/` 与 `live2d/backgrounds/cute-city.mp4`（14 MB）的素材许可：Shizuku 应为 Live2D 早期官方示例人物（免费素材许可），背景视频来源不明，正式发布前需确认。

## 布局和操作

「语音交互」现在只有一个数字人场景。原 Light4AI 数字人 iframe 持续显示，互动卡位于画布右下角；点击卡片的向下箭头可放到画面下方，点击减号或按 Escape 可收起。窄屏自动放在画面下方。移动、展开或收起卡片不重新加载数字人。

原数字人的输入框与麦克风入口继续位于画面底部。互动卡为本项目管理的台词、后续题目/选项/反馈提供位置，使用当前账号的登录态。切到其他工作台模块时取消当前互动轮次，并卸载托管 iframe，避免其在后台继续发声；返回会重新加载原托管会话。

## 2026-09-28 托管画面阶段的记录

> 以下描述 Light4AI 托管页阶段；人物画面现已由上方受控原型取代，协议与卡片逻辑仍沿用。

- 前端复用 `LegacyContent.headers()`；4195 同源代理将 `/api/interaction/*` 发送给现有 Spring Boot 8091。
- 后端用 `SessionUtils` 校验 Redis 登录，临时交互会话由 HttpSession Cookie 承载并绑定创建用户。
- 卡片可提交文本到本地脚本回复接口，显示准备的台词和轮次。
- 父页面向实际数字人 iframe 发起 `soundarin.avatar.v1` 握手。只有对方确认 `speak` 和 `interrupt` 能力后，按钮才变为「发送给数字人」，并接受真实的开始、结束、取消事件。

**当前托管数字人未回应控制握手，因此保持「台词准备模式」。准备文本不代表人物已经收到、说出，也不触发 `interaction.completed`。** 原平台自身的对话仍由原画面输入框处理。互动卡没有用本机 TTS 代替人物发声，以免与原数字人形成两个声源。

前一版本机 TTS driver、同源语音宿主和后端 `/tts` 保留供后续接入调试，本版默认界面不使用它们。没有新增游戏规则、AI 回复或外部 ASR。

## 后续真正驱动数字人

需要在有权修改的数字人宿主页安装 `installAvatarHost`，让 `driver.speak` 对接其 TTS/播放队列，`driver.interrupt` 取消请求并清空队列。原样发送 `turnId`、`speechId` 关联的播放事件；整句话的音频自然结束后才发 `speech.ended`。之后将场景 iframe 的地址改到该受控宿主。当前外层叠加的卡片、后端会话和轮次逻辑都可继续使用。

`speech.ended` 不能由回复生成、TTS 请求成功或计时器代替。未获得播报能力时，控制器进入 `playback: unavailable`；旧轮次、取消后的回调和未发送语句的伪完成事件不会推进游戏。

## 文件

| 位置 | 职责 |
| --- | --- |
| `webdemo1-1/index.html` | 原数字人场景、浮层挂载点与展开按钮 |
| `webdemo1-1/js/interaction/workspace-voice.js` | 卡片、停靠、会话、宿主握手与页面退出 |
| `webdemo1-1/styles/voice-interaction.css` | 画布浮层与窄屏下方布局 |
| `webdemo1-1/js/interaction/interaction-controller.js` | 轮次、迟到结果、播放能力与真实完成信号 |
| `webdemo1-1/js/interaction/avatar-bridge.js`、`avatar-host.js` | 校验来源的双向通信与宿主 driver 协议 |
| `backend/src/main/java/com/shengdonghanyu/backend/interaction/` | 登录归属、输入、轮次、取消、回复与 TTS 接口 |

四个 POST 接口 `/session`、`/event`、`/interrupt`、`/tts` 的前缀均为 `/api/interaction`。响应为裸 DTO，错误为 `{code,message}`。登录失效 401，跨用户/缺失交互会话 403，过期轮次 409。服务启动方法沿用根 README，本次只改前端，无需重启后端。

## 验证

2026-11-03 受控原型：后端交互测试 21 项通过（新增 2 项：上下文与最近对话按序传给大模型；大模型失败返回 `agent_failed` 且本轮不可合成语音）；前端交互测试 26 项通过。浏览器中用本地注册的测试账号实测：两轮「数字人回答」（大模型由本机模拟接口代替）分别收到 2 条和 4 条消息，人物播报、口型随音量开合、自然播完后才进入下一步；「直接播报」长句中途停止，声音与口型同时停下，不产生完成事件。真实 FastGPT / 其他大模型未测（本地未配置密钥）。


2026-09-28：7 项控制器测试通过，新增覆盖「无数字人控制能力时仅准备台词，不播放、不发完成；连接后新轮次可播放」。浏览器已检查人物画面与浮层同时显示、提交台词、收起/展开、停靠下方、切换模块卸载数字人，以及窄屏下方布局与无横向溢出。

```sh
node --test tests/interaction/controller.test.mjs
```

后端与协议未改，复用先前通过的对应检查。托管画面显示、卡片提交成功与数字人播报接通是不同结论。

[桌面浮层截图](overlay-preview.png) · [窄屏截图](overlay-mobile.png)
