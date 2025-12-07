package com.shengdonghanyu.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.shengdonghanyu.backend.controller.score_action.request.ScoreActionRequest;
import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.ScoreActionMapper;
import com.shengdonghanyu.backend.service.ScoreActionService;
import com.shengdonghanyu.backend.service.UserService;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

/**
 * 评分操作相关接口实现类
 * @author Redamancy
 * @description 评分行为相关接口实现类
 * @createDate 2024-10-16 22:39:04
 */
@Service
public class ScoreActionServiceImpl implements ScoreActionService {

    @Autowired
    private ScoreActionMapper scoreActionMapper;

    @Autowired
    private SessionUtils sessionUtils;


    /**
     * 创建评分行为
     * @param scoreActionRequest 评分行为请求体
     * @return 评分行为实体
     */
    @Override
    public ScoreAction createScoreAction(ScoreActionRequest scoreActionRequest) {

        ScoreAction scoreAction = ScoreAction.builder()
                .userId(sessionUtils.getUserId())
                .audioUrl(scoreActionRequest.getAudioUrl())
                .accuracy(scoreActionRequest.getAccuracy())
                .fluency(scoreActionRequest.getFluency())
                .completeness(scoreActionRequest.getCompleteness())
                .initialSoundScore(scoreActionRequest.getInitialSoundScore())
                .finalSoundScore(scoreActionRequest.getFinalSoundScore())
                .toneScore(scoreActionRequest.getToneScore())
                .totalScore(scoreActionRequest.getTotalScore())
                .advice(scoreActionRequest.getAdvice())
                .build();

        if (scoreActionMapper.insert(scoreAction) == 0) {
            throw new MyException(EnumExceptionType.INSERT_FAILED);
        }

        return scoreAction;
    }

    /**
     * 将音频文件传输到服务器并返回存储路径
     * @param audioFile 音频文件
     * @return 音频文件存储路径
     */
    @Override
    public String uploadAudioFile(MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new MyException(EnumExceptionType.DATA_IS_NULL);
        }

        try {
            File dir = new File("/var/www/html/audio");
            if (!dir.exists() && !dir.mkdirs()) {
                throw new MyException(EnumExceptionType.INSERT_FAILED);
            }

            String original = audioFile.getOriginalFilename();
            String safeName = (original == null || original.trim().isEmpty()) ? "audio" : original.replaceAll("[^a-zA-Z0-9\\.\\-_%]", "_");
            String filename = System.currentTimeMillis() + "_" + safeName;
            File dest = new File(dir, filename);
            audioFile.transferTo(dest);

            return "https://shengdonghanyu.com" + "/audio/" + filename;
        } catch (Exception e) {
            throw new MyException(EnumExceptionType.INSERT_FAILED);
        }
    }

    /**
     * 查找所有评分行为
     * @return 评分行为列表
     */
    @Override
    public List<ScoreAction> findAllScoreActions() {
        return scoreActionMapper.selectList(new QueryWrapper<>());
    }
}
