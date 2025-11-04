const https = require("tencentcloud-sdk-nodejs-soe")
const crypto = require("crypto")

function sha256(message, secret = "", encoding) {
  const hmac = crypto.createHmac("sha256", secret)
  return hmac.update(message).digest(encoding)
}
function getHash(message, encoding = "hex") {
  const hash = crypto.createHash("sha256")
  return hash.update(message).digest(encoding)
}
function getDate(timestamp) {
  const date = new Date(timestamp * 1000)
  const year = date.getUTCFullYear()
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2)
  const day = ("0" + date.getUTCDate()).slice(-2)
  return `${year}-${month}-${day}`
}

// 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
// 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考，建议采用更安全的方式来使用密钥，
// 请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取


const TOKEN = ""

const host = "soe.tencentcloudapi.com"
const service = "soe"
const region = ""
const action = "TransmitOralProcessWithInit"
const version = "2018-07-24"
const timestamp = parseInt(String(new Date().getTime() / 1000))
const date = getDate(timestamp)

//获取前端文本框的内容
const textBox = document.getElementById("evalText");
const text = textBox.value;
const payload = "{}"

//动态上传参数
function uploadData() {
  function generateSessionId() {
    return crypto.randomUUID(); // 或 Date.now() + Math.random()
  }
  const sessionId = generateSessionId(); // 生成唯一 SessionId
  // 获取当前选中的模式
  const selectedMode = document.querySelector('input[name="group"]:checked').value;
  // 获取用户输入的文本
  const text = document.getElementById("evalText").value.trim();

  // 如果输入为空，提示用户
  if (!text) {
    alert("请输入评测文本！");
    return;
  }
  // 根据模式动态生成 payload
  let payload = {};
  if (selectedMode === "读汉字") {
    payload = {
      "ScoreCoeff": "2.0",
      // 评价苛刻指数。取值为[1.0 - 4.0]范围内的浮点数，用于平滑不同年龄段的分数。
      // 1.0：适用于最小年龄段用户，一般对应儿童应用场景；
      // 4.0：适用于最高年龄段用户，一般对应成人严格打分场景。
      "VoiceEncodeType": "1",
      "UserVoiceData": "VWtsR1JxeUpBd0JYUVZaRlptMTBJQkFBQUFBQkFBRUFnRDRBQUFCOUFBQUNBQkFBVEVsVFZCb0FBQUJKVGtaUFNWTkdWQTRBQUFCTVlYWm1OVFl1TVRrdU1UQXdBR1JoZEdGbWlRTUF5", // Base64编码的音频数据
      "IsEnd": "0",
      // 是否传输完毕标志，若为0表示未完毕，若为1则传输完毕开始评估，非流式模式下无意义。
      "ServerType": "1",
      // 0：英文（默认）
      // 1：中文
      "VoiceFileType": "1",
      // 语音文件类型
      // 1: raw/pcm
      // 2: wav
      // 3: mp3
      // 4: speex
      // 语音文件格式目前仅支持 16k 采样率 16bit 编码单声道，如有不一致可能导致评估不准确或失败。
      "SessionId": sessionId,
      // 语音段唯一标识，一段完整语音使用一个SessionId，不同语音段的评测需要使用不同的SessionId。一般使用uuid(通用唯一识别码)来作为它的值，要尽量保证SessionId的唯一性。
      "SeqId": "1",
      // 流式数据包的序号，从1开始，当IsEnd字段为1后后续序号无意义，当IsLongLifeSession不为1且为非流式模式时无意义。
      // 注意：序号上限为3000，不能超过上限。
      "RefText": text,
      // 被评估语音对应的文本，仅支持中文和英文。
      // 句子模式下不超过 30个 单词或者中文文字，段落模式不超过 120 个单词或者中文文字，中文评估使用 utf-8 编码，自由说模式RefText可以不填。
      // 关于RefText的文本键入要求，请参考评测模式介绍。
      // 如需要在评测模式下使用自定义注音（支持中英文），可以通过设置「TextMode」参数实现，设置方式请参考音素标注。
      // 示例值：apple banana
      "WorkMode": "0",
      // 0：流式分片
      // 1：非流式一次性评估
      "EvalMode": "0",
      // 0：单词/单字模式（中文评测模式下为单字模式）
      // 1：句子模式
      // 2：段落模式
      // 3：自由说模式
      // 4：单词音素纠错模式
      // 5：情景评测模式
      // 6：句子多分支评测模式
      // 7：单词实时评测模式
      // 8：拼音评测模式
      "TextMode": "0"
      // 输入文本模式
      // 0: 普通文本（默认）
      // 1：音素结构文本
    };
  } else if (selectedMode === "读句子") {
    payload = JSON.stringify({
      "ScoreCoeff": "2.0",
      // 评价苛刻指数。取值为[1.0 - 4.0]范围内的浮点数，用于平滑不同年龄段的分数。
      // 1.0：适用于最小年龄段用户，一般对应儿童应用场景；
      // 4.0：适用于最高年龄段用户，一般对应成人严格打分场景。
      "VoiceEncodeType": "1",
      "UserVoiceData": "VWtsR1JxeUpBd0JYUVZaRlptMTBJQkFBQUFBQkFBRUFnRDRBQUFCOUFBQUNBQkFBVEVsVFZCb0FBQUJKVGtaUFNWTkdWQTRBQUFCTVlYWm1OVFl1TVRrdU1UQXdBR1JoZEdGbWlRTUF5", // Base64编码的音频数据
      "IsEnd": "0",
      // 是否传输完毕标志，若为0表示未完毕，若为1则传输完毕开始评估，非流式模式下无意义。
      "ServerType": "1",
      // 0：英文（默认）
      // 1：中文
      "VoiceFileType": "1",
      // 语音文件类型
      // 1: raw/pcm
      // 2: wav
      // 3: mp3
      // 4: speex
      // 语音文件格式目前仅支持 16k 采样率 16bit 编码单声道，如有不一致可能导致评估不准确或失败。
      "SessionId": sessionId,
      // 语音段唯一标识，一段完整语音使用一个SessionId，不同语音段的评测需要使用不同的SessionId。一般使用uuid(通用唯一识别码)来作为它的值，要尽量保证SessionId的唯一性。
      "SeqId": "1",
      // 流式数据包的序号，从1开始，当IsEnd字段为1后后续序号无意义，当IsLongLifeSession不为1且为非流式模式时无意义。
      // 注意：序号上限为3000，不能超过上限。
      "RefText": text,
      // 被评估语音对应的文本，仅支持中文和英文。
      // 句子模式下不超过 30个 单词或者中文文字，段落模式不超过 120 个单词或者中文文字，中文评估使用 utf-8 编码，自由说模式RefText可以不填。
      // 关于RefText的文本键入要求，请参考评测模式介绍。
      // 如需要在评测模式下使用自定义注音（支持中英文），可以通过设置「TextMode」参数实现，设置方式请参考音素标注。
      // 示例值：apple banana
      "WorkMode": "0",
      // 0：流式分片
      // 1：非流式一次性评估
      "EvalMode": "1",
      // 0：单词/单字模式（中文评测模式下为单字模式）
      // 1：句子模式
      // 2：段落模式
      // 3：自由说模式
      // 4：单词音素纠错模式
      // 5：情景评测模式
      // 6：句子多分支评测模式
      // 7：单词实时评测模式
      // 8：拼音评测模式
      "TextMode": "0"
      // 输入文本模式
      // 0: 普通文本（默认）
      // 1：音素结构文本
    });
  } else if (selectedMode === "读段落") {
    payload = JSON.stringify({
      "ScoreCoeff": "2.0",
      // 评价苛刻指数。取值为[1.0 - 4.0]范围内的浮点数，用于平滑不同年龄段的分数。
      // 1.0：适用于最小年龄段用户，一般对应儿童应用场景；
      // 4.0：适用于最高年龄段用户，一般对应成人严格打分场景。
      "VoiceEncodeType": "1",
      "UserVoiceData": "VWtsR1JxeUpBd0JYUVZaRlptMTBJQkFBQUFBQkFBRUFnRDRBQUFCOUFBQUNBQkFBVEVsVFZCb0FBQUJKVGtaUFNWTkdWQTRBQUFCTVlYWm1OVFl1TVRrdU1UQXdBR1JoZEdGbWlRTUF5", // Base64编码的音频数据
      "IsEnd": "0",
      // 是否传输完毕标志，若为0表示未完毕，若为1则传输完毕开始评估，非流式模式下无意义。
      "ServerType": "1",
      // 0：英文（默认）
      // 1：中文
      "VoiceFileType": "1",
      // 语音文件类型
      // 1: raw/pcm
      // 2: wav
      // 3: mp3
      // 4: speex
      // 语音文件格式目前仅支持 16k 采样率 16bit 编码单声道，如有不一致可能导致评估不准确或失败。
      "SessionId": sessionId,
      // 语音段唯一标识，一段完整语音使用一个SessionId，不同语音段的评测需要使用不同的SessionId。一般使用uuid(通用唯一识别码)来作为它的值，要尽量保证SessionId的唯一性。
      "SeqId": "1",
      // 流式数据包的序号，从1开始，当IsEnd字段为1后后续序号无意义，当IsLongLifeSession不为1且为非流式模式时无意义。
      // 注意：序号上限为3000，不能超过上限。
      "RefText": text,
      // 被评估语音对应的文本，仅支持中文和英文。
      // 句子模式下不超过 30个 单词或者中文文字，段落模式不超过 120 个单词或者中文文字，中文评估使用 utf-8 编码，自由说模式RefText可以不填。
      // 关于RefText的文本键入要求，请参考评测模式介绍。
      // 如需要在评测模式下使用自定义注音（支持中英文），可以通过设置「TextMode」参数实现，设置方式请参考音素标注。
      // 示例值：apple banana
      "WorkMode": "0",
      // 0：流式分片
      // 1：非流式一次性评估
      "EvalMode": "2",
      // 0：单词/单字模式（中文评测模式下为单字模式）
      // 1：句子模式
      // 2：段落模式
      // 3：自由说模式
      // 4：单词音素纠错模式
      // 5：情景评测模式
      // 6：句子多分支评测模式
      // 7：单词实时评测模式
      // 8：拼音评测模式
      "TextMode": "0"
      // 输入文本模式
      // 0: 普通文本（默认）
      // 1：音素结构文本
    });
  }

  // 转换为 JSON 字符串
  const payloadString = JSON.stringify(payload);

  // 模拟上传（这里用 console.log 打印）
  console.log("Uploading:", payloadString);

  // 实际上传可以用 fetch 或 XMLHttpRequest
  fetch("soe.tencentcloudapi.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payloadString
  }).then(response => response.json())
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
}



