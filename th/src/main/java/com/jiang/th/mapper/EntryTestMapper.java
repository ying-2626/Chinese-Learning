package com.jiang.th.mapper;

import com.jiang.th.entitty.EntryTest;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface EntryTestMapper {
    @Select("SELECT * FROM entrytest WHERE user_name = #{user_name1}")
    EntryTest findTestUser(@Param("user_name1") String user_name1);

    @Insert("INSERT INTO entrytest (user_name, language, country, grade_level) VALUES (#{username}, #{language}, #{country}, #{grade_level});")
    Boolean inertTestUser(@Param("username") String username, @Param("language") String language, @Param("country") String country, @Param("grade_level") String grade_level);

}
