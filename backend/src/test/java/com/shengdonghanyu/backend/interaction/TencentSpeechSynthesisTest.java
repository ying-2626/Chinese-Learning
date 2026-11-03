package com.shengdonghanyu.backend.interaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TencentSpeechSynthesisTest {
    private static final long NOW = 1793692800L; // 2026-11-03T00:00:00Z
    private final ObjectMapper mapper = new ObjectMapper();
    private final List<String> sentTexts = new ArrayList<>();
    private MockRestServiceServer tencent;
    private TencentSpeechSynthesis synthesis;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        tencent = MockRestServiceServer.bindTo(restTemplate).build();
        synthesis = new TencentSpeechSynthesis("AKIDTEST", "secret-test", 101001, restTemplate,
                Clock.fixed(Instant.ofEpochSecond(NOW), ZoneOffset.UTC));
    }

    @Test
    void canonicalRequestMatchesTencentDocumentedExample() {
        // 腾讯云 API 3.0「签名方法 v3」文档中的公开示例（密钥已打码，故只核对两个中间哈希）。
        byte[] payload = "{\"Limit\": 1, \"Filters\": [{\"Values\": [\"\\u672a\\u547d\\u540d\"], \"Name\": \"instance-name\"}]}"
                .getBytes(StandardCharsets.UTF_8);
        assertEquals("35e9c5b0e3ae67532d3c9f17ead6c90222632e5b1ff7f6e89887f1398934f064",
                TencentCloudSigner.sha256Hex(payload));
        String canonical = TencentCloudSigner.canonicalRequest(Map.of(
                "Content-Type", "application/json; charset=utf-8",
                "Host", "cvm.tencentcloudapi.com",
                "X-TC-Action", "describeinstances"), payload);
        assertEquals("7019a55be8395899b900fb5564e4200d984910f34794a27cb3fb7d10ff6a1e84",
                TencentCloudSigner.sha256Hex(canonical.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void signatureMatchesIndependentReferenceImplementation() {
        // 期望值由按官方步骤独立实现的 Python hmac/hashlib 计算得出。
        assertEquals("TC3-HMAC-SHA256 Credential=AKIDTEST/2026-11-03/tts/tc3_request, SignedHeaders=content-type;host, "
                        + "Signature=8424ff9973e5ce861d25656dfaa87cd9911dcc9209cc814bafb47630a0af16b5",
                TencentCloudSigner.authorization("AKIDTEST", "secret-test", "tts",
                        Map.of("content-type", "application/json", "host", "tts.tencentcloudapi.com"),
                        "{\"Text\":\"你好\"}".getBytes(StandardCharsets.UTF_8), NOW));
    }

    @Test
    void longTextIsSynthesizedInSignedChunksAndJoinedIntoOneWav() {
        String text = "你".repeat(100) + "。" + "好".repeat(100) + "。";
        InteractionSession session = readySession(text);
        expectChunk(new byte[]{1, 2, 3, 4});
        expectChunk(new byte[]{5, 6});

        byte[] wav = synthesis.synthesize(session, 1, text);

        tencent.verify();
        assertEquals(List.of("你".repeat(100) + "。", "好".repeat(100) + "。"), sentTexts);
        ByteBuffer header = ByteBuffer.wrap(wav).order(ByteOrder.LITTLE_ENDIAN);
        assertEquals("RIFF", new String(wav, 0, 4, StandardCharsets.US_ASCII));
        assertEquals("WAVE", new String(wav, 8, 4, StandardCharsets.US_ASCII));
        assertEquals(16000, header.getInt(24));
        assertEquals(6, header.getInt(40));
        assertArrayEquals(new byte[]{1, 2, 3, 4, 5, 6}, Arrays.copyOfRange(wav, 44, wav.length));
    }

    @Test
    void tencentErrorIsReportedWithItsCodeAndStopsTheTurn() {
        InteractionSession session = readySession("你好。");
        tencent.expect(requestTo("https://tts.tencentcloudapi.com/")).andRespond(withSuccess(
                "{\"Response\":{\"Error\":{\"Code\":\"AuthFailure.SecretIdNotFound\",\"Message\":\"x\"},\"RequestId\":\"r\"}}",
                MediaType.APPLICATION_JSON));
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> synthesis.synthesize(session, 1, "你好。"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, failure.getStatusCode());
        assertTrue(failure.getReason().contains("AuthFailure.SecretIdNotFound"));
    }

    @Test
    void interruptionBetweenChunksStopsFurtherRequests() {
        String text = "你".repeat(140) + "。" + "好".repeat(20) + "。";
        InteractionSession session = readySession(text);
        tencent.expect(requestTo("https://tts.tencentcloudapi.com/")).andRespond(request -> {
            session.interrupt(1);
            return withSuccess(audioResponse(new byte[]{1, 2}), MediaType.APPLICATION_JSON).createResponse(request);
        });
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> synthesis.synthesize(session, 1, text));
        assertEquals(HttpStatus.CONFLICT, failure.getStatusCode());
        tencent.verify();
    }

    @Test
    void missingCredentialsFailClearlyWithoutCallingTencent() {
        TencentSpeechSynthesis unconfigured = new TencentSpeechSynthesis(" ", "", 101001, new RestTemplate(), Clock.systemUTC());
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> unconfigured.synthesize(readySession("你好"), 1, "你好"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, failure.getStatusCode());
        assertTrue(failure.getReason().contains("TENCENT_TTS_SECRET_ID"));
    }

    @Test
    void splitKeepsEveryChunkWithinTheLimitAndSkipsBlankPieces() {
        List<String> chunks = TencentSpeechSynthesis.split("字".repeat(320) + "，" + "  \n" + "最后一句。");
        assertTrue(chunks.stream().allMatch(chunk -> !chunk.isBlank() && chunk.length() <= 150));
        assertEquals("字".repeat(320) + "，" + "最后一句。", String.join("", chunks).replaceAll("\\s", ""));
        assertEquals(List.of(), TencentSpeechSynthesis.split("  \n  "));
    }

    private void expectChunk(byte[] pcm) {
        tencent.expect(requestTo("https://tts.tencentcloudapi.com/")).andExpect(method(HttpMethod.POST))
                .andExpect(header("Content-Type", "application/json"))
                .andExpect(header("X-TC-Action", "TextToVoice"))
                .andExpect(header("X-TC-Version", "2019-08-23"))
                .andExpect(header("X-TC-Timestamp", Long.toString(NOW)))
                .andExpect(request -> {
                    byte[] body = ((MockClientHttpRequest) request).getBodyAsBytes();
                    JsonNode json = mapper.readTree(body);
                    sentTexts.add(json.path("Text").asText());
                    assertEquals("pcm", json.path("Codec").asText());
                    assertEquals(16000, json.path("SampleRate").asInt());
                    assertEquals(101001, json.path("VoiceType").asInt());
                    String authorization = request.getHeaders().getFirst("Authorization");
                    assertTrue(authorization.startsWith("TC3-HMAC-SHA256 Credential=AKIDTEST/2026-11-03/tts/tc3_request, "
                            + "SignedHeaders=content-type;host, Signature="));
                    assertEquals(TencentCloudSigner.authorization("AKIDTEST", "secret-test", "tts",
                            Map.of("content-type", "application/json", "host", "tts.tencentcloudapi.com"), body, NOW),
                            authorization);
                })
                .andRespond(withSuccess(audioResponse(pcm), MediaType.APPLICATION_JSON));
    }

    private String audioResponse(byte[] pcm) {
        return "{\"Response\":{\"Audio\":\"" + Base64.getEncoder().encodeToString(pcm) + "\",\"RequestId\":\"r\"}}";
    }

    private InteractionSession readySession(String text) {
        InteractionSession session = new InteractionSession("user-a");
        session.begin(1);
        session.complete(1, text);
        return session;
    }
}
