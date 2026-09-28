package com.shengdonghanyu.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@ApiModel("chat_message 聊天消息")
@TableName(value = "chat_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @ApiModelProperty("id")
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    @ApiModelProperty("会话id")
    @TableField(value = "session_id")
    private Integer sessionId;

    @ApiModelProperty("角色: user/assistant")
    @TableField(value = "role")
    private String role;

    @ApiModelProperty("消息内容")
    @TableField(value = "content")
    private String content;

    @ApiModelProperty("创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private java.time.LocalDateTime createTime;

    @TableLogic
    @TableField(value = "deleted")
    private Integer deleted;
}
