package com.shengdonghanyu.backend.interaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InteractionControllerTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private MockMvc mvc;
    private SessionUtils loginSession;
    private MockRestServiceServer ai;

    @BeforeEach
    void setUp() {
        loginSession = mock(SessionUtils.class);
        when(loginSession.getUserId()).thenReturn("user-a");
        RestTemplate restTemplate = new RestTemplate();
        ai = MockRestServiceServer.bindTo(restTemplate).build();
        AgentReply agent = new AgentReply("test-key", "http://ai.test/v1/chat/completions", "", restTemplate);
        mvc = MockMvcBuilders.standaloneSetup(new InteractionController(
                new InteractionSessionService(new LocalScriptReply(), agent, new LocalSpeechSynthesis(), loginSession))).build();
    }

    @Test
    void agentAskSendsContextAndRecentHistoryAndSpeaksTheReply() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        ai.expect(requestTo("http://ai.test/v1/chat/completions")).andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages", hasSize(2)))
                .andRespond(withSuccess(aiReply("中秋节吃什么呢？"), MediaType.APPLICATION_JSON));
        ai.expect(requestTo("http://ai.test/v1/chat/completions"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages", hasSize(4)))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages[0].content",
                        org.hamcrest.Matchers.endsWith("场景：中秋节问答")))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages[1].content").value("开始吧"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages[2].content").value("中秋节吃什么呢？"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.messages[3].content").value("月饼"))
                .andRespond(withSuccess(aiReply("答对了！"), MediaType.APPLICATION_JSON));
        for (List<String> turn : List.of(List.of("1", "开始吧", "中秋节吃什么呢？"), List.of("2", "月饼", "答对了！"))) {
            mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                            .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", Integer.parseInt(turn.get(0)),
                                    "type", "agent.ask", "text", turn.get(1), "context", "场景：中秋节问答"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.speech.text").value(turn.get(2)))
                    .andExpect(jsonPath("$.agentMode").value("agent"));
        }
        ai.verify();
    }

    @Test
    void agentFailuresAreVisibleAndDoNotProduceSpeech() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 1,
                                "type", "agent.ask", "text", "你好"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_request"));
        ai.expect(requestTo("http://ai.test/v1/chat/completions")).andRespond(withServerError());
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 2,
                                "type", "agent.ask", "text", "你好", "context", "场景"))))
                .andExpect(status().isBadGateway()).andExpect(jsonPath("$.code").value("agent_failed"));
        mvc.perform(post("/api/interaction/tts").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("turnId", 2, "text", "你好"))))
                .andExpect(status().isBadRequest());
    }

    private String aiReply(String content) throws Exception {
        return mapper.writeValueAsString(Map.of("choices", List.of(Map.of("message", Map.of("role", "assistant", "content", content)))));
    }

    @Test
    void authenticationFailuresReturn401ForEveryInteractionEndpoint() throws Exception {
        when(loginSession.getUserId()).thenThrow(new MyException(EnumExceptionType.NEED_SESSION_ID));
        String body = mapper.writeValueAsString(Map.of("sessionId", "unused", "turnId", 1,
                "type", "text.submit", "text", "你好"));
        for (String endpoint : new String[]{"session", "event", "interrupt", "tts"}) {
            mvc.perform(post("/api/interaction/" + endpoint).contentType("application/json").content(body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("authentication_required"));
        }
    }

    @Test
    void sameBrowserCannotReuseInteractionAfterLoginUserChanges() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String ownerSessionId = createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(ownerSessionId, 1, "用户甲的台词")))
                .andExpect(status().isOk());
        when(loginSession.getUserId()).thenReturn("user-b");
        String input = input(ownerSessionId, 2, "用户甲的台词");
        for (String endpoint : new String[]{"event", "interrupt", "tts"}) {
            mvc.perform(post("/api/interaction/" + endpoint).session(browser)
                            .contentType("application/json").content(input))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("session_forbidden"));
        }
        String newSessionId = createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(newSessionId, 1, "用户乙的新台词")))
                .andExpect(status().isOk());
        when(loginSession.getUserId()).thenReturn("user-a");
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(newSessionId, 2, "用户甲不能继续乙的会话")))
                .andExpect(status().isForbidden());
    }

    @Test
    void echoesExactTextAndIdentifiesLocalMode() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 1,
                                "type", "text.submit", "text", " 你好，世界。 "))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.speech.text").value(" 你好，世界。 "))
                .andExpect(jsonPath("$.speech.speechId").isNotEmpty())
                .andExpect(jsonPath("$.agentMode").value("local-script"));
    }

    @Test
    void rejectsForeignBrowserAndMissingBrowserSession() throws Exception {
        String sessionId = createSession(new MockHttpSession());
        String input = input(sessionId, 1, "hello");
        mvc.perform(post("/api/interaction/event").session(new MockHttpSession())
                        .contentType("application/json").content(input))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("session_forbidden"));
        mvc.perform(post("/api/interaction/event").contentType("application/json").content(input))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/interaction/interrupt").session(new MockHttpSession())
                        .contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 1))))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsDuplicateAndExpiredTurnsAndRepeatsLatestReply() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(sessionId, 2, "最新台词")))
                .andExpect(status().isOk());
        for (int turn : new int[]{1, 2}) {
            mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                            .content(input(sessionId, turn, "旧台词")))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("stale_turn"));
        }
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 3,
                                "type", "action.request", "action", "repeat"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.speech.text").value("最新台词"));
    }

    @Test
    void cancellationArrivingBeforeInputPreventsThatTurnFromRunning() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        mvc.perform(post("/api/interaction/interrupt").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 3))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("cancelled"));
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(sessionId, 3, "已取消台词")))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(sessionId, 4, "新台词")))
                .andExpect(status().isOk());
        mvc.perform(post("/api/interaction/interrupt").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 3))))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "1.5", "\"1\"", "null", "9007199254740992"})
    void rejectsInvalidTurnIds(String value) throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        String json = "{\"sessionId\":\"" + sessionId + "\",\"turnId\":" + value
                + ",\"type\":\"text.submit\",\"text\":\"你好\"}";
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json").content(json))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_request"));
    }

    @Test
    void rejectsUnsupportedEventsAndOversizedMessages() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        for (Map<String, Object> payload : new Map[]{
                Map.of("sessionId", sessionId, "turnId", 1, "type", "unknown", "text", "你好"),
                Map.of("sessionId", sessionId, "turnId", 1, "type", "text.submit", "text", "好".repeat(1001)),
                Map.of("sessionId", sessionId, "turnId", 1, "type", "text.submit", "text", "  "),
                Map.of("sessionId", sessionId, "turnId", 1, "type", "action.request", "action", "unknown")
        }) {
            mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                            .content(mapper.writeValueAsString(payload)))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_request"));
        }
    }

    @Test
    void newSessionInvalidatesPreviousSessionId() throws Exception {
        MockHttpSession browser = new MockHttpSession();
        String previousId = createSession(browser);
        createSession(browser);
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(previousId, 1, "旧会话")))
                .andExpect(status().isForbidden());
    }

    @Test
    void ttsRequiresTheOwnedCurrentReplyBeforeStartingAnyNativeProcess() throws Exception {
        String tts = mapper.writeValueAsString(Map.of("turnId", 1, "text", "本轮回复"));
        mvc.perform(post("/api/interaction/tts").contentType("application/json").content(tts))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("session_forbidden"));
        MockHttpSession browser = new MockHttpSession();
        String sessionId = createSession(browser);
        mvc.perform(post("/api/interaction/tts").session(browser).contentType("application/json").content(tts))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("stale_turn"));
        mvc.perform(post("/api/interaction/event").session(browser).contentType("application/json")
                        .content(input(sessionId, 1, "本轮回复")))
                .andExpect(status().isOk());
        mvc.perform(post("/api/interaction/tts").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("turnId", 1, "text", "任意其他内容"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_request"));
        mvc.perform(post("/api/interaction/interrupt").session(browser).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", 1))))
                .andExpect(status().isOk());
        mvc.perform(post("/api/interaction/tts").session(browser).contentType("application/json").content(tts))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("stale_turn"));
    }

    private String createSession(MockHttpSession browser) throws Exception {
        String body = mvc.perform(post("/api/interaction/session").session(browser))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.turnId").value(0))
                .andExpect(jsonPath("$.state").value("ready"))
                .andExpect(jsonPath("$.agentMode").value("local-script"))
                .andReturn().getResponse().getContentAsString();
        JsonNode response = mapper.readTree(body);
        return response.get("sessionId").textValue();
    }

    private String input(String sessionId, long turnId, String text) throws Exception {
        return mapper.writeValueAsString(Map.of("sessionId", sessionId, "turnId", turnId,
                "type", "text.submit", "text", text));
    }
}
