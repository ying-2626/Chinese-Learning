package com.jiang.th.controller;

import com.jiang.th.utils.JwtUtil;
import com.jiang.th.utils.UuidUtil;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class TestController {

    @Autowired
    private JwtUtil jwtUtils;

    @RequestMapping("/Hello")
    public String Hello(){
        return "hello world~~~";
    }

    @RequestMapping("/GetToken")
    public String GetToken(ServletRequest servletRequest){
        HttpServletRequest req = (HttpServletRequest) servletRequest;
        String jwtToken = req.getHeader("token");
        System.out.println("Controller提醒您，获取token为"+jwtToken);
        String s = jwtUtils.generateJwt("claim");
        String user_name = jwtUtils.parseClaimUsername(s);
        return user_name;
    }





}
