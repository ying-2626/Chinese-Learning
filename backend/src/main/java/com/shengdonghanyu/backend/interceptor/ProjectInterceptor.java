//package com.shengdonghanyu.backend.interceptor;
//
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import org.springframework.stereotype.Component;
//import org.springframework.web.servlet.HandlerInterceptor;
//import org.springframework.web.servlet.ModelAndView;
//
//import java.util.Enumeration;
//
///**
// * 自定义拦截器
// * @Author RedamancyXun
// * @Date 2025/9/14 10:55
// * @Version 1.0
// * @Description: 自定义拦截器，实现 HandlerInterceptor 接口，重写 preHandle、postHandle 和 afterCompletion 方法，在请求处理的不同阶段执行自定义逻辑，例如日志记录、权限校验等
// */
//@Component
//public class ProjectInterceptor implements HandlerInterceptor {
//
//    /**
//     * 在请求处理之前进行调用（Controller方法调用之前）
//     * @param request
//     * @param response
//     * @param handler
//     * @return true 继续处理请求，false 中断请求
//     * @throws Exception
//     */
//    @Override
//    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
//        System.out.println("===== preHandle 方法执行 =====");
//
//        // 1. 获取请求基本信息
//        String requestURI = request.getRequestURI();
//        String method = request.getMethod();
//        String remoteAddr = request.getRemoteAddr();
//        String userAgent = request.getHeader("User-Agent");
//
//        System.out.println("请求URI: " + requestURI);
//        System.out.println("请求方法: " + method);
//        System.out.println("客户端IP: " + remoteAddr);
//        System.out.println("用户代理: " + userAgent);
//
//        // 2. 获取所有请求头信息
//        System.out.println("请求头信息:");
//        Enumeration<String> headerNames = request.getHeaderNames();
//        while (headerNames.hasMoreElements()) {
//            String headerName = headerNames.nextElement();
//            System.out.println(headerName + ": " + request.getHeader(headerName));
//        }
//
//        // 3. 获取请求参数
//        System.out.println("请求参数:");
//        Enumeration<String> parameterNames = request.getParameterNames();
//        while (parameterNames.hasMoreElements()) {
//            String paramName = parameterNames.nextElement();
//            System.out.println(paramName + ": " + request.getParameter(paramName));
//        }
//
//        // 4. 示例：登录检查（实际项目中通常通过Session检查用户是否登录）
//        if (requestURI.startsWith("/admin/") && request.getSession().getAttribute("user") == null) {
//            System.out.println("未登录用户尝试访问管理员页面，进行拦截");
//            response.sendRedirect(request.getContextPath() + "/login");
//
//            // 中断请求流程
//            return false;
//        }
//
//        // 5. 示例：接口访问频率限制（简单实现）
//        String key = "rate_limit:" + remoteAddr + ":" + requestURI;
//        // 实际项目中这里会用 Redis 等实现真正的限流逻辑
//        // 假设允许访问
//        boolean isAllowed = true;
//        if (!isAllowed) {
//            // 429 Too Many Requests
//            response.setStatus(429);
//            response.getWriter().write("请求过于频繁，请稍后再试");
//            return false;
//        }
//
//        // 记录请求开始时间，用于计算处理时间
//        request.setAttribute("startTime", System.currentTimeMillis());
//
//        // 继续流程
//        return true;
//    }
//
//    /**
//     * 请求处理之后进行调用，但是在视图被渲染之前（Controller方法调用之后）
//     * @param request
//     * @param response
//     * @param handler
//     * @param modelAndView
//     * @throws Exception
//     */
//    @Override
//    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
//        System.out.println("===== postHandle 方法执行 =====");
//
//        // 1. 获取响应状态码
//        int status = response.getStatus();
//        System.out.println("响应状态码: " + status);
//
//        // 2. 可以向 ModelAndView 添加公共数据
//        if (modelAndView != null) {
//            modelAndView.addObject("commonMsg", "这是所有页面都能访问的公共信息");
//            String viewName = modelAndView.getViewName();
//            System.out.println("视图名称: " + viewName);
//        }
//
//        // 3. 可以修改响应头
//        // 防止点击劫持
//        response.setHeader("X-Frame-Options", "SAMEORIGIN");
//    }
//
//    /**
//     * 整个请求结束之后被调用，也就是在DispatcherServlet渲染了对应的视图之后执行
//     * 主要用于资源清理工作
//     * @param request
//     * @param response
//     * @param handler
//     * @param e
//     * @throws Exception
//     */
//    @Override
//    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception e) throws Exception {
//        System.out.println("===== afterCompletion 方法执行 =====");
//
//        // 1. 计算请求处理时间
//        Long startTime = (Long) request.getAttribute("startTime");
//        if (startTime != null) {
//            long endTime = System.currentTimeMillis();
//            System.out.println("请求处理耗时: " + (endTime - startTime) + "ms");
//        }
//
//        // 2. 处理异常（如果有的话）
//        if (e != null) {
//            System.out.println("请求处理过程中发生异常: " + e.getMessage());
//            // 可以在这里记录异常日志
//        }
//
//        // 3. 资源清理示例
//        // 例如关闭一些在preHandle中打开的资源
//        System.out.println("请求处理完成，进行资源清理");
//
//        System.out.println("===== 拦截器流程结束 =====");
//        System.out.println();
//    }
//}
