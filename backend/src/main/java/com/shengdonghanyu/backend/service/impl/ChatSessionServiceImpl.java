package com.shengdonghanyu.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.shengdonghanyu.backend.entity.ChatMessage;
import com.shengdonghanyu.backend.entity.ChatSession;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.ChatMessageMapper;
import com.shengdonghanyu.backend.mapper.ChatSessionMapper;
import com.shengdonghanyu.backend.service.ChatSessionService;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatSessionServiceImpl implements ChatSessionService {
    @Autowired private ChatSessionMapper chatSessionMapper;
    @Autowired private ChatMessageMapper chatMessageMapper;
    @Autowired private SessionUtils sessionUtils;

    private ChatSession ownedSession(Integer sessionId) {
        String userId = sessionUtils.getUserId();
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null || !userId.equals(session.getUserId())) {
            throw new MyException(EnumExceptionType.PERMISSION_DENIED);
        }
        return session;
    }

    private String title(String value) {
        String result = value == null || value.isBlank() ? "新对话" : value.trim();
        if (result.length() > 200) throw new MyException(EnumExceptionType.PARAMETER_ERROR);
        return result;
    }

    @Override
    @Transactional
    public ChatSession createSession(String title) {
        String userId = sessionUtils.getUserId();
        LocalDateTime now = LocalDateTime.now();
        ChatSession session = ChatSession.builder().userId(userId).title(title(title))
                .chatId(UUID.randomUUID().toString()).createTime(now).updateTime(now).deleted(0).build();
        if (chatSessionMapper.insert(session) != 1) throw new MyException(EnumExceptionType.INSERT_FAILED);
        return session;
    }

    @Override
    public List<ChatSession> listSessions() {
        return chatSessionMapper.selectList(new QueryWrapper<ChatSession>()
                .eq("user_id", sessionUtils.getUserId()).orderByDesc("update_time", "id"));
    }

    @Override
    @Transactional
    public ChatSession updateSessionTitle(Integer sessionId, String title) {
        ChatSession session = ownedSession(sessionId);
        session.setTitle(title(title));
        session.setUpdateTime(LocalDateTime.now());
        if (chatSessionMapper.updateById(session) != 1) throw new MyException(EnumExceptionType.UPDATE_FAILED);
        return session;
    }

    @Override
    @Transactional
    public boolean deleteSession(Integer sessionId) {
        ownedSession(sessionId);
        chatMessageMapper.delete(new QueryWrapper<ChatMessage>().eq("session_id", sessionId));
        if (chatSessionMapper.deleteById(sessionId) != 1) throw new MyException(EnumExceptionType.UPDATE_FAILED);
        return true;
    }

    @Override
    @Transactional
    public ChatMessage saveMessage(Integer sessionId, String role, String content) {
        ChatSession session = ownedSession(sessionId);
        if (!List.of("user", "assistant").contains(role == null ? "" : role)
                || content == null || content.isBlank()) {
            throw new MyException(EnumExceptionType.PARAMETER_ERROR);
        }
        ChatMessage message = ChatMessage.builder().sessionId(sessionId).role(role).content(content)
                .createTime(LocalDateTime.now()).deleted(0).build();
        if (chatMessageMapper.insert(message) != 1) throw new MyException(EnumExceptionType.INSERT_FAILED);
        session.setUpdateTime(LocalDateTime.now());
        if (chatSessionMapper.updateById(session) != 1) throw new MyException(EnumExceptionType.UPDATE_FAILED);
        return message;
    }

    @Override
    public List<ChatMessage> listMessages(Integer sessionId) {
        ownedSession(sessionId);
        return chatMessageMapper.selectList(new QueryWrapper<ChatMessage>()
                .eq("session_id", sessionId).orderByAsc("create_time", "id"));
    }
}
