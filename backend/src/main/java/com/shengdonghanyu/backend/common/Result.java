package com.shengdonghanyu.backend.common;


import com.shengdonghanyu.backend.exception.EnumExceptionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 前后端交互数据协议
 * @Author redamancyxun
 * @Date 2025/9/13 15:25
 * @Version 1.0
 * @Description: 前后端交互数据协议，包含状态码、消息和结果数据，统一返回格式，便于前端处理响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {

    private Integer code;

    private String message;

    private Object result;

    public static Result success(Object data) {
        return success("操作成功！", data);
    }

    public static Result success(String mess, Object data) {
        Result m = new Result();
        m.setCode(0);
        m.setResult(data);
        m.setMessage(mess);

        return m;
    }

    public static Result fail() {
        return fail("系统繁忙，请稍后再试。我们的技术团队已收到通知并正在处理。");
    }

    public static Result fail(String mess) {
        return fail(mess, null);
    }

    public static Result fail(String mess, Object data) {
        Result m = new Result();
        m.setCode(-1);
        m.setResult(data);
        m.setMessage(mess);

        return m;
    }

    public static Result result(EnumExceptionType enumExceptionType, Object data) {
        Result m = new Result();
        m.setCode(enumExceptionType.getErrorCode());
        m.setResult(data);
        m.setMessage(enumExceptionType.getCodeMessage());

        return m;
    }

    public static Result result(EnumExceptionType enumExceptionType) {
        return result(enumExceptionType,null);
    }
}
