package com.shengdonghanyu.backend.interaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 腾讯云语音合成 TextToVoice：按句切成不超过 150 字的片段，依次合成 16k PCM 后拼成一段 WAV。 */
@Component
@ConditionalOnProperty(name = "interaction.tts.provider", havingValue = "tencent", matchIfMissing = true)
public class TencentSpeechSynthesis implements SpeechSynthesis {
    static final int MAX_CHUNK_LENGTH = 150;
    static final int SAMPLE_RATE = 16000;
    static final String HOST = "tts.tencentcloudapi.com";
    private static final Logger LOG = LoggerFactory.getLogger(TencentSpeechSynthesis.class);
    private static final String CONTENT_TYPE = "application/json";
    private final String secretId;
    private final String secretKey;
    private final long voiceType;
    private final RestTemplate restTemplate;
    private final Clock clock;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public TencentSpeechSynthesis(@Value("${tencent.tts.secretId:}") String secretId,
                                  @Value("${tencent.tts.secretKey:}") String secretKey,
                                  @Value("${tencent.tts.voiceType:101001}") long voiceType) {
        this(secretId, secretKey, voiceType, defaultRestTemplate(), Clock.systemUTC());
    }

    TencentSpeechSynthesis(String secretId, String secretKey, long voiceType, RestTemplate restTemplate, Clock clock) {
        this.secretId = secretId.trim();
        this.secretKey = secretKey.trim();
        this.voiceType = voiceType;
        this.restTemplate = restTemplate;
        this.clock = clock;
    }

    private static RestTemplate defaultRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        return new RestTemplate(factory);
    }

    @Override
    public byte[] synthesize(InteractionSession session, long turnId, String text) {
        session.requireSpeech(turnId, text);
        if (secretId.isEmpty() || secretKey.isEmpty()) {
            throw unavailable("腾讯云语音合成尚未配置（TENCENT_TTS_SECRET_ID / TENCENT_TTS_SECRET_KEY），数字人暂时无法发声。");
        }
        ByteArrayOutputStream pcm = new ByteArrayOutputStream();
        for (String chunk : split(text)) {
            pcm.writeBytes(synthesizeChunk(chunk));
            // 被打断或已有新一轮时立即停止，不再继续请求后续片段。
            session.requireSpeech(turnId, text);
        }
        if (pcm.size() == 0) {
            throw unavailable("没有可朗读的文字。");
        }
        return wav(pcm.toByteArray());
    }

    private byte[] synthesizeChunk(String chunk) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("Text", chunk);
        body.put("SessionId", UUID.randomUUID().toString());
        body.put("VoiceType", voiceType);
        body.put("Codec", "pcm");
        body.put("SampleRate", SAMPLE_RATE);
        body.put("PrimaryLanguage", 1);
        byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
        long timestamp = clock.instant().getEpochSecond();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, CONTENT_TYPE);
        headers.set("X-TC-Action", "TextToVoice");
        headers.set("X-TC-Version", "2019-08-23");
        headers.set("X-TC-Timestamp", Long.toString(timestamp));
        headers.set(HttpHeaders.AUTHORIZATION, TencentCloudSigner.authorization(secretId, secretKey, "tts",
                Map.of("content-type", CONTENT_TYPE, "host", HOST), payload, timestamp));
        JsonNode response;
        try {
            response = objectMapper.readTree(
                    restTemplate.postForObject("https://" + HOST + "/", new HttpEntity<>(payload, headers), String.class))
                    .path("Response");
        } catch (RestClientException | java.io.IOException error) {
            throw unavailable("腾讯云语音合成请求失败，请稍后重试。");
        }
        JsonNode error = response.path("Error");
        if (!error.isMissingNode()) {
            String code = error.path("Code").asText();
            LOG.warn("腾讯云语音合成返回错误 {}：{}", code, error.path("Message").asText());
            throw unavailable("腾讯云语音合成失败（" + code + "）。");
        }
        String audio = response.path("Audio").asText("");
        if (audio.isEmpty()) {
            throw unavailable("腾讯云语音合成没有返回音频。");
        }
        return Base64.getDecoder().decode(audio);
    }

    /** 优先在句末标点处切分，其次逗号顿号，最后按长度硬切；空白片段不发送。 */
    static List<String> split(String text) {
        List<String> pieces = new ArrayList<>();
        for (String sentence : text.split("(?<=[。！？；!?;\\n])")) {
            if (sentence.length() <= MAX_CHUNK_LENGTH) {
                pieces.add(sentence);
                continue;
            }
            for (String clause : sentence.split("(?<=[，,、：:])")) {
                for (int start = 0; start < clause.length(); start += MAX_CHUNK_LENGTH) {
                    pieces.add(clause.substring(start, Math.min(clause.length(), start + MAX_CHUNK_LENGTH)));
                }
            }
        }
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String piece : pieces) {
            if (current.length() + piece.length() > MAX_CHUNK_LENGTH) {
                addChunk(chunks, current);
                current.setLength(0);
            }
            current.append(piece);
        }
        addChunk(chunks, current);
        return chunks;
    }

    private static void addChunk(List<String> chunks, StringBuilder chunk) {
        String value = chunk.toString().strip();
        if (!value.isEmpty()) {
            chunks.add(value);
        }
    }

    static byte[] wav(byte[] pcm) {
        ByteBuffer header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN);
        header.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(36 + pcm.length)
                .put("WAVE".getBytes(StandardCharsets.US_ASCII))
                .put("fmt ".getBytes(StandardCharsets.US_ASCII)).putInt(16).putShort((short) 1).putShort((short) 1)
                .putInt(SAMPLE_RATE).putInt(SAMPLE_RATE * 2).putShort((short) 2).putShort((short) 16)
                .put("data".getBytes(StandardCharsets.US_ASCII)).putInt(pcm.length);
        ByteArrayOutputStream wav = new ByteArrayOutputStream(44 + pcm.length);
        wav.writeBytes(header.array());
        wav.writeBytes(pcm);
        return wav.toByteArray();
    }

    private ResponseStatusException unavailable(String message) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
