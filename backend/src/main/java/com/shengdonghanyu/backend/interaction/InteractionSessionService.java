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
    private final LocalSpeechSynthesis speechSynthesis;
    private final SessionUtils loginSession;

    public InteractionSessionService(InteractionReply reply, LocalSpeechSynthesis speechSynthesis, SessionUtils loginSession) {
        this.reply = reply;
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
        // reply 可替换为耗时模型调用，但不能持有状态锁。
        InteractionReply.Reply result = reply.reply(event, previousReply);
        session.complete(event.turnId(), result.text());
        return new EventResponse(session.id(), event.turnId(),
                new Speech(UUID.randomUUID().toString(), result.text()),
                new View(result.title(), result.text()), AGENT_MODE);
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

    public record Event(String sessionId, long turnId, String type, String text, String action) {
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
