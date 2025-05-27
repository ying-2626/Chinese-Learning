package com.jiang.th.service;

import com.jiang.th.entitty.EntryTest;
import org.springframework.stereotype.Service;

@Service
public interface EntryTestService {
    EntryTest findUser(String user_name1);
    Boolean insertTestUser(EntryTest et1);
}
