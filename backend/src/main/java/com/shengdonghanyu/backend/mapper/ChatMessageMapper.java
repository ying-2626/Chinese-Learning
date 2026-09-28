package com.shengdonghanyu.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shengdonghanyu.backend.entity.ChatMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessage> {
}
