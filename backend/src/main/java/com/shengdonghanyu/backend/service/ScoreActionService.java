package com.shengdonghanyu.backend.service;

import com.shengdonghanyu.backend.controller.score_action.request.ScoreActionRequest;
import com.shengdonghanyu.backend.entity.ScoreAction;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 评分操作相关接口
 * @author Redamancy
 * @description 评分行为相关接口
 * @createDate 2024-10-16 22:39:04
 */
public interface ScoreActionService {

    // 创建评分行为
    ScoreAction createScoreAction(ScoreActionRequest scoreActionRequest);

    // 将音频文件传输到服务器并返回存储路径
    String uploadAudioFile(MultipartFile audioFile);



    // 查找所有评分记录
    List<ScoreAction> findAllScoreActions();
}
