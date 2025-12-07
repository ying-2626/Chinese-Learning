package com.shengdonghanyu.backend.aop;//package com.redamancyxun.springboottemplate.aop;
//
//
//import com.alibaba.fastjson.JSONObject;
//import com.redamancyxun.springboottemplate.domain.OperateLog;
//import com.redamancyxun.springboottemplate.mapper.OperateLogMapper;
//import com.redamancyxun.springboottemplate.utils.JwtClaims;
//import com.redamancyxun.springboottemplate.utils.JwtUtils;
//import jakarta.servlet.http.HttpServletRequest;
//import lombok.extern.slf4j.Slf4j;
//import org.aspectj.lang.ProceedingJoinPoint;
//import org.aspectj.lang.annotation.Around;
//import org.aspectj.lang.annotation.Aspect;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;
//
//import java.time.LocalDateTime;
//import java.util.Arrays;
//
///**
// * 操作日志切面
// * @Author RedamancyXun
// * @Date 2025/9/15 10:20
// * @Version 1.0
// * @Description: 使用AOP记录操作日志，拦截标注了@Log注解的方法，记录操作人、时间、类名、方法名、参数、返回值和耗时等信息，并保存到数据库
// */
//@Slf4j
//@Component
//@Aspect
//public class LogAspect {
//
//    @Autowired
//    private HttpServletRequest request;
//
//    @Autowired
//    private OperateLogMapper operateLogMapper;
//
//    @Around("@annotation(com.redamancyxun.springboottemplate.anno.Log)")
//    public Object recordLog(ProceedingJoinPoint joinPoint) throws Throwable {
//        // 操作人ID - 当前登录员工ID
//        // 获取请求头中的jwt令牌, 解析令牌
//        String jwt = request.getHeader("token");
//        JwtClaims claims = JwtUtils.parseJWT(jwt);
//        Long operateUser = claims.getUserId();
//
//        // 操作时间
//        LocalDateTime operateTime = LocalDateTime.now();
//
//        // 操作类名
//        String className = joinPoint.getTarget().getClass().getName();
//
//        // 操作方法名
//        String methodName = joinPoint.getSignature().getName();
//
//        // 操作方法参数
//        Object[] args = joinPoint.getArgs();
//        String methodParams = Arrays.toString(args);
//
//        long begin = System.currentTimeMillis();
//        // 调用原始目标方法运行
//        Object result = joinPoint.proceed();
//        long end = System.currentTimeMillis();
//
//        // 方法返回值
//        String returnValue = JSONObject.toJSONString(result);
//
//        // 操作耗时
//        Long costTime = end - begin;
//
//
//        // 记录操作日志
//        OperateLog operateLog = new OperateLog(null,operateUser,operateTime,className,methodName,methodParams,returnValue,costTime);
//        operateLogMapper.insert(operateLog);
//
//        log.info("AOP记录操作日志: {}" , operateLog);
//
//        return result;
//    }
//
//}
