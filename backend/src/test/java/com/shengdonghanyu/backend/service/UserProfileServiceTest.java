package com.shengdonghanyu.backend.service;

import com.shengdonghanyu.backend.controller.user.request.UpdateUserProfileRequest;
import com.shengdonghanyu.backend.entity.User;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.UserMapper;
import com.shengdonghanyu.backend.service.impl.UserServiceImpl;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {
    @Mock UserMapper mapper;
    @Mock SessionUtils sessions;
    @InjectMocks UserServiceImpl service;

    @Test void profileRoundTripUsesCurrentUserAndTheFourExistingFields() {
        when(sessions.getUserId()).thenReturn("me");
        User user=User.builder().id("me").nativeLanguage("英语").currentLevel("HSK 2级").build();
        when(mapper.selectById("me")).thenReturn(user);
        Map<?,?> profile=(Map<?,?>)service.getUserProfile();
        assertEquals(4,profile.size()); assertEquals("英语",profile.get("nativeLanguage"));
        UpdateUserProfileRequest update=new UpdateUserProfileRequest(); update.setLearningGoal("通过考试");
        assertThrows(MyException.class,()->service.updateUserProfile(update));
        when(mapper.updateById(user)).thenReturn(1);
        assertEquals("me",service.updateUserProfile(update).getId());
        assertEquals("英语",user.getNativeLanguage()); assertEquals("通过考试",user.getLearningGoal());
    }
}
