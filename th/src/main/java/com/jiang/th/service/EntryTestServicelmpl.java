package com.jiang.th.service;

import com.jiang.th.entitty.EntryTest;
import com.jiang.th.mapper.EntryTestMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EntryTestServicelmpl implements EntryTestService{
    @Autowired
    EntryTestMapper entryTestMapper;

    @Override
    public EntryTest findUser(String user_name1) {
        return entryTestMapper.findTestUser(user_name1);
    }

    @Override
    public Boolean insertTestUser(EntryTest et1) {
        return entryTestMapper.inertTestUser(et1.getUser_name(), et1.getLanguage(), et1.getCountry(), et1.getGrade_level());
    }
}
