package com.jiang.th.entitty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.jetbrains.annotations.Contract;
import org.jetbrains.annotations.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {
    private Integer code;//表示状态码，200表示成功，4XX表示客户端错误，5XX表示服务器错误
    private Object message; //message表示具体信息
    private String result; //result：success or error

    @NotNull
    @Contract(" -> new")
    public static Result success() {
        return new Result(200, null, "success");
    }

    @NotNull
    @Contract("_ -> new")
    public static Result success(Object data) {
        return new Result(200, data, "success");
    }

    @NotNull
    @Contract(" -> new")
    public static Result error() {
        return new Result(401, "未知错误", "error" );
    }

    @NotNull
    @Contract("_ -> new")
    public static Result error(Integer code, Object data) {
        return new Result(code, data, "error");
    }

    @Override
    public String toString(){
        return "Result{" +
                "code=" + code +
                ", msg='" + message + '\'' +
                ", result=" + result + '\'' +
                '}';
    }

}
