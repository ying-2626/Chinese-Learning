package com.jiang.th.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.jiang.th.entitty.User;

import java.util.List;

@Mapper
public interface UserMapper {

    @Select("select * from user where user_name = #{user_name} and user_password = #{user_password}")
    User getByUsernameAndPassword(User user);

    @Select("SELECT * FROM user WHERE user_name = #{username}")
    User findByUsername(@Param("username") String username);


    @Select("SELECT user_password FROM user WHERE user_name = #{username}")
    String getPasswordByUsername(@Param("username") String username);

    @Select("SELECT * FROM user")
    List<User> findAllUsers();

    @Insert("INSERT INTO user (user_name, user_password, user_id, user_email) VALUES (#{newuser_name}, #{newuser_password}, #{newuser_id}, #{newuser_email})")
    Boolean insertUser(@Param("newuser_name") String username,
                       @Param("newuser_password") String user_password,
                       @Param("newuser_id") String newuser_id,
                       @Param("newuser_email") String newuser_email);
}
