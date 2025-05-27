package com.jiang.th.service;

import org.springframework.stereotype.Service;
import com.jiang.th.entitty.User;

import java.util.List;

@Service
public interface UserService {
    User LoginFindUsername(User user);
    String LoginFindPassword(User user);
    Boolean RegisterInertUser(User newuser);
    List<User> FindAllUser();

}
