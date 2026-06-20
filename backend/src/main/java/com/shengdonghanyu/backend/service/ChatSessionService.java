package com.shengdonghanyu.backend.service;

import com.shengdonghanyu.backend.entity.ChatMessage;
import com.shengdonghanyu.backend.entity.ChatSession;

import java.util.List;

public interface ChatSessionService {

    ChatSession createSession(String title);

    List<ChatSession> listSessions();

    ChatSession updateSessionTitle(Integer sessionId, String title);

    boolean deleteSession(Integer sessionId);

    ChatMessage saveMessage(Integer sessionId, String role, String content);

    List<ChatMessage> listMessages(Integer sessionId);
}
