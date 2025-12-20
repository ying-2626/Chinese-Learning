package com.shengdonghanyu.backend.controller.score_action.request;

import com.baomidou.mybatisplus.annotation.TableField;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@ApiModel("创建评分行为请求")
public class ScoreActionRequest {

    @ApiModelProperty("录音文件url")
    private String audioUrl;

    @ApiModelProperty("准确度")
    private Double accuracy;

    @ApiModelProperty("流畅度")
    private Double fluency;

    @ApiModelProperty("完整度")
    private Double completeness;

    @ApiModelProperty("声母分")
    private Double initialSoundScore;

    @ApiModelProperty("韵母分")
    private Double finalSoundScore;

    @ApiModelProperty("声调分")
    private Double toneScore;

    @ApiModelProperty("总分")
    private Double totalScore;

    @ApiModelProperty("建议")
    private String advice;
}
