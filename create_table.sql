CREATE TABLE `user` (
  `id` VARCHAR(36) NOT NULL COMMENT 'id',
  `password` VARCHAR(255) DEFAULT NULL COMMENT '密码',
  `username` VARCHAR(100) DEFAULT NULL COMMENT '用户名',
  `email` VARCHAR(255) DEFAULT NULL COMMENT '邮箱',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除 0=未删 1=已删',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='user 用户信息';

CREATE TABLE `score_action` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'id',
  `user_id` VARCHAR(36) NOT NULL COMMENT '受评用户id',
  `audio_url` VARCHAR(512) DEFAULT NULL COMMENT '受评语音地址',
  `accuracy` DOUBLE DEFAULT NULL COMMENT '准确度',
  `fluency` DOUBLE DEFAULT NULL COMMENT '流畅度',
  `completeness` DOUBLE DEFAULT NULL COMMENT '完整度',
  `initial_sound_score` DOUBLE DEFAULT NULL COMMENT '声母分',
  `final_sound_score` DOUBLE DEFAULT NULL COMMENT '韵母分',
  `tone_score` DOUBLE DEFAULT NULL COMMENT '声调分',
  `total_score` DOUBLE DEFAULT NULL COMMENT '总分',
  `advice` TEXT DEFAULT NULL COMMENT '改进建议',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除 0=未删 1=已删',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_score_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='score_action 评分记录';
