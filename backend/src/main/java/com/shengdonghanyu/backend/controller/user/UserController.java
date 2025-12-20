package com.shengdonghanyu.backend.controller.user;

import com.shengdonghanyu.backend.common.Result;
import com.shengdonghanyu.backend.controller.user.response.UserInfoResponse;
import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.service.UserService;
import com.shengdonghanyu.backend.util.SessionUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Api(tags = "用户操作相关接口")
@RestController
@RequestMapping("/user")
@Slf4j
public class UserController {

    @Autowired
    private SessionUtils sessionUtils;

    @Autowired
    private UserService userService;

    /**
     * 登录
     * @param username 用户名
     * @param password 密码
     * @return LoginInfo
     * @throws Exception 异常
     */
    @PostMapping(value = "/login", produces = "application/json")
    @ApiOperation(value = "登录", response = UserInfoResponse.class)
    @ApiImplicitParams({
            @ApiImplicitParam(name = "username", value = "用户名", required = true, paramType = "query", dataType = "String"),
            @ApiImplicitParam(name = "password", value = "密码", required = true, paramType = "query", dataType = "String")
    })
    public Result login(@NotNull @RequestParam("username") String username,
                        @NotNull @RequestParam("password") String password) {
        try {
            return Result.success(userService.login(username, password));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 检测登录状况
     * @return -1 会话过期，0 表示未登录，1 普通用户
     * @throws MyException 通用异常
     */
    @GetMapping(value = "/checkLogin", produces = "application/json")
    public Result checkLogin() throws MyException {
        try {
            return Result.success(userService.checkLogin());
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 登出
     * @return UserInfoResponse
     */
    @PostMapping(value = "/logout", produces = "application/json")
    @ApiOperation(value = "登出", response = UserInfoResponse.class)
    public Result logout() {
        try {
            return Result.success(userService.logout());
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 注册
     * @param username 用户名
     * @param email 邮箱
     * @param password 密码
     * @return UserInfoResponse
     * @throws MyException 通用异常
     */
    @PostMapping(value = "/signup", produces = "application/json")
    @ApiOperation(value = "注册", response = UserInfoResponse.class)
    @ApiImplicitParams({
            @ApiImplicitParam(name = "username", value = "用户名", required = true, paramType = "query", dataType = "String"),
            @ApiImplicitParam(name = "email", value = "邮箱", required = true, paramType = "query", dataType = "String"),
            @ApiImplicitParam(name = "password", value = "密码", required = true, paramType = "query", dataType = "String")
    })
    public Result signup(@NotNull @RequestParam("username") String username,
                         @NotNull @RequestParam("email") String email,
                         @NotNull @RequestParam("password") String password) {
        try {
            return Result.success(userService.signup(username, email, password));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 发送验证邮件
     * @param email 邮箱
     * @return User
     * @throws MyException 通用异常
     */
    @PostMapping(value = "/sendCode", produces = "application/json")
    @ApiOperation(value = "发送验证码")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "email", value = "email", required = true, paramType = "query", dataType = "String"),
    })
    public Result sendCode(@NotNull @RequestParam("email") String email) {
        try {
            return Result.success(userService.sendEmail(email));
        } catch (MyException e) {
            return Result.result(e.getEnumExceptionType());
        }
    }

    /**
     * 验证验证码
     * @param email 邮箱
     * @param code 验证码
     * @return  Boolean
     * @throws MyException 通用异常
     */
    @PostMapping(value = "/verifyCode", produces = "application/json")
    @ApiOperation(value = "验证验证码")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "email", value = "email", required = true, paramType = "query", dataType = "String"),
            @ApiImplicitParam(name = "code", value = "code", required = true, paramType = "query", dataType = "String")
    })
    public Result verifyCode(@NotNull @RequestParam("email") String email,
                             @NotNull @RequestParam("code") String code) {
        try {
            return Result.success(userService.verifyCode(email, code));
        } catch (MyException e) {
            return Result.result(e.getEnumExceptionType());
        }
    }

    /**
     * 获取简单用户信息
     * @return UserInfoResponse
     * @throws MyException 通用异常
     */
    @GetMapping(value = "/getUserInfo", produces = "application/json")
    @ApiOperation(value = "获取用户信息", response = UserInfoResponse.class)
    public Result getUserInfo() {
        try {
            return Result.success(userService.getUserInfo());
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            e.printStackTrace();
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 获取详细用户信息（含历史记录）
     * @return UserInfoResponse
     */
    @GetMapping(value = "/getUserInfoWithHistory", produces = "application/json")
    @ApiOperation(value = "获取详细用户信息（含历史记录）", response = UserInfoResponse.class)
    public Result getUserInfoWithHistory() {
        try {
            return Result.success(userService.getUserInfoWithHistory());
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 查找当前用户的音频评分记录
     * @return 音频评分记录列表
     */
    @GetMapping(value = "/findCurrentUserScoreActions")
    @ApiOperation(value = "查找当前用户的音频评分记录", response = ScoreAction.class, responseContainer = "List")
    public Result findCurrentUserScoreActions() {
        try {
            return Result.success(userService.findScoreActionByUserId(sessionUtils.getUserId()));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 根据用户id查找评分行为
     * @param userId 用户id
     * @return 评分行为列表
     */
    @GetMapping(value = "/findScoreActionByUserId")
    @ApiOperation(value = "根据用户id查找评分行为", response = ScoreAction.class, responseContainer = "List")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "userId", value = "用户id", required = true, dataType = "String", paramType = "query")
    })
    public Result findScoreActionByUserId(@NotNull @RequestParam("userId") String userId) {
        try {
            return Result.success(userService.findScoreActionByUserId(userId));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

//    /**
//     * 更新用户的建议信息（重构为调用 getUserInfoWithHistory，匹配当前实现）
//     * @return UserInfoResponse
//     */
//    @PostMapping(value = "/updateSuggestion", produces = "application/json")
//    @ApiOperation(value = "更新用户的建议信息")
//    public Result updateSuggestion() {
//        try {
//            return Result.success(userService.getUserInfoWithHistory());
//        } catch (Exception e) {
//            if (e instanceof MyException) {
//                return Result.result(((MyException) e).getEnumExceptionType());
//            }
//            return Result.fail(e.getMessage());
//        }
//    }

    /**
     * 修改密码
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @return UserInfoResponse
     * @throws MyException 通用异常
     */
    @PostMapping(value = "/changePassword", produces = "application/json")
    @ApiOperation(value = "修改用户密码", response = UserInfoResponse.class)
    @ApiImplicitParams({
            @ApiImplicitParam(name = "oldPassword", value = "旧密码", required = true, paramType = "query", dataType = "String"),
            @ApiImplicitParam(name = "newPassword", value = "新密码", required = true, paramType = "query", dataType = "String")
    })
    public Result changePassword(@NotNull @RequestParam("oldPassword") String oldPassword,
                                 @NotNull @RequestParam("newPassword") String newPassword) {
        try {
            return Result.success(userService.changePassword(oldPassword, newPassword));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

}
