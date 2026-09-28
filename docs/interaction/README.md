# 数字人画面内互动

当前入口：<http://127.0.0.1:4195/index.html#voice-interaction>，仍使用 `codex/ui-motion-backend` 的工作台和现有 8091 后端。

## 布局和操作

「语音交互」现在只有一个数字人场景。原 Light4AI 数字人 iframe 持续显示，互动卡位于画布右下角；点击卡片的向下箭头可放到画面下方，点击减号或按 Escape 可收起。窄屏自动放在画面下方。移动、展开或收起卡片不重新加载数字人。

原数字人的输入框与麦克风入口继续位于画面底部。互动卡为本项目管理的台词、后续题目/选项/反馈提供位置，使用当前账号的登录态。切到其他工作台模块时取消当前互动轮次，并卸载托管 iframe，避免其在后台继续发声；返回会重新加载原托管会话。

## 当前真正接通的范围

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

2026-09-28：7 项控制器测试通过，新增覆盖「无数字人控制能力时仅准备台词，不播放、不发完成；连接后新轮次可播放」。浏览器已检查人物画面与浮层同时显示、提交台词、收起/展开、停靠下方、切换模块卸载数字人，以及窄屏下方布局与无横向溢出。

```sh
node --test tests/interaction/controller.test.mjs
```

后端与协议未改，复用先前通过的对应检查。托管画面显示、卡片提交成功与数字人播报接通是不同结论。

[桌面浮层截图](overlay-preview.png) · [窄屏截图](overlay-mobile.png)
