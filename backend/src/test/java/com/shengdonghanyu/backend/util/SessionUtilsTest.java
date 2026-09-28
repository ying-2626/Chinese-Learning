package com.shengdonghanyu.backend.util;

import com.shengdonghanyu.backend.dto.SessionData;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionUtilsTest {
    @Mock HttpServletRequest request;
    @Mock RedisUtils redis;
    @InjectMocks SessionUtils sessions;

    @Test void missingHeaderStopsBeforeRedis() {
        MyException error = assertThrows(MyException.class, sessions::getUserId);
        assertEquals(EnumExceptionType.NEED_SESSION_ID, error.getEnumExceptionType());
        verifyNoInteractions(redis);
    }

    @Test void oldTestHeadersAreNotAuthentication() {
        for (String value : new String[]{"shadow", "admin", "superAdmin"}) {
            when(request.getHeader("session")).thenReturn(value);
            when(redis.isExpire(value)).thenReturn(true);
            MyException error = assertThrows(MyException.class, sessions::getUserId);
            assertEquals(EnumExceptionType.LOGIN_HAS_OVERDUE, error.getEnumExceptionType());
            verify(redis).isExpire(value);
        }
    }

    @Test void missingOrWrongRedisPayloadCannotBecomeAnonymousUser() {
        when(request.getHeader("session")).thenReturn("session-1");
        for (Object payload : new Object[]{null, "wrong-type", new SessionData()}) {
            when(redis.get("session-1")).thenReturn(payload);
            MyException error = assertThrows(MyException.class, sessions::getUserId);
            assertEquals(EnumExceptionType.SESSION_IS_INVALID, error.getEnumExceptionType());
        }
    }

    @Test void validRedisSessionReturnsItsUser() {
        when(request.getHeader("session")).thenReturn("session-1");
        SessionData data = new SessionData(); data.setId("user-1");
        when(redis.get("session-1")).thenReturn(data);
        assertEquals("user-1", sessions.getUserId());
    }
}
