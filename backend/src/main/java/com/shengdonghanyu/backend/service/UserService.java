package com.shengdonghanyu.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shengdonghanyu.backend.controller.user.response.UserInfoResponse;
import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.entity.User;
import com.shengdonghanyu.backend.exception.MyException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
*  针对表【user(用户信息)】的数据库操作Service
*/
public interface UserService extends IService<User> {

    // 注册
    UserInfoResponse signup(String username, String email, String password) throws MyException;

    // 发送验证邮件
    Boolean sendEmail(String email) throws MyException;

    // 验证验证码
    Boolean verifyCode(String email, String code) throws MyException;

    // 登录
    UserInfoResponse login(String username, String password) throws Exception;

    // 检测登录状态（-1 会话过期，0 未登录，1 已登录）
    Integer checkLogin() throws MyException;

    // 注销
    UserInfoResponse logout();

    // 获取简单用户信息
    UserInfoResponse getUserInfo() throws MyException;

    // 获取详细用户信息（含历史记录）
    UserInfoResponse getUserInfoWithHistory() throws MyException;

    // 查找用户的评分记录
    List<ScoreAction> findScoreActionByUserId(String userId);

    // 修改密码
    UserInfoResponse changePassword(String oldPassword, String newPassword) throws MyException;

    // 根据 userId 获取用户信息
    User getUserById(String userId) throws MyException;
}
