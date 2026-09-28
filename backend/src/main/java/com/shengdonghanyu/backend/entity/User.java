package com.shengdonghanyu.backend.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@ApiModel("user 用户信息")
@TableName(value ="user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements Serializable {

    @ApiModelProperty("id")
    @TableId(value = "id")
    private String id;

    @ApiModelProperty("密码")
    @TableField(value = "password")
    private String password;

    @ApiModelProperty("用户名")
    @TableField(value = "username")
    private String username;

    @ApiModelProperty("邮箱")
    @TableField(value = "email")
    private String email;

    @TableLogic
    @TableField(value = "deleted")
    private Integer deleted;

    @ApiModelProperty("母语背景")
    @TableField(value = "native_language")
    private String nativeLanguage;

    @ApiModelProperty("当前水平")
    @TableField(value = "current_level")
    private String currentLevel;

    @ApiModelProperty("学习目标")
    @TableField(value = "learning_goal")
    private String learningGoal;

    @ApiModelProperty("学习方向")
    @TableField(value = "learning_direction")
    private String learningDirection;
}