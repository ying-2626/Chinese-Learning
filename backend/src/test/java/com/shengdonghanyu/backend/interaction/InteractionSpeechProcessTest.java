package com.shengdonghanyu.backend.interaction;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class InteractionSpeechProcessTest {
    @Test
    void newInputInterruptAndCloseDestroyTheBoundProcess() {
        List<Consumer<InteractionSession>> actions = List.of(
                session -> session.begin(2), session -> session.interrupt(1), InteractionSession::close);
        for (Consumer<InteractionSession> action : actions) {
            InteractionSession session = readySession();
            Process process = mock(Process.class);
            session.registerSpeech(1, "你好", process);
            action.accept(session);
            verify(process).destroy();
            ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                    () -> session.completeSpeech(1, process));
            assertEquals(HttpStatus.CONFLICT, failure.getStatusCode());
        }
    }

    @Test
    void processStartedAfterCancellationIsDestroyedDuringRegistration() {
        InteractionSession session = readySession();
        session.interrupt(1);
        Process process = mock(Process.class);
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> session.registerSpeech(1, "你好", process));
        verify(process).destroy();
        assertEquals(HttpStatus.CONFLICT, failure.getStatusCode());
    }

    private InteractionSession readySession() {
        InteractionSession session = new InteractionSession("user-a");
        session.begin(1);
        session.complete(1, "你好");
        return session;
    }
}
