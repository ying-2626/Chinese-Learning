package com.shengdonghanyu.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shengdonghanyu.backend.common.Result;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/fastgpt")
public class FastGptProxyController {
    @Value("${fastgpt.api.key:}") private String apiKey;
    @Value("${fastgpt.api.url:https://api.fastgpt.in/api/v1/chat/completions}") private String apiUrl;
    @Autowired private SessionUtils sessionUtils;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FastGptProxyController() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(55000);
        restTemplate = new RestTemplate(factory);
    }

    @PostMapping("/chat/completions")
    public Result chatCompletions(@RequestBody String requestBody) {
        try {
            sessionUtils.getUserId();
        } catch (MyException e) {
            return Result.result(e.getEnumExceptionType());
        }
        String key = apiKey.trim();
        if (key.isEmpty()) return Result.fail("AI 服务尚未配置，请联系管理员");
        try {
            JsonNode request = objectMapper.readTree(requestBody);
            if (request == null || !request.isObject() || !request.path("messages").isArray()
                    || request.path("messages").isEmpty() || request.path("stream").asBoolean(false)) {
                return Result.fail("请求格式错误，请使用现有的非流式消息格式");
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", key.regionMatches(true, 0, "Bearer ", 0, 7) ? key : "Bearer " + key);
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers), String.class);
            JsonNode result = objectMapper.readTree(response.getBody());
            JsonNode content = result == null ? null : result.at("/choices/0/message/content");
            if (content == null || !content.isTextual() || content.asText().isBlank()) {
                return Result.fail("AI 服务未返回有效回复，请稍后重试");
            }
            return Result.success(result);
        } catch (Exception e) {
            // Do not log upstream bodies or authorization values.
            return Result.fail("AI 回复失败，请稍后重试");
        }
    }
}
