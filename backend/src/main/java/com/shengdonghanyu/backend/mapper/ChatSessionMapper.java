package com.shengdonghanyu.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shengdonghanyu.backend.entity.ChatSession;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatSessionMapper extends BaseMapper<ChatSession> {
}