// ************* 步骤 1：拼接规范请求串 *************
const signedHeaders = "content-type;host"
const hashedRequestPayload = getHash(payload)
const httpRequestMethod = "POST"
const canonicalUri = "/"
const canonicalQueryString = ""
const canonicalHeaders =
  "content-type:application/json; charset=utf-8\n" + "host:" + host + "\n"

const canonicalRequest =
  httpRequestMethod +
  "\n" +
  canonicalUri +
  "\n" +
  canonicalQueryString +
  "\n" +
  canonicalHeaders +
  "\n" +
  signedHeaders +
  "\n" +
  hashedRequestPayload

// ************* 步骤 2：拼接待签名字符串 *************
const algorithm = "TC3-HMAC-SHA256"
const hashedCanonicalRequest = getHash(canonicalRequest)
const credentialScope = date + "/" + service + "/" + "tc3_request"
const stringToSign =
  algorithm +
  "\n" +
  timestamp +
  "\n" +
  credentialScope +
  "\n" +
  hashedCanonicalRequest

// ************* 步骤 3：计算签名 *************
const kDate = sha256(date, "TC3" + SECRET_KEY)
const kService = sha256(service, kDate)
const kSigning = sha256("tc3_request", kService)
const signature = sha256(stringToSign, kSigning, "hex")

// ************* 步骤 4：拼接 Authorization *************
const authorization =
  algorithm +
  " " +
  "Credential=" +
  SECRET_ID +
  "/" +
  credentialScope +
  ", " +
  "SignedHeaders=" +
  signedHeaders +
  ", " +
  "Signature=" +
  signature

// ************* 步骤 5：构造并发起请求 *************
const headers = {
  Authorization: authorization,
  "Content-Type": "application/json; charset=utf-8",
  Host: host,
  "X-TC-Action": action,
  "X-TC-Timestamp": timestamp,
  "X-TC-Version": version,
}

if (region) {
  headers["X-TC-Region"] = region
}
if (TOKEN) {
  headers["X-TC-Token"] = TOKEN
}

const options = {
  hostname: host,
  method: httpRequestMethod,
  headers,
}

const req = https.request(options, (res) => {
  let data = ""
  res.on("data", (chunk) => {
    data += chunk
  })

  res.on("end", () => {
    console.log(data)
  })
})

req.on("error", (error) => {
  console.error(error)
})

req.write(payload)

req.end()




