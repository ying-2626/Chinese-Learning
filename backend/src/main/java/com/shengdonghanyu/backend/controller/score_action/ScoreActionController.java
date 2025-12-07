package com.shengdonghanyu.backend.controller.score_action;

import com.shengdonghanyu.backend.common.Result;
import com.shengdonghanyu.backend.controller.score_action.request.ScoreActionRequest;
import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.service.ScoreActionService;
import com.shengdonghanyu.backend.util.SessionUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Api(tags = "音频评分相关接口")
@RestController
@RequestMapping("/scoreAction")
@Slf4j
public class ScoreActionController {

    @Autowired
    private ScoreActionService scoreActionService;

    @Autowired
    private SessionUtils sessionUtils;

    /**
     * 创建评分行为
     * @param scoreActionRequest 评分行为请求体
     * @return 评分行为实体
     */
    @PostMapping(value = "/createScoreAction")
    @ApiOperation(value = "创建评分行为", response = ScoreAction.class)
    public Result createScoreAction(@NotNull @RequestBody ScoreActionRequest scoreActionRequest) {
        try {
            return Result.success(scoreActionService.createScoreAction(scoreActionRequest));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 将音频文件传输到服务器并返回存储路径
     * @param audioFile 音频文件
     * @return 音频文件存储路径
     */
    @PostMapping(value = "/uploadAudioFile")
    @ApiOperation(value = "将音频文件传输到服务器并返回存储路径", response = String.class)
    @ApiImplicitParams({
            @ApiImplicitParam(name = "audioFile", value = "音频文件", required = true, dataType = "MultipartFile")
    })
    public Result uploadAudioFile(@NotNull @RequestParam("audioFile") MultipartFile audioFile) {
        try {
            return Result.success(scoreActionService.uploadAudioFile(audioFile));
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

    /**
     * 查找所有评分行为
     * @return 评分行为列表
     */
    @GetMapping(value = "/findAllScoreActions")
    @ApiOperation(value = "查找所有评分行为", response = ScoreAction.class, responseContainer = "List")
    public Result findAllScoreActions() {
        try {
            return Result.success(scoreActionService.findAllScoreActions());
        } catch (Exception e) {
            if (e instanceof MyException) {
                return Result.result(((MyException) e).getEnumExceptionType());
            }
            return Result.fail(e.getMessage());
        }
    }

}
