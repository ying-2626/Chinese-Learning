package com.shengdonghanyu.backend.util;

import com.shengdonghanyu.backend.common.CommonConstants;
import com.shengdonghanyu.backend.dto.SessionData;
import com.shengdonghanyu.backend.entity.User;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;


/**
 * @author yannis
 * @version 2020/8/1 18:38
 */
@Component
public class SessionUtils {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private HttpServletRequest request;

    @Autowired
    private HttpServletResponse response;

    @Autowired
    private RedisUtils redisUtil;

    // All callers require a real, unexpired session with a user identity.
    public String getUserId() {
        return getSessionData().getId();
    }

    //根据 userId 从 Redis 中获取 sessionId，如果获取到的对象不是 String 类型则抛出自定义异常
    public String getSessionId(String userId) throws MyException {
        Object obj = redisUtil.get(userId);
//        if(!(obj instanceof String)){
//            throw new MyException(EnumExceptionType.SESSION_NOT_FOUND);
//        }

        return (String) obj;
    }

    //根据请求头中的 sessionId，从 Redis 中获取会话数据，若获取数据为空或会话过期则抛出相应异常
    public SessionData getSessionData() throws MyException {
        //从请求头中获得 sessionId
        String key = request.getHeader("session");

        if (key == null || key.isBlank())
            throw new MyException(EnumExceptionType.NEED_SESSION_ID);
        //检查会话是否过期
        if (redisUtil.isExpire(key)) {
            redisUtil.del(key);
            throw new MyException(EnumExceptionType.LOGIN_HAS_OVERDUE);
        }

        Object stored = redisUtil.get(key);
        if (!(stored instanceof SessionData data) || data.getId() == null || data.getId().isBlank()) {
            throw new MyException(EnumExceptionType.SESSION_IS_INVALID);
        }
        return data;
    }

    //将 sessionId 设置到响应头中
    public void setSessionId(String sessionId) {
        response.setHeader(CommonConstants.SESSION, sessionId);
    }

    //生成一个新的 sessionId，并设置到响应头中
    public String generateSessionId() {
        String sessionId = UUID.randomUUID().toString();
        response.setHeader(CommonConstants.SESSION, sessionId);
        return sessionId;
    }

    //设置响应头中的 Content-Type 为 application/json
    public void ChangeContentType() {
        response.setHeader("Content-Type", "application/json");
    }

    //使会话失效，删除用户的会话数据和 sessionId
    public void invalidate() {
        String sessionId = request.getHeader("session");
        String userId = getUserId();
//        String sessionId = getSessionId(getUserId());
        redisUtil.del(userId);
        redisUtil.del(sessionId);
        //移除请求中名为 CommonConstants.SESSION 的属性，在使会话失效时将之前在请求中存储的会话信息从请求属性中移除
        request.removeAttribute(CommonConstants.SESSION);
    }

    //刷新用户数据，包括会话数据和 sessionId，在 Redis 中设置新的会话数据并更新过期时间
    public void refreshData(User user) throws MyException {

        String sessionId = null;
        String userId = null;
        if (user == null) {
            sessionId = request.getHeader("session");
            userId = getUserId();
            user = userMapper.selectById(userId);
        } else {
            userId = user.getId();
            sessionId = getSessionId(userId);
            if (sessionId == null)
                throw new MyException(EnumExceptionType.NEED_SESSION_ID);
            // 检查会话是否过期
            if (redisUtil.isExpire(sessionId)) {
                redisUtil.del(sessionId);
                throw new MyException(EnumExceptionType.LOGIN_HAS_OVERDUE);
            }
        }

        SessionData sessionData = new SessionData(user);

        // 直接覆盖写入并续期，不能先删再写：删与写之间的并发请求会把会话判为过期并删除，导致用户被登出。
        redisUtil.set(sessionId, sessionData, 86400);
        redisUtil.set(userId, sessionId, 86400);
    }
}
