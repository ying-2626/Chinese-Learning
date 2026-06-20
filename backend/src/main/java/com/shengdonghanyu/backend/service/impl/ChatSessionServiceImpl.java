package com.shengdonghanyu.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.shengdonghanyu.backend.entity.ChatMessage;
import com.shengdonghanyu.backend.entity.ChatSession;
import com.shengdonghanyu.backend.mapper.ChatMessageMapper;
import com.shengdonghanyu.backend.mapper.ChatSessionMapper;
import com.shengdonghanyu.backend.service.ChatSessionService;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatSessionServiceImpl implements ChatSessionService {

    @Autowired
    private ChatSessionMapper chatSessionMapper;

    @Autowired
    private ChatMessageMapper chatMessageMapper;

    @Autowired
    private SessionUtils sessionUtils;

    @Override
    public ChatSession createSession(String title) {
        String userId = sessionUtils.getUserId();
        String chatId = UUID.randomUUID().toString();

        ChatSession session = ChatSession.builder()
                .userId(userId)
                .title(title != null && !title.isEmpty() ? title : "新对话")
                .chatId(chatId)
                .build();

        chatSessionMapper.insert(session);
        return session;
    }

    @Override
    public List<ChatSession> listSessions() {
        String userId = sessionUtils.getUserId();
        QueryWrapper<ChatSession> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .orderByDesc("update_time");
        return chatSessionMapper.selectList(wrapper);
    }

    @Override
    public ChatSession updateSessionTitle(Integer sessionId, String title) {
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null) return null;
        session.setTitle(title);
        chatSessionMapper.updateById(session);
        return session;
    }

    @Override
    public boolean deleteSession(Integer sessionId) {
        QueryWrapper<ChatMessage> msgWrapper = new QueryWrapper<>();
        msgWrapper.eq("session_id", sessionId);
        chatMessageMapper.delete(msgWrapper);
        return chatSessionMapper.deleteById(sessionId) > 0;
    }

    @Override
    public ChatMessage saveMessage(Integer sessionId, String role, String content) {
        ChatMessage message = ChatMessage.builder()
                .sessionId(sessionId)
                .role(role)
                .content(content)
                .build();
        chatMessageMapper.insert(message);

        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session != null) {
            session.setUpdateTime(java.time.LocalDateTime.now());
            chatSessionMapper.updateById(session);
        }

        return message;
    }

    @Override
    public List<ChatMessage> listMessages(Integer sessionId) {
        QueryWrapper<ChatMessage> wrapper = new QueryWrapper<>();
        wrapper.eq("session_id", sessionId)
                .orderByAsc("create_time");
        return chatMessageMapper.selectList(wrapper);
    }
}
