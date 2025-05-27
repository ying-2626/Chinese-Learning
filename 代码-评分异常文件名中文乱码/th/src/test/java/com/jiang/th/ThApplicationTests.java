package com.jiang.th;

import com.jiang.th.utils.UuidUtil;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;


@Slf4j
@SpringBootTest
class ThApplicationTests {


	@Test
	void contextLoads() {

        System.out.println(UUID.randomUUID().toString());
		System.out.println("测试输出中文结果111");
	}

}
