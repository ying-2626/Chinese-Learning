//package com.shengdonghanyu.backend.exception;
//
//import jakarta.servlet.http.HttpServletRequest;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.ExceptionHandler;
//import org.springframework.web.bind.annotation.RestControllerAdvice;
//
///**
// * 全局异常处理器
// * @Author RedamancyXun
// * @Date 2025/9/14 15:30
// * @Version 1.0
// * @Description: 通过 @RestControllerAdvice 注解定义全局异常处理器，捕获并处理应用中的各种异常（业务异常、系统异常、其他异常），记录日志，发送通知，并返回统一格式的响应给前端
// */
//@Slf4j
//@RestControllerAdvice
//public class GlobalExceptionHandler {
//
//    @Autowired
//    private NoticeService noticeService;
//
//    /**
//     * 处理业务异常
//     * @param e 业务异常对象
//     * @return 包含业务异常信息的响应
//     */
//    @ExceptionHandler(BusinessException.class)
//    public Result businessExceptionHandler(BusinessException e){
//        // 记录业务异常日志（级别为warn，因为是预期内的异常）
//        log.warn("业务异常: 异常码:{}，异常信息:{}", e.getEnumExceptionType().getErrorCode(), e.getEnumExceptionType().getCodeMessage() ,e);
//
//        // 返回业务异常信息给前端
//        return Result.result(e.getEnumExceptionType());
//    }
//
//    /**
//     * 处理系统异常
//     * @param e 系统异常对象
//     * @param request HTTP请求对象
//     * @return 安抚用户的固定信息
//     */
//    @ExceptionHandler(SystemException.class)
//    public Result systemExceptionHandler(SystemException e, HttpServletRequest request){
//        // 记录日志
//        log.error("系统异常：异常码:{}，异常信息:{}，异常具体信息:{}", e.getEnumExceptionType().getErrorCode(), e.getEnumExceptionType().getCodeMessage(), e);
//
//        // 发送通知给运维
//        noticeService.sendOpsNotice(e, request);
//
//        // 发送邮件给开发人员，包含完整异常信息
//        noticeService.sendDevEmail(e, request);
//
//        // 返回安抚用户的固定信息
//        return Result.fail();
//    }
//
//    /**
//     * 处理其他未预期异常
//     * @param e 系统异常对象
//     * @param request HTTP请求对象
//     * @return 安抚用户的固定信息
//     */
//    @ExceptionHandler(Exception.class)
//    public Result defaultErrorHandler(Exception e, HttpServletRequest request) {
//        // 记录日志
//        log.error("未预期异常：{}", e.getClass().getName(), e);
//
//        // 发送通知给运维
//        noticeService.sendOpsNotice(e, request);
//
//        // 发送邮件给开发人员，包含完整异常信息
//        noticeService.sendDevEmail(e, request);
//
//        // 返回安抚用户的固定信息
//        return Result.fail();
//    }
//}
//
