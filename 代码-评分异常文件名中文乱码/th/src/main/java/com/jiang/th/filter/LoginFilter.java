package com.jiang.th.filter;

import com.jiang.th.entitty.Result;
import com.jiang.th.utils.JwtUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import com.alibaba.fastjson.JSONObject;

import java.io.IOException;
import java.util.regex.Pattern;

@Slf4j
@Component
@WebFilter(urlPatterns = "/*")
@ServletComponentScan("com.jiang.th.filter")
public class LoginFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig)throws ServletException {
        System.out.println("执行 init 初始化方法");
        Filter.super.init(filterConfig);
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        System.out.println("Filter提醒您：拦截到了请求");
        // 获取url
        HttpServletRequest req = (HttpServletRequest) servletRequest;
        HttpServletResponse resp = (HttpServletResponse) servletResponse;

        String method = req.getMethod();
        System.out.println("Filter提醒您：本次请求方式为：" + method);
        if ("OPTIONS".equals(method)) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        String url = req.getRequestURL().toString();
        System.out.println("Filter提醒您：请求的url："+url);
        // 判断注册
        if (url.contains("Register") || url.contains("GetCode") || url.contains("EntryTest")) {
            // 放行
            System.out.println("Filter提醒您：注册操作，放行");
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }
        // 获取token
        String jwt = req.getHeader("token");
        System.out.println("Filter提醒您：获取令牌为"+jwt);
        // 判断令牌是否存在
        // 判断是否是登录界面
        Pattern pattern = Pattern.compile("^.*\\/Login$");
        if (url.contains("Login") ) {
            System.out.println("Filter提醒您：属于登录界面");
            // 登录界面
            if (!StringUtils.hasLength(jwt)) {
                System.out.println("Filter提醒您：token为空，进入登录界面,放行");
                filterChain.doFilter(servletRequest, servletResponse);
                return;
            }
            try {
                JwtUtil.parseClaimUsername(jwt);
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("Filter提醒您：解析令牌失败，返回未登录的错误信息");
                // 放行
                filterChain.doFilter(servletRequest, servletResponse);
                return;
            }

        }
        else {
            // 不是登录也不是注册
            // 不存在
            //String s = JwtUtils.generateJwt("claims");
            if (!StringUtils.hasLength(jwt)) {
                Result error = new Result(405, "NOT_LOGIN", null);
                // Result转为json格式
                String notLogin = JSONObject.toJSONString(error);
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(notLogin);
                return;
            }
            // 存在校验
            try {
//                System.out.println(jwt);
                JwtUtil.parseJWT(jwt);
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("Filter提醒您：解析令牌失败re~~~~");
                Result error = new Result(405, "NOT_LOGIN", null);
                // System.out.println(error);
                // Result转为json格式
                String notLogin = JSONObject.toJSONString(error);
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(notLogin);
                return;
            }
            //
            System.out.println("Filter提醒您：令牌合法，放行");
            System.out.println("Filter提醒您：user_name：" + JwtUtil.parseClaimUsername(jwt));
            req.setAttribute("token", jwt);
            filterChain.doFilter(servletRequest, servletResponse);

        }
    }

    @Override
    public void destroy() {
        Filter.super.destroy();
        System.out.println("执行 destroy 方法");

    }

}
