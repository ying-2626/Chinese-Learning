package com.shengdonghanyu.backend.interaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.shengdonghanyu.backend.exception.MyException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/interaction")
public class InteractionController {
    private static final Logger LOG = LoggerFactory.getLogger(InteractionController.class);
    private final InteractionSessionService sessions;

    public InteractionController(InteractionSessionService sessions) {
        this.sessions = sessions;
    }

    @PostMapping("/session")
    public InteractionSessionService.SessionResponse create(HttpServletRequest request) {
        return sessions.create(request.getSession(true));
    }

    @PostMapping("/event")
    public InteractionSessionService.EventResponse event(@RequestBody JsonNode body, HttpServletRequest request) {
        String sessionId = requiredText(body, "sessionId", 100);
        long turnId = requiredTurnId(body);
        String type = requiredText(body, "type", 30);
        String text = null;
        String action = null;
        switch (type) {
            case "text.submit", "speech.final" -> text = requiredText(body, "text", 1000);
            case "action.request" -> {
                action = requiredText(body, "action", 20);
                if (!"introduce".equals(action) && !"repeat".equals(action)) {
                    throw invalid("不支持此操作。");
                }
            }
            default -> throw invalid("不支持此输入类型。");
        }
        return sessions.submit(request.getSession(false),
                new InteractionSessionService.Event(sessionId, turnId, type, text, action));
    }

    @PostMapping("/interrupt")
    public InteractionSessionService.InterruptResponse interrupt(@RequestBody JsonNode body, HttpServletRequest request) {
        return sessions.interrupt(request.getSession(false), requiredText(body, "sessionId", 100), requiredTurnId(body));
    }

    @PostMapping("/tts")
    public ResponseEntity<byte[]> tts(@RequestBody JsonNode body, HttpServletRequest request) {
        byte[] audio = sessions.synthesize(request.getSession(false), requiredTurnId(body), requiredText(body, "text", 1000));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/wav"))
                .cacheControl(CacheControl.noStore()).contentLength(audio.length).body(audio);
    }

    private String requiredText(JsonNode body, String name, int maxLength) {
        JsonNode value = body.get(name);
        if (value == null || !value.isTextual() || value.textValue().isBlank()
                || value.textValue().length() > maxLength) {
            throw invalid(name + " 必须是 1 到 " + maxLength + " 个字符的文本。");
        }
        return value.textValue();
    }

    private long requiredTurnId(JsonNode body) {
        JsonNode value = body.get("turnId");
        if (value == null || !value.isIntegralNumber() || !value.canConvertToLong()
                || value.longValue() <= 0 || value.longValue() > 9_007_199_254_740_991L) {
            throw invalid("turnId 必须是 JavaScript 安全范围内的正整数。");
        }
        return value.longValue();
    }

    private ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleRejected(ResponseStatusException error) {
        String code = switch (error.getStatusCode().value()) {
            case 403 -> "session_forbidden";
            case 409 -> "stale_turn";
            case 503 -> "speech_unavailable";
            default -> "invalid_request";
        };
        return ResponseEntity.status(error.getStatusCode()).body(new ApiError(code, error.getReason()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedBody() {
        return ResponseEntity.badRequest().body(new ApiError("invalid_request", "请求体必须是有效 JSON。"));
    }

    @ExceptionHandler(MyException.class)
    public ResponseEntity<ApiError> handleAuthentication(MyException error) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError("authentication_required", "登录已失效，请重新登录后使用数字人互动。"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception error) {
        LOG.error("交互请求处理失败", error);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("interaction_failed", "本轮处理失败，请开始新一轮。"));
    }

    public record ApiError(String code, String message) {
    }
}
