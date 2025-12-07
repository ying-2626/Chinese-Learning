package com.shengdonghanyu.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@ApiModel("score_action 评分记录")
@TableName(value ="score_action")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreAction {

    @ApiModelProperty("id")
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    @ApiModelProperty("受评用户id")
    @TableField(value = "user_id")
    private String userId;

    @ApiModelProperty("受评语音地址")
    @TableField(value = "audio_url")
    private String audioUrl;

    @ApiModelProperty("准确度")
    @TableField(value = "accuracy")
    private Double accuracy;

    @ApiModelProperty("流畅度")
    @TableField(value = "fluency")
    private Double fluency;

    @ApiModelProperty("完整度")
    @TableField(value = "completeness")
    private Double completeness;

    @ApiModelProperty("声母分")
    @TableField(value = "initial_sound_score")
    private Double initialSoundScore;

    @ApiModelProperty("韵母分")
    @TableField(value = "final_sound_score")
    private Double finalSoundScore;

    @ApiModelProperty("声调分")
    @TableField(value = "tone_score")
    private Double toneScore;

    @ApiModelProperty("总分")
    @TableField(value = "total_score")
    private Double totalScore;

    @ApiModelProperty("改进建议")
    @TableField(value = "advice")
    private String advice;

    @TableLogic
    @TableField(value = "deleted")
    private Integer deleted;
}
