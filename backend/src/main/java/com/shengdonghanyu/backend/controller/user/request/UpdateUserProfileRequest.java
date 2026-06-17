package com.shengdonghanyu.backend.controller.user.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
@ApiModel("更新用户资料请求")
public class UpdateUserProfileRequest {

    @ApiModelProperty("母语背景")
    private String nativeLanguage;

    @ApiModelProperty("当前水平")
    private String currentLevel;

    @ApiModelProperty("学习目标")
    private String learningGoal;

    @ApiModelProperty("学习方向")
    private String learningDirection;
}
