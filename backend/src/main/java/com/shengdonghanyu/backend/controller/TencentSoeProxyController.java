package com.shengdonghanyu.backend.controller;

import com.shengdonghanyu.backend.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;

/**
 * 腾讯语音评测代理控制器
 * 前端通过此接口获取签名后的 WebSocket URL，避免暴露密钥
 */
@Slf4j
@RestController
@RequestMapping("/api/tencent/soe")
@CrossOrigin(origins = "*")
public class TencentSoeProxyController {

    @Value("${tencent.soe.appid:}")
    private String appId;

    @Value("${tencent.soe.secretId:}")
    private String secretId;

    @Value("${tencent.soe.secretKey:}")
    private String secretKey;

    private static final String SERVER_ENGINE_TYPE = "16k_zh";
    private static final long EXPIRE_SECONDS = 86400; // 1天有效期

    /**
     * 获取语音评测 WebSocket URL
     *
     * @param request 评测请求参数
     * @return 签名后的 WebSocket URL
     */
    @PostMapping("/websocket-url")
    public Result getWebSocketUrl(@RequestBody SoeWebSocketRequest request) {
        if (appId.isEmpty() || secretId.isEmpty() || secretKey.isEmpty()) {
            log.error("腾讯云语音评测配置未设置");
            return Result.fail("服务配置错误，请联系管理员");
        }

        try {
            String websocketUrl = generateWebSocketUrl(request);
            return Result.success(websocketUrl);
        } catch (Exception e) {
            log.error("生成 WebSocket URL 失败", e);
            return Result.fail("生成连接失败，请稍后重试");
        }
    }

    /**
     * 生成腾讯云语音评测 WebSocket URL
     */
    private String generateWebSocketUrl(SoeWebSocketRequest request)
            throws NoSuchAlgorithmException, InvalidKeyException {

        long timestamp = System.currentTimeMillis() / 1000;
        long expired = timestamp + EXPIRE_SECONDS;
        int nonce = (int) (Math.random() * 1000000000);
        String voiceId = UUID.randomUUID().toString();

        // 构建声调评测标识
        String refText = "{::cmd{F_TDET=true}}" + request.getRefText();

        // 构建参数字符串（按字典序排序）
        String params = String.format(
                "eval_mode=%d&expired=%d&nonce=%d&ref_text=%s&score_coeff=%.1f&secretid=%s&server_engine_type=%s&text_mode=0&timestamp=%d&voice_format=1&voice_id=%s",
                request.getEvalMode(),
                expired,
                nonce,
                URLEncoder.encode(refText, StandardCharsets.UTF_8),
                request.getScoreCoeff(),
                secretId,
                SERVER_ENGINE_TYPE,
                timestamp,
                voiceId);

        // 构建签名字符串
        String signatureString = String.format("soe.cloud.tencent.com/soe/api/%s?%s", appId, params);

        // 计算 HMAC-SHA1 签名
        Mac mac = Mac.getInstance("HmacSHA1");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
        mac.init(secretKeySpec);
        byte[] signatureBytes = mac.doFinal(signatureString.getBytes(StandardCharsets.UTF_8));
        String signature = Base64.getEncoder().encodeToString(signatureBytes);
        String encodedSignature = URLEncoder.encode(signature, StandardCharsets.UTF_8);

        // 构建完整的 WebSocket URL
        return String.format("wss://soe.cloud.tencent.com/soe/api/%s?%s&signature=%s",
                appId, params, encodedSignature);
    }

    /**
     * 语音评测 WebSocket 请求参数
     */
    public static class SoeWebSocketRequest {
        private String refText;
        private int evalMode = 0; // 0:单词, 1:句子, 2:段落
        private double scoreCoeff = 1.0;

        public String getRefText() {
            return refText != null ? refText : "你好";
        }

        public void setRefText(String refText) {
            this.refText = refText;
        }

        public int getEvalMode() {
            return evalMode;
        }

        public void setEvalMode(int evalMode) {
            this.evalMode = evalMode;
        }

        public double getScoreCoeff() {
            return scoreCoeff;
        }

        public void setScoreCoeff(double scoreCoeff) {
            this.scoreCoeff = scoreCoeff;
        }
    }
}
