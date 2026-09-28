package com.shengdonghanyu.backend.interaction;

import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InteractionSessionConcurrencyTest {
    @Test
    void slowOldReplyCannotReplaceLatestReply() throws Exception {
        verifyLateReplyIsDiscarded(false);
    }

    @Test
    void cancelledReplyCannotBecomeTheReplyToRepeat() throws Exception {
        verifyLateReplyIsDiscarded(true);
    }

    private void verifyLateReplyIsDiscarded(boolean cancel) throws Exception {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        LocalScriptReply local = new LocalScriptReply();
        SessionUtils loginSession = mock(SessionUtils.class);
        when(loginSession.getUserId()).thenReturn("user-a");
        InteractionSessionService service = new InteractionSessionService((event, previous) -> {
            if (event.turnId() == 2) {
                started.countDown();
                try {
                    if (!release.await(5, TimeUnit.SECONDS)) {
                        throw new AssertionError("测试未释放延迟回复");
                    }
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new AssertionError(error);
                }
            }
            return local.reply(event, previous);
        }, new LocalSpeechSynthesis(), loginSession);
        MockHttpSession browser = new MockHttpSession();
        String sessionId = service.create(browser).sessionId();
        service.submit(browser, event(sessionId, 1, "上一条有效回复"));
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<InteractionSessionService.EventResponse> old = executor.submit(
                    () -> service.submit(browser, event(sessionId, 2, "不应生效的迟到回复")));
            assertTrue(started.await(5, TimeUnit.SECONDS));
            if (cancel) {
                service.interrupt(browser, sessionId, 2);
            } else {
                service.submit(browser, event(sessionId, 3, "最新有效回复"));
            }
            release.countDown();
            ExecutionException failure = assertThrows(ExecutionException.class, () -> old.get(5, TimeUnit.SECONDS));
            ResponseStatusException stale = assertInstanceOf(ResponseStatusException.class, failure.getCause());
            assertEquals(HttpStatus.CONFLICT, stale.getStatusCode());
            InteractionSessionService.EventResponse repeated = service.submit(browser,
                    new InteractionSessionService.Event(sessionId, 4, "action.request", null, "repeat"));
            assertEquals(cancel ? "上一条有效回复" : "最新有效回复", repeated.speech().text());
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    private InteractionSessionService.Event event(String sessionId, long turnId, String text) {
        return new InteractionSessionService.Event(sessionId, turnId, "text.submit", text, null);
    }
}
