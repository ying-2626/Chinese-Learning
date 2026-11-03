package com.shengdonghanyu.backend.interaction;

import jakarta.servlet.http.HttpSession;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class InteractionSessionService {
    private static final String SESSION_ATTRIBUTE = InteractionSessionService.class.getName() + ".session";
    private static final String AGENT_MODE = "local-script";
    private final InteractionReply reply;
    private final AgentReply agentReply;
    private final LocalSpeechSynthesis speechSynthesis;
    private final SessionUtils loginSession;

    public InteractionSessionService(InteractionReply reply, AgentReply agentReply,
                                     LocalSpeechSynthesis speechSynthesis, SessionUtils loginSession) {
        this.reply = reply;
        this.agentReply = agentReply;
        this.speechSynthesis = speechSynthesis;
        this.loginSession = loginSession;
    }

    public SessionResponse create(HttpSession httpSession) {
        String userId = loginSession.getUserId();
        synchronized (httpSession) {
            InteractionSession previous = (InteractionSession) httpSession.getAttribute(SESSION_ATTRIBUTE);
            if (previous != null) {
                previous.close();
            }
            InteractionSession session = new InteractionSession(userId);
            httpSession.setAttribute(SESSION_ATTRIBUTE, session);
            return new SessionResponse(session.id(), 0, AGENT_MODE, "ready");
        }
    }

    public EventResponse submit(HttpSession httpSession, Event event) {
        InteractionSession session = requireSession(httpSession, event.sessionId());
        String previousReply = session.begin(event.turnId());
        // 回复可能是耗时模型调用，不能持有状态锁；期间被取消则 complete 拒绝过期轮次。
        InteractionReply.Reply result;
        String mode = AGENT_MODE;
        if ("agent.ask".equals(event.type())) {
            String text = agentReply.reply(event.context(), session.history(), event.text());
            session.completeExchange(event.turnId(), event.text(), text);
            result = new InteractionReply.Reply(text, "数字人回答");
            mode = "agent";
        } else {
            result = reply.reply(event, previousReply);
            session.complete(event.turnId(), result.text());
        }
        return new EventResponse(session.id(), event.turnId(),
                new Speech(UUID.randomUUID().toString(), result.text()),
                new View(result.title(), result.text()), mode);
    }

    public InterruptResponse interrupt(HttpSession httpSession, String sessionId, long turnId) {
        InteractionSession session = requireSession(httpSession, sessionId);
        session.interrupt(turnId);
        return new InterruptResponse(session.id(), turnId, "cancelled");
    }

    public byte[] synthesize(HttpSession httpSession, long turnId, String text) {
        return speechSynthesis.synthesize(requireSession(httpSession), turnId, text);
    }

    private InteractionSession requireSession(HttpSession httpSession, String sessionId) {
        InteractionSession session = requireSession(httpSession);
        if (!session.id().equals(sessionId)) {
            throw forbiddenSession();
        }
        return session;
    }

    private InteractionSession requireSession(HttpSession httpSession) {
        String userId = loginSession.getUserId();
        if (httpSession != null) {
            synchronized (httpSession) {
                InteractionSession session = (InteractionSession) httpSession.getAttribute(SESSION_ATTRIBUTE);
                if (session != null && session.belongsTo(userId)) {
                    return session;
                }
            }
        }
        throw forbiddenSession();
    }

    private ResponseStatusException forbiddenSession() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "交互会话不存在或不属于当前登录用户，请重新开始。");
    }

    public record Event(String sessionId, long turnId, String type, String text, String action, String context) {
        public Event(String sessionId, long turnId, String type, String text, String action) {
            this(sessionId, turnId, type, text, action, null);
        }
    }

    public record SessionResponse(String sessionId, long turnId, String agentMode, String state) {
    }

    public record Speech(String speechId, String text) {
    }

    public record View(String title, String body) {
    }

    public record EventResponse(String sessionId, long turnId, Speech speech, View view, String agentMode) {
    }

    public record InterruptResponse(String sessionId, long turnId, String state) {
    }
}
