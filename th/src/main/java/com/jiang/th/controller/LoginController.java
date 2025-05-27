package com.jiang.th.controller;

import com.jiang.th.entitty.Result;
import com.jiang.th.entitty.User;
import com.jiang.th.mapper.UserMapper;
import com.jiang.th.service.MailMsg;
import com.jiang.th.utils.JwtUtil;
import com.jiang.th.service.UserService;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class LoginController {

    @Autowired
    private UserService userService;
    @Autowired
    private UserMapper userMapper;


    @RequestMapping("/Login")
    @CrossOrigin("*")
    public Result Login(@RequestBody User user ){
        System.out.println("controller提示您：用户"+user.getUser_name()+"正在登录");

        if(userService.LoginFindUsername(user)==null){
            return Result.error(402, "用户名不存在！");
        }
        else if (userService.LoginFindPassword(user).equals(user.getuser_password_decoder())) {
            String jwt = JwtUtil.generateJwt(user.getUser_name());
            return Result.success(jwt);
        }else{
            return Result.error(403, "输入的用户名或密码错误。");
        }

    }

    @Autowired
    private MailMsg mailMsg;

    @RequestMapping("/GetCode")
    @CrossOrigin("*")
    public Result GetCode(@RequestBody String email) throws MessagingException {
        String code = mailMsg.mail(email.substring(1, email.length()-1));
        return Result.success(code);

    }

    @RequestMapping("/Register")
    @CrossOrigin("*")
    public Result Register(@RequestBody User user ){
        System.out.println("controller提示您：用户"+user.getUser_name()+"正在注册");
        //System.out.println(user.getUser_email());

        if(userService.LoginFindUsername(user)!=null){
            return Result.error(405, "用户名已存在，请重新输入。");
        }else {
            if(userService.RegisterInertUser(user)){
                String jwt = JwtUtil.generateJwt(user.getUser_name());
                return Result.success(jwt);
            }else {
                return Result.error();
            }
        }
    }

    @Autowired
    private JwtUtil jwtUtils;

    @RequestMapping("/GetUsername")
    @CrossOrigin("*")
    public Result GetUsername(HttpServletRequest request){
        String jwtToken = (String) request.getAttribute("token");
        try{
            String user_name = jwtUtils.parseClaimUsername(jwtToken);
            return Result.success(user_name);
        }catch (Exception e){
            return Result.error(501, e);

        }

    }
}
