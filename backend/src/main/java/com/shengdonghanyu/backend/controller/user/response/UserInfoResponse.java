package com.shengdonghanyu.backend.controller.user.response;

import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.entity.User;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@ApiModel("详细用户信息")
public class UserInfoResponse {

    @ApiModelProperty("id")
    private String id;
    
    @ApiModelProperty("用户名")
    private String username;

    @ApiModelProperty("邮箱")
    private String email;

    @ApiModelProperty("SessionId")
    private String sessionId;

    @ApiModelProperty("语音测评历史记录")
    private List<ScoreAction> scoreActionList;


    public UserInfoResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();

        this.sessionId = null;
    }

    public UserInfoResponse(User user, String sessionId) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();

        this.sessionId = sessionId;
    }

    public UserInfoResponse(User user, List<ScoreAction> scoreActionList) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();

        this.sessionId = null;

        this.scoreActionList = scoreActionList;
    }

    public UserInfoResponse(User user, String sessionId, List<ScoreAction> scoreActionList) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();

        this.sessionId = sessionId;

        this.scoreActionList = scoreActionList;
    }
}
