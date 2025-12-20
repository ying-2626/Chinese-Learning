package com.shengdonghanyu.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shengdonghanyu.backend.entity.ScoreAction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @description 针对表【score_action(练习与评价记录)】的数据库操作Mapper
 */
@Mapper
public interface ScoreActionMapper extends BaseMapper<ScoreAction> {

}
