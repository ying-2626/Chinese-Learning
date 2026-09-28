package com.shengdonghanyu.backend.interaction;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/** 绑定已登录用户的临时交互轮次；不表示数字人的实际播放状态。 */
final class InteractionSession {
    private final String id = UUID.randomUUID().toString();
    private final String userId;
    private long turnId;
    private boolean cancelled;
    private boolean closed;
    private boolean replyReady;
    private String previousReply = "";
    private Process speechProcess;

    InteractionSession(String userId) {
        this.userId = userId;
    }

    boolean belongsTo(String userId) {
        return this.userId.equals(userId);
    }

    String id() {
        return id;
    }

    synchronized String begin(long nextTurnId) {
        requireOpen();
        if (nextTurnId <= turnId) {
            throw staleTurn();
        }
        stopSpeech();
        turnId = nextTurnId;
        cancelled = false;
        replyReady = false;
        return previousReply;
    }

    synchronized void complete(long completedTurnId, String reply) {
        requireOpen();
        if (completedTurnId != turnId || cancelled) {
            throw staleTurn();
        }
        previousReply = reply;
        replyReady = true;
    }

    synchronized void interrupt(long interruptedTurnId) {
        requireOpen();
        if (interruptedTurnId < turnId) {
            throw staleTurn();
        }
        stopSpeech();
        // 中断可能先于同轮输入到达；保留轮次水位以拒绝随后到达的旧输入。
        turnId = interruptedTurnId;
        cancelled = true;
    }

    synchronized void close() {
        stopSpeech();
        closed = true;
    }

    synchronized void requireSpeech(long requestedTurnId, String text) {
        requireCurrentTurn(requestedTurnId);
        if (!replyReady || !previousReply.equals(text)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "只能合成本轮已经返回的原始回复文本。");
        }
    }

    synchronized void registerSpeech(long requestedTurnId, String text, Process process) {
        try {
            requireSpeech(requestedTurnId, text);
        } catch (RuntimeException error) {
            process.destroy();
            throw error;
        }
        stopSpeech();
        speechProcess = process;
    }

    synchronized void requireSpeechProcess(long requestedTurnId, Process process) {
        requireCurrentTurn(requestedTurnId);
        if (speechProcess != process) {
            throw staleTurn();
        }
    }

    synchronized void completeSpeech(long requestedTurnId, Process process) {
        requireSpeechProcess(requestedTurnId, process);
        speechProcess = null;
    }

    synchronized void releaseSpeech(Process process) {
        if (speechProcess == process) {
            speechProcess = null;
        }
    }

    private void requireCurrentTurn(long requestedTurnId) {
        requireOpen();
        if (requestedTurnId != turnId || cancelled) {
            throw staleTurn();
        }
    }

    private void stopSpeech() {
        if (speechProcess != null) {
            speechProcess.destroy();
            speechProcess = null;
        }
    }

    private void requireOpen() {
        if (closed) {
            throw staleTurn();
        }
    }

    private ResponseStatusException staleTurn() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "此轮输入已过期或已取消，请开始新一轮。");
    }
}
