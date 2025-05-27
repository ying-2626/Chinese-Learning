package com.jiang.th.utils;

import cn.hutool.core.util.IdUtil;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CodeGeneratorUtil {
    public static  String generateCode(int length){
        return UUID.randomUUID().toString().substring(0,length);
    }
    public static long snowflake(){
        try {
            return IdUtil.getSnowflakeNextId();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
