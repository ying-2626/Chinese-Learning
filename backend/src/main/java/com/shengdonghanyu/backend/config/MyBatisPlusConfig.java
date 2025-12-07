package com.shengdonghanyu.backend.config;//package com.redamancyxun.springboottemplate.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.io.IOException;

/**
 * MyBatis-Plus 配置类
 * @author RedamancyXun
 * @date 2025/9/14 10:00
 * @version 1.0
 * @description: 配置 MyBatis-Plus 的分页插件和乐观锁插件，提升数据库操作的效率和安全性
 */
@Configuration
public class MyBatisPlusConfig {

    /**
     * 配置 MyBatis-Plus 拦截器，添加分页和乐观锁功能
     * @return MybatisPlusInterceptor
     */
    @Bean
    public MybatisPlusInterceptor mpInterceptor() {
        // 1. 定义 Mp 拦截器
        MybatisPlusInterceptor mpInterceptor = new MybatisPlusInterceptor();
        // 2. 添加具体的拦截器
        mpInterceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        // 3. 添加乐观锁拦截器
        mpInterceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());

        return mpInterceptor;
    }
}
