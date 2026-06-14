package com.shengdonghanyu.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shengdonghanyu.backend.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/fastgpt")
@CrossOrigin(origins = "*")
public class FastGptProxyController {

    @Value("${fastgpt.api.key:}")
    private String apiKey;

    @Value("${fastgpt.api.url:https://api.fastgpt.in/api/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/chat/completions")
    public Result chatCompletions(@RequestBody String requestBody) {
        if (apiKey.isEmpty()) {
            log.error("FastGPT API Key 未设置");
            return Result.fail("服务配置错误，请联系管理员");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", apiKey);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return Result.success(jsonNode);
        } catch (Exception e) {
            log.error("FastGPT API 调用失败", e);
            return Result.fail("AI 回复失败，请稍后重试");
        }
    }
}
