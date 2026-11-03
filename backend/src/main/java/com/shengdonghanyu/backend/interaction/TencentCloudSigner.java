package com.shengdonghanyu.backend.interaction;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** 腾讯云 API 3.0 的 TC3-HMAC-SHA256 签名（POST，URI 为 /，无查询串）。 */
final class TencentCloudSigner {
    private static final String ALGORITHM = "TC3-HMAC-SHA256";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    private TencentCloudSigner() {
    }

    /** headers 为实际发送并参与签名的请求头，名称不区分大小写。 */
    static String authorization(String secretId, String secretKey, String service,
                                Map<String, String> headers, byte[] payload, long timestamp) {
        String date = DATE.format(Instant.ofEpochSecond(timestamp));
        Map<String, String> signed = new TreeMap<>();
        headers.forEach((name, value) -> signed.put(name.toLowerCase(), value.trim()));
        String signedHeaders = String.join(";", signed.keySet());
        String scope = date + "/" + service + "/tc3_request";
        String stringToSign = ALGORITHM + "\n" + timestamp + "\n" + scope + "\n"
                + sha256Hex(canonicalRequest(signed, payload).getBytes(StandardCharsets.UTF_8));
        byte[] secretDate = hmac(("TC3" + secretKey).getBytes(StandardCharsets.UTF_8), date);
        byte[] secretService = hmac(secretDate, service);
        byte[] secretSigning = hmac(secretService, "tc3_request");
        String signature = HexFormat.of().formatHex(hmac(secretSigning, stringToSign));
        return ALGORITHM + " Credential=" + secretId + "/" + scope + ", SignedHeaders=" + signedHeaders
                + ", Signature=" + signature;
    }

    static String canonicalRequest(Map<String, String> headers, byte[] payload) {
        Map<String, String> signed = new TreeMap<>();
        headers.forEach((name, value) -> signed.put(name.toLowerCase(), value.trim()));
        String canonicalHeaders = signed.entrySet().stream()
                .map(entry -> entry.getKey() + ":" + entry.getValue() + "\n").collect(Collectors.joining());
        return "POST\n/\n\n" + canonicalHeaders + "\n" + String.join(";", signed.keySet()) + "\n" + sha256Hex(payload);
    }

    static String sha256Hex(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException(error);
        }
    }

    private static byte[] hmac(byte[] key, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException(error);
        }
    }
}
