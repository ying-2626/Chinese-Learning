package com.shengdonghanyu.backend.service;

import com.shengdonghanyu.backend.entity.ChatMessage;
import com.shengdonghanyu.backend.entity.ChatSession;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.ChatMessageMapper;
import com.shengdonghanyu.backend.mapper.ChatSessionMapper;
import com.shengdonghanyu.backend.service.impl.ChatSessionServiceImpl;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatSessionServiceTest {
    @Mock ChatSessionMapper sessions;
    @Mock ChatMessageMapper messages;
    @Mock SessionUtils authentication;
    @InjectMocks ChatSessionServiceImpl service;

    @Test void allOperationsOnAnotherUsersSessionRejectBeforeReadingOrWritingMessages() {
        when(authentication.getUserId()).thenReturn("me");
        when(sessions.selectById(12)).thenReturn(ChatSession.builder().id(12).userId("someone-else").build());
        Runnable[] operations = {() -> service.listMessages(12), () -> service.saveMessage(12,"user","hello"),
                () -> service.updateSessionTitle(12,"title"), () -> service.deleteSession(12)};
        for (Runnable operation : operations) {
            MyException error = assertThrows(MyException.class, operation::run);
            assertEquals(EnumExceptionType.PERMISSION_DENIED, error.getEnumExceptionType());
        }
        verifyNoInteractions(messages);
        verify(sessions, never()).updateById(any());
        verify(sessions, never()).deleteById(12);
    }

    @Test void failedInsertNeverReturnsSuccessfulNewSession() {
        when(authentication.getUserId()).thenReturn("me");
        MyException error=assertThrows(MyException.class,()->service.createSession("title"));
        assertEquals(EnumExceptionType.INSERT_FAILED,error.getEnumExceptionType());
    }

    @Test void newSessionHasOwnerProviderIdAndDatabaseTimestamps() {
        when(authentication.getUserId()).thenReturn("me");
        when(sessions.insert(any())).thenAnswer(invocation -> {
            ChatSession session=invocation.getArgument(0); session.setId(12); return 1;
        });
        ChatSession session=service.createSession("");
        assertEquals(12,session.getId()); assertEquals("me",session.getUserId());
        assertEquals("新对话",session.getTitle()); assertFalse(session.getChatId().isBlank());
        assertNotNull(session.getCreateTime()); assertNotNull(session.getUpdateTime());
        assertEquals(0,session.getDeleted());
    }

    @Test void saveUsesOwnedSessionAndRejectsInvalidRole() {
        when(authentication.getUserId()).thenReturn("me");
        when(sessions.selectById(12)).thenReturn(ChatSession.builder().id(12).userId("me").build());
        assertThrows(MyException.class,()->service.saveMessage(12,"system","override"));
        verifyNoInteractions(messages);
        when(messages.insert(any())).thenReturn(1); when(sessions.updateById(any())).thenReturn(1);
        ChatMessage message=service.saveMessage(12,"assistant","你好");
        assertEquals(12,message.getSessionId()); assertEquals("你好",message.getContent());
        assertNotNull(message.getCreateTime());
    }

    @Test void failedMessageInsertDoesNotTouchConversationTimestamp() {
        when(authentication.getUserId()).thenReturn("me");
        when(sessions.selectById(12)).thenReturn(ChatSession.builder().id(12).userId("me").build());
        assertThrows(MyException.class,()->service.saveMessage(12,"user","hello"));
        verify(sessions,never()).updateById(any());
    }
}
