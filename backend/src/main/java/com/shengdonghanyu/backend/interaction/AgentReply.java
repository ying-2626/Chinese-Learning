package com.shengdonghanyu.backend.interaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** 把调用方给的场景上下文、最近几轮对话和本轮输入交给 OpenAI 兼容接口，返回数字人要说的一句话。 */
@Component
public class AgentReply {
    static final int MAX_REPLY_LENGTH = 300;
    private static final String RULES = """
            你是「声动汉语」的中文口语陪练数字人。你说的每个字都会被直接朗读出来，所以：
            只用简体中文口语回答，一次不超过 80 个字；不用 Markdown、列表、表情符号或括号说明。
            学习者答错或卡住时，先给简短提示，不要直接公布答案。
            以下是本次互动的场景与规则：
            """;
    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AgentReply(@Value("${fastgpt.api.key:}") String apiKey,
                      @Value("${fastgpt.api.url:https://api.fastgpt.in/api/v1/chat/completions}") String apiUrl,
                      @Value("${interaction.agent.model:}") String model) {
        this(apiKey, apiUrl, model, defaultRestTemplate());
    }

    AgentReply(String apiKey, String apiUrl, String model, RestTemplate restTemplate) {
        this.apiKey = apiKey.trim();
        this.apiUrl = apiUrl;
        this.model = model.trim();
        this.restTemplate = restTemplate;
    }

    private static RestTemplate defaultRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(55000);
        return new RestTemplate(factory);
    }

    public String reply(String context, List<InteractionSession.Exchange> history, String userText) {
        if (apiKey.isEmpty()) {
            throw failed("AI 服务尚未配置（FASTGPT_API_KEY），数字人暂时无法回答。");
        }
        ObjectNode request = objectMapper.createObjectNode();
        if (!model.isEmpty()) {
            request.put("model", model);
        }
        request.put("stream", false);
        ArrayNode messages = request.putArray("messages");
        messages.addObject().put("role", "system").put("content", RULES + context);
        for (InteractionSession.Exchange exchange : history) {
            messages.addObject().put("role", "user").put("content", exchange.user());
            messages.addObject().put("role", "assistant").put("content", exchange.assistant());
        }
        messages.addObject().put("role", "user").put("content", userText);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", apiKey.regionMatches(true, 0, "Bearer ", 0, 7) ? apiKey : "Bearer " + apiKey);
        String content;
        try {
            JsonNode result = objectMapper.readTree(
                    restTemplate.postForObject(apiUrl, new HttpEntity<>(request.toString(), headers), String.class));
            JsonNode node = result == null ? null : result.at("/choices/0/message/content");
            content = node != null && node.isTextual() ? node.asText().strip() : "";
        } catch (Exception error) {
            // 不记录上游响应体或鉴权信息。
            throw failed("AI 回复失败，请稍后重试。");
        }
        if (content.isEmpty()) {
            throw failed("AI 服务没有返回可朗读的内容。");
        }
        return content.length() > MAX_REPLY_LENGTH ? content.substring(0, MAX_REPLY_LENGTH) : content;
    }

    private ResponseStatusException failed(String message) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
    }
}
