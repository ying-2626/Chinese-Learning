package com.shengdonghanyu.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shengdonghanyu.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
* @description 针对表【user(用户信息)】的数据库操作Mapper
*/
@Mapper
public interface UserMapper extends BaseMapper<User> {

}




