//package com.shengdonghanyu.backend.util;//package com.redamancyxun.springboottemplate.utils;
//
//import com.baomidou.mybatisplus.annotation.IdType;
//import com.baomidou.mybatisplus.generator.AutoGenerator;
//import com.baomidou.mybatisplus.generator.config.DataSourceConfig;
//import com.baomidou.mybatisplus.generator.config.GlobalConfig;
//import com.baomidou.mybatisplus.generator.config.PackageConfig;
//import com.baomidou.mybatisplus.generator.config.StrategyConfig;
//import org.springframework.beans.factory.annotation.Value;
//
///**
// * MyBatis-Plus 代码生成器
// * @author RedamancyXun
// * @date 2025/9/14 16:28
// * @Version 1.0
// * @Description: 用于根据数据库表结构自动生成对应的实体类、Mapper 接口、等代码，提升开发效率
// */
//public class MyBatisPlusGenerator {
//
//    private static String driverClassName = "com.mysql.cj.jdbc.Driver";
//
//    private static String url = "jdbc:mysql://localhost:3306/springboot_template?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai";
//
//    private static String username = "root";
//
//    private static String password = "a13738780767";
//
//    public static void main(String[] args) {
//
//        // 读取配置文件中的数据库连接信息
//
//
//        // 1. 获取代码生成器的对象
//        AutoGenerator autoGenerator = new AutoGenerator();
//
//        // 设置数据库相关配置
//        DataSourceConfig dataSource = new DataSourceConfig();
//        dataSource.setDriverName(driverClassName);
//        dataSource.setUrl(url);
//        dataSource.setUsername(username);
//        dataSource.setPassword(password);
//        autoGenerator.setDataSource(dataSource);
//
//        // 设置全局配置
//        GlobalConfig globalConfig = new GlobalConfig();
//        // 设置代码生成位置
//        globalConfig.setOutputDir(System.getProperty("user.dir") + "/src/main/java");
//        // 设置生成完毕后是否打开生成代码所在的目录
//        globalConfig.setOpen(false);
//        // 设置作者
//        globalConfig.setAuthor("RedamancyXun");
//        // 设置是否覆盖原始生成的文件
//        globalConfig.setFileOverride(true);
//        // 设置数据层接口名，%s为占位符，指代模块名称
//        globalConfig.setMapperName("%sMapper");
////        // 设置 Id 生成策略
////        globalConfig.setIdType(IdType.ASSIGN_ID);
//        autoGenerator.setGlobalConfig(globalConfig);
//
//        // 设置包名相关配置
//        PackageConfig packageInfo = new PackageConfig();
//        // 设置生成的包名，与代码所在位置不冲突，二者叠加组成完整路径
//        // 设置父包名
//        packageInfo.setParent("com.redamancyxun.springboottemplate");
//        // 设置实体类包名
//        packageInfo.setEntity("domain");
//        // 设置数据层包名
//        packageInfo.setMapper("mapper");
//        autoGenerator.setPackageInfo(packageInfo);
//
//        // 策略设置
//        StrategyConfig strategyConfig = new StrategyConfig();
//        // 设置当前参与生成的表名，参数为可变参数
////        strategyConfig.setInclude("tbl_user");
//        // 设置数据库表的前缀名称，模块名 = 数据库表名 - 前缀名  例如： User = tbl_user - tbl_
//        strategyConfig.setTablePrefix("tbl_");
//        // 设置是否启用 Rest 风格
//        strategyConfig.setRestControllerStyle(true);
//        // 设置乐观锁字段名
//        strategyConfig.setVersionFieldName("version");
//        // 设置逻辑删除字段名
//        strategyConfig.setLogicDeleteFieldName("deleted");
//        // 设置是否启用 lombok
//        strategyConfig.setEntityLombokModel(true);
//        autoGenerator.setStrategy(strategyConfig);
//
//        // 2. 执行生成操作
//        autoGenerator.execute();
//    }
//}
