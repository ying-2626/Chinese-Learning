package com.shengdonghanyu.backend.controller;

import com.shengdonghanyu.backend.common.Result;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ProviderProxyTest {
    SessionUtils sessions;
    FastGptProxyController fast;
    TencentSoeProxyController speech;
    MockRestServiceServer upstream;
    final String request="{\"stream\":false,\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}]}";

    @BeforeEach void setup() {
        sessions=mock(SessionUtils.class); when(sessions.getUserId()).thenReturn("user-1");
        fast=new FastGptProxyController();
        ReflectionTestUtils.setField(fast,"sessionUtils",sessions);
        ReflectionTestUtils.setField(fast,"apiKey","");
        ReflectionTestUtils.setField(fast,"apiUrl","https://provider.invalid/chat");
        upstream=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(fast,"restTemplate")).build();
        speech=new TencentSoeProxyController();
        ReflectionTestUtils.setField(speech,"sessionUtils",sessions);
        for (String field:new String[]{"appId","secretId","secretKey"}) ReflectionTestUtils.setField(speech,field,"");
    }

    @Test void bothProvidersRejectMissingAuthenticationBeforeConfigurationOrNetwork() {
        when(sessions.getUserId()).thenThrow(new MyException(EnumExceptionType.NEED_SESSION_ID));
        assertEquals(2003,fast.chatCompletions(request).getCode());
        assertEquals(2003,speech.getWebSocketUrl(new TencentSoeProxyController.SoeWebSocketRequest()).getCode());
        upstream.verify();
    }

    @Test void missingProviderConfigurationIsReadableFailure() {
        Result fastResult=fast.chatCompletions(request);
        assertNotEquals(0,fastResult.getCode()); assertTrue(fastResult.getMessage().contains("尚未配置"));
        Result speechResult=speech.getWebSocketUrl(new TencentSoeProxyController.SoeWebSocketRequest());
        assertNotEquals(0,speechResult.getCode()); assertTrue(speechResult.getMessage().contains("尚未配置"));
        upstream.verify();
    }

    @Test void validCompletionUsesBearerHeaderAndPreservesExistingEnvelope() {
        ReflectionTestUtils.setField(fast,"apiKey","unit-test-key");
        upstream.expect(requestTo("https://provider.invalid/chat")).andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization","Bearer unit-test-key"))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"你好\"}}]}",MediaType.APPLICATION_JSON));
        Result result=fast.chatCompletions(request);
        assertEquals(0,result.getCode()); assertNotNull(result.getResult()); upstream.verify();
    }

    @Test void upstreamErrorAndEmptySuccessfulBodyNeverBecomeSuccessfulAssistantAnswers() {
        ReflectionTestUtils.setField(fast,"apiKey","Bearer unit-test-key");
        upstream.expect(requestTo("https://provider.invalid/chat")).andExpect(header("Authorization","Bearer unit-test-key"))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY).body("private upstream diagnostic"));
        upstream.expect(requestTo("https://provider.invalid/chat")).andRespond(withSuccess("{}",MediaType.APPLICATION_JSON));
        Result failed=fast.chatCompletions(request);
        assertNotEquals(0,failed.getCode()); assertFalse(failed.getMessage().contains("private"));
        assertNotEquals(0,fast.chatCompletions(request).getCode()); upstream.verify();
    }

    @Test void existingProxyDoesNotPretendToSupportStreaming() {
        ReflectionTestUtils.setField(fast,"apiKey","unit-test-key");
        assertNotEquals(0,fast.chatCompletions(request.replace("false","true")).getCode());
        upstream.verify();
    }
}
