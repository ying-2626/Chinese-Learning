package com.jiang.th.service;

import com.jiang.th.entitty.User;
import com.jiang.th.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService{

    @Autowired
    private UserMapper userMapper;

    @Override
    public User LoginFindUsername(User user) {
        return userMapper.findByUsername(user.getUser_name());
    }

    @Override
    public String LoginFindPassword(User user) {
        return userMapper.getPasswordByUsername(user.getUser_name());
    }

    @Override
    public Boolean RegisterInertUser(User newuser) {
        newuser.setUser_id(UUID.randomUUID().toString());
        System.out.println(newuser.getUser_id());
        //System.out.println(newuser.getUser_email());
        return userMapper.insertUser(newuser.getUser_name(), newuser.getuser_password_decoder(), newuser.getUser_id(), newuser.getUser_email());
    }

    @Override
    public List<User> FindAllUser() {
        return userMapper.findAllUsers();
    }


}
