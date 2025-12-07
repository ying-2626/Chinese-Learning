//package com.shengdonghanyu.backend.filter;
//
//import com.alibaba.fastjson.JSONObject;
//import com.shengdonghanyu.backend.util.JwtClaims;
//import com.shengdonghanyu.backend.util.JwtUtils;
//import io.jsonwebtoken.ExpiredJwtException;
//import io.jsonwebtoken.MalformedJwtException;
//import io.jsonwebtoken.SignatureException;
//import jakarta.servlet.*;
//import jakarta.servlet.annotation.WebFilter;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.web.servlet.ServletComponentScan;
//import org.springframework.util.StringUtils;
//import com.shengdonghanyu.backend.common.Result;
//import com.shengdonghanyu.backend.exception.EnumExceptionType;
//
//import java.io.IOException;
//import java.io.PrintWriter;
//import java.util.Arrays;
//import java.util.List;
//
///**
// * JWT 认证过滤器
// * @Author RedamancyXun
// * @Date 2025/9/15 16:35
// * @Version 1.0
// * @Description: 处理所有请求，验证JWT令牌的合法性和有效性
// */
//@Slf4j
//@WebFilter(urlPatterns = "/*")
//@ServletComponentScan
//public class ProjectFilter implements Filter {
//
//    // 不需要认证的 URL 列表
//    private static final List<String> EXCLUDE_URLS = Arrays.asList(
//            "/login", "/register", "/captcha", "/reset-password",
//            "/api/public/**", "/swagger-ui/**", "/v3/api-docs/**"
//    );
//
//    // 允许的请求方法（OPTIONS 方法用于预检请求）
//    private static final List<String> ALLOWED_METHODS = Arrays.asList(
//            "GET", "POST", "PUT", "DELETE", "OPTIONS"
//    );
//
//    /**
//     * 过滤器核心方法
//     * @param request
//     * @param response
//     * @param chain
//     * @throws IOException
//     * @throws ServletException
//     */
//    @Override
//    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
//            throws IOException, ServletException {
//        HttpServletRequest req = (HttpServletRequest) request;
//        HttpServletResponse resp = (HttpServletResponse) response;
//
//        // 设置跨域响应头
//        setCorsHeaders(resp);
//
//        // 处理预检请求
//        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
//            resp.setStatus(HttpServletResponse.SC_OK);
//
//            return;
//        }
//
//        // 获取请求相关信息
//        String url = req.getRequestURL().toString();
//        String method = req.getMethod();
//        String remoteAddr = getClientIp(req);
//
//        log.info("收到请求 - URL: {}, 方法: {}, 客户端IP: {}", url, method, remoteAddr);
//
//        // 验证请求方法是否允许
//        if (!ALLOWED_METHODS.contains(method)) {
//            sendErrorResponse(resp, HttpServletResponse.SC_METHOD_NOT_ALLOWED,
//                    "不支持的请求方法: " + method);
//
//            return;
//        }
//
//        // 检查是否为不需要认证的 URL
//        if (isExcludedUrl(url)) {
//            log.info("URL在排除列表中，直接放行: {}", url);
//            chain.doFilter(request, response);
//
//            return;
//        }
//
//        // 获取请求头中的令牌（token）
//        String jwt = req.getHeader("token");
//
//        // 检查令牌是否存在
//        if (!StringUtils.hasLength(jwt)) {
//            log.warn("请求头中未包含token，拒绝访问: {}", url);
//            sendErrorResponse(resp, EnumExceptionType.NOT_LOGON);
//
//            return;
//        }
//
//        try {
//            // 解析并验证token
//            JwtClaims claims = JwtUtils.parseJWT(jwt);
//
//            // 检查token是否过期
//            if (isTokenExpired(claims)) {
//                log.warn("token已过期: {}", url);
//                sendErrorResponse(resp, EnumExceptionType.TOKEN_EXPIRED);
//                return;
//            }
//
//            // 检查token是否即将过期，如果是则刷新token
//            if (isTokenAboutToExpire(claims)) {
//                String newToken = JwtUtils.refreshToken(jwt);
//                resp.setHeader("Refresh-Token", newToken);
//                log.info("token即将过期，已生成新token");
//            }
//
//            // 将用户信息存入请求属性，供后续处理使用
//            req.setAttribute("userId", claims.getUserId());
//            req.setAttribute("username", claims.getUsername());
//            req.setAttribute("roles", claims.getRoles());
//
//            log.info("token验证通过，用户: {}，访问: {}", claims.getUsername(), url);
//
//            // 继续过滤链
//            chain.doFilter(request, response);
//
//        } catch (SignatureException e) {
//            log.error("token签名验证失败: {}", e.getMessage());
//            sendErrorResponse(resp, EnumExceptionType.INVALID_TOKEN);
//        } catch (ExpiredJwtException e) {
//            log.error("token已过期: {}", e.getMessage());
//            sendErrorResponse(resp, EnumExceptionType.TOKEN_EXPIRED);
//        } catch (MalformedJwtException e) {
//            log.error("token格式错误: {}", e.getMessage());
//            sendErrorResponse(resp, EnumExceptionType.INVALID_TOKEN_FORMAT);
//        } catch (Exception e) {
//            log.error("token验证过程中发生错误: {}", e.getMessage(), e);
//            sendErrorResponse(resp, EnumExceptionType.AUTHENTICATION_ERROR);
//        }
//    }
//
//    /**
//     * 设置跨域响应头
//     * @param response HttpServletResponse 对象
//     */
//    private void setCorsHeaders(HttpServletResponse response) {
//        response.setHeader("Access-Control-Allow-Origin", "*");
//        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//        response.setHeader("Access-Control-Allow-Headers", "token, Content-Type, Authorization");
//        response.setHeader("Access-Control-Max-Age", "3600");
//        response.setHeader("Content-Type", "application/json;charset=UTF-8");
//    }
//
//    /**
//     * 判断URL是否在排除列表中
//     * @param url 请求的URL
//     * @return true 如果URL在排除列表中，否则返回false
//     */
//    private boolean isExcludedUrl(String url) {
//        for (String excludeUrl : EXCLUDE_URLS) {
//            if (url.contains(excludeUrl) || url.matches(excludeUrl.replace("**", ".*"))) {
//                return true;
//            }
//        }
//        return false;
//    }
//
//    /**
//     * 获取客户端真实IP地址
//     * @param request HttpServletRequest 对象
//     * @return 客户端IP地址
//     */
//    private String getClientIp(HttpServletRequest request) {
//        String ip = request.getHeader("X-Forwarded-For");
//        if (StringUtils.isEmpty(ip) || "unknown".equalsIgnoreCase(ip)) {
//            ip = request.getHeader("Proxy-Client-IP");
//        }
//        if (StringUtils.isEmpty(ip) || "unknown".equalsIgnoreCase(ip)) {
//            ip = request.getHeader("WL-Proxy-Client-IP");
//        }
//        if (StringUtils.isEmpty(ip) || "unknown".equalsIgnoreCase(ip)) {
//            ip = request.getRemoteAddr();
//        }
//        // 处理多代理情况，取第一个IP
//        if (ip != null && ip.contains(",")) {
//            ip = ip.split(",")[0].trim();
//        }
//        return ip;
//    }
//
//    /**
//     * 检查token是否过期
//     * @param claims JwtClaims 对象
//     * @return true 如果token已过期，否则返回false
//     */
//    private boolean isTokenExpired(JwtClaims claims) {
//        return claims.getExpirationTime() < System.currentTimeMillis() / 1000;
//    }
//
//    /**
//     * 检查token是否即将过期（例如，剩余时间小于30分钟）
//     * @param claims JwtClaims 对象
//     * @return true 如果token即将过期，否则返回false
//     */
//    private boolean isTokenAboutToExpire(JwtClaims claims) {
//        long currentTime = System.currentTimeMillis() / 1000;
//        long expirationTime = claims.getExpirationTime();
//        long timeLeft = expirationTime - currentTime;
//        // 如果剩余时间小于30分钟（1800秒），则认为即将过期
//        return timeLeft > 0 && timeLeft < 1800;
//    }
//
//    /**
//     * 发送错误响应
//     * @param response HttpServletResponse 对象
//     */
//    private void sendErrorResponse(HttpServletResponse response, EnumExceptionType exceptionType)
//            throws IOException {
//        Result error = Result.result(exceptionType);
//        sendJsonResponse(response, exceptionType.getErrorCode(), error);
//    }
//
//    /**
//     * 发送自定义错误响应
//     * @param response   HttpServletResponse 对象
//     */
//    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message)
//            throws IOException {
//        Result error = new Result(statusCode, message, null);
//        sendJsonResponse(response, statusCode, error);
//    }
//
//    /**
//     * 发送JSON格式响应
//     * @param response   HttpServletResponse 对象
//     */
//    private void sendJsonResponse(HttpServletResponse response, int statusCode, Object data)
//            throws IOException {
//        response.setStatus(statusCode);
//        response.setContentType("application/json;charset=UTF-8");
//
//        try (PrintWriter writer = response.getWriter()) {
//            writer.write(JSONObject.toJSONString(data));
//            writer.flush();
//        }
//    }
//
//    /**
//     * 初始化方法，只调用一次
//     * @param filterConfig FilterConfig 对象
//     */
//    @Override
//    public void init(FilterConfig filterConfig) throws ServletException {
//        log.info("JwtAuthenticationFilter 初始化");
//    }
//
//    /**
//     * 销毁方法，只调用一次
//     */
//    @Override
//    public void destroy() {
//        log.info("JwtAuthenticationFilter 销毁");
//    }
//}
