-- 添加用户学习相关字段
ALTER TABLE `user` 
ADD COLUMN `native_language` VARCHAR(100) DEFAULT NULL COMMENT '母语背景',
ADD COLUMN `current_level` VARCHAR(50) DEFAULT NULL COMMENT '当前水平',
ADD COLUMN `learning_goal` VARCHAR(200) DEFAULT NULL COMMENT '学习目标',
ADD COLUMN `learning_direction` VARCHAR(50) DEFAULT NULL COMMENT '学习方向';
