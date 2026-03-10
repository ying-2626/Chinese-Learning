/*
 Navicat Premium Data Transfer

 Source Server         : shengdonghanyu
 Source Server Type    : MySQL
 Source Server Version : 80043
 Source Host           : localhost:3306
 Source Schema         : shengdonghanyu

 Target Server Type    : MySQL
 Target Server Version : 80043
 File Encoding         : 65001

 Date: 09/03/2026 23:57:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for score_action
-- ----------------------------
DROP TABLE IF EXISTS `score_action`;
CREATE TABLE `score_action`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '受评用户id',
  `audio_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '受评语音地址',
  `accuracy` double NULL DEFAULT NULL COMMENT '准确度',
  `fluency` double NULL DEFAULT NULL COMMENT '流畅度',
  `completeness` double NULL DEFAULT NULL COMMENT '完整度',
  `initial_sound_score` double NULL DEFAULT NULL COMMENT '声母分',
  `final_sound_score` double NULL DEFAULT NULL COMMENT '韵母分',
  `tone_score` double NULL DEFAULT NULL COMMENT '声调分',
  `total_score` double NULL DEFAULT NULL COMMENT '总分',
  `advice` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '改进建议',
  `deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除 0=未删 1=已删',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_score_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'score_action 评分记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of score_action
-- ----------------------------
INSERT INTO `score_action` VALUES (1, '1cf096d3', 'http://localhost:8088/audios/1769442502318_recording.mp3', 44.56731033325195, 99.39233660697937, 100, 42.07331323623657, 47.24691491127014, 10, 44.56731033325195, '你的口语测评数据显示出了一些明显的挑战和需要改进的地方。\n\n首先，从整体的准确度来看，你在“内”和“容”这两个字的发音上表现得相当不错，声母和韵母的准确性都很高，显示出你对这些音素的掌握较好。然而，在“输”、“入”、“你”、“想”、“要”、“朗”、“读”等字的发音上，声母和韵母的准确度较低，尤其是“想”、“要”和“读”的发音，可能需要更多的练习来提高这部分的流利度和清晰度。\n\n其次，声调方面，虽然没有具体的声调评测数据，但从整体的发音准确度来看，声调的掌握可能也是一个需要关注的点。确保在发音时能够准确表达出每个字的声调特征是非常重要的。\n\n建议你在练习时，可以多进行声母和韵母的分开练习，尤其是“输”、“入”、“你”、“想”、“要”、“朗”和“读”这几个字的发音。同时，进行声调的专项训练，尝试模仿标准的发音，确保每个字的声调都能准确无误。可以通过听录音、跟读的方式来提高你的发音准确性和流利度。保持积极的练习态度，相信你会有显著的进步！', 0);
INSERT INTO `score_action` VALUES (2, '1cf096d3', 'http://localhost:8088/audios/1769442608781_recording.mp3', 60.46492385864258, 99.4797945022583, 89.99999761581421, 0, 0, 0, 59.86027526855469, '你的口语测评数据为空，无法进行具体的分析和评价。没有音素得分可能是因为漏读了，建议在进行测评时确保每个字的发音都被记录下来。\n\n如果你有其他的口语测评数据或具体的发音问题，请随时分享，我会根据提供的信息进行分析并给出相应的练习建议。保持积极的学习态度，相信你会在汉语口语方面取得进步！', 0);
INSERT INTO `score_action` VALUES (3, '1cf096d3', 'http://localhost:8088/audios/1769442646926_recording.mp3', 47.78438949584961, 99.38828349113464, 89.99999761581421, 0, 0, 0, 47.30654525756836, '你的口语测评数据为空，无法进行具体的分析和评价。没有音素得分可能是因为漏读了，建议在进行测评时确保每个字的发音都被记录下来。\n\n如果你有其他的口语测评数据或具体的发音问题，请随时分享，我会根据提供的信息进行分析并给出相应的练习建议。保持积极的学习态度，相信你会在汉语口语方面取得进步！', 0);
INSERT INTO `score_action` VALUES (4, '1cf096d3', 'http://localhost:8088/audios/1769443139275_recording.mp3', 68.11466979980469, 99.60579872131348, 50, 0, 0, 0, 51.086002349853516, '你的口语测评数据为空，无法进行具体的分析和评价。没有音素得分可能是因为漏读了，建议在进行测评时确保每个字的发音都被记录下来。\n\n如果你有其他的口语测评数据或具体的发音问题，请随时分享，我会根据提供的信息进行分析并给出相应的练习建议。保持积极的学习态度，相信你会在汉语口语方面取得进步！', 0);
INSERT INTO `score_action` VALUES (5, '1cf096d3', 'http://localhost:8088/audios/1769443194628_recording.mp3', 62.62459182739258, 98.28999638557434, 50, 0, 0, 0, 46.96844482421875, '你的口语测评数据为空，无法进行具体的分析和评价。没有音素得分可能是因为漏读了，建议在进行测评时确保每个字的发音都被记录下来。\n\n如果你有其他的口语测评数据或具体的发音问题，请随时分享，我会根据提供的信息进行分析并给出相应的练习建议。保持积极的学习态度，相信你会在汉语口语方面取得进步！', 0);
INSERT INTO `score_action` VALUES (6, '1cf096d3', 'http://localhost:8088/audios/1769443472705_recording.mp3', 66.2131118774414, 98.46801161766052, 30.000001192092896, 0, 0, 0, 33.7686882019043, '你的口语测评数据为空，无法进行具体的分析和评价。没有音素得分可能是因为漏读了，建议在进行测评时确保每个字的发音都被记录下来。\n\n如果你有其他的口语测评数据或具体的发音问题，请随时分享，我会根据提供的信息进行分析并给出相应的练习建议。保持积极的学习态度，相信你会在汉语口语方面取得进步！', 0);
INSERT INTO `score_action` VALUES (7, '1cf096d3', 'http://localhost:8088/audios/1769443617458_recording.mp3', 56.50328063964844, 99.44374561309814, 89.99999761581421, 0, 0, 0, 55.93824768066406, '你的口语测评结果显示出了一些优点和需要改进的地方。整体的流利度非常高，说明你在朗读时能够保持良好的语速和节奏，几乎没有停顿，这对于表达情感和语感是非常重要的。然而，准确度方面存在明显的不足，尤其是在某些字的发音上，准确性较低，影响了整体的表达效果。\n\n在具体的字词中，“入”和“容”的发音准确度较低，可能导致听者的理解困难。此外，“要”这个字的发音未能识别，说明在朗读时可能存在漏读的情况，这需要特别注意。建议在练习时，针对这些发音较弱的字进行重点训练，确保每个字都能清晰地表达出来。\n\n在朗读时，可以尝试放慢语速，特别是在发音不太准确的字词上，给自己更多的时间去调整发音。同时，注意情感的表达，适当的停顿可以帮助强调重点，使得整体朗读更加生动。可以通过模仿标准的朗读录音，进行跟读练习，提升发音的准确性和流利度。保持积极的练习态度，相信你会在汉语口语方面取得更大的进步！', 0);
INSERT INTO `score_action` VALUES (8, '1cf096d3', 'http://localhost:8088/audios/1770131493143_recording.mp3', 57.37466812133789, 62.5859797000885, 100, 61.003320121765135, 65.24734442085028, 50, 57.37466812133789, '你的口语测评结果显示出了一些积极的方面，同时也有需要改进的地方。整体评分较高，准确度和流利度都有不错的表现，说明你在朗读时能够保持良好的节奏和语感，完整度也达到了满分，这表明你能够完整地表达句子内容。继续保持这样的努力，你会在汉语口语方面取得更大的进步！\n\n然而，有几个字的发音准确度较低，需要特别关注。首先，“好”字的发音准确度很低，声调未能识别，可能是因为发音不清晰或漏读。你需要注意这个字的声调是第三声，而不是其他声调。其次，“动”字的发音准确度也不理想，声母的发音几乎没有得分，说明这个字的发音可能漏读了。再者，“汉”字的发音准确度极低，声母和韵母的得分都很低，可能也是漏读的情况。\n\n针对这些问题，建议你在练习时，特别关注声母和韵母的发音，尤其是“好”、“动”和“汉”这几个字。可以通过慢速朗读来加强对每个字的控制，确保发音清晰可辨。同时，尝试多进行跟读练习，模仿标准的发音，提升整体的语感和流利度。可以使用一些发音练习的应用程序，帮助你更好地掌握这些字的发音。保持积极的学习态度，相信你会在汉语口语方面取得更大的进步！', 0);
INSERT INTO `score_action` VALUES (9, '1cf096d3', 'http://localhost:8088/audios/1770131576685_recording.mp3', 78.33331298828125, 89.12574648857117, 100, 95.30094909667969, 69.84949493408203, 0, 78.33331298828125, '你的口语测评结果显示出了一些积极的方面，同时也有需要改进的地方。整体评分相对较高，准确度和流利度都表现得不错，说明你在朗读时能够保持良好的节奏和语感，完整度也达到了满分，这表明你能够完整地表达句子内容。继续保持这样的努力，你会在汉语口语方面取得更大的进步！\n\n不过，在发音准确度方面，有一个字的表现需要特别关注，那就是“汉”字。这个字的发音准确度低于标准，声调未能识别，可能是因为发音不清晰或漏读。具体来看，声母的发音得分较高，但韵母的发音准确度较低，说明在韵母的发音上存在一定的问题。\n\n针对这些问题，建议你在练习时，特别关注韵母的发音，确保发音清晰可辨。可以通过慢速朗读来加强对韵母的控制，确保每个字的发音都准确。同时，尝试多进行跟读练习，模仿标准的发音，提升整体的语感和流利度。可以使用一些发音练习的应用程序，帮助你更好地掌握这个字的发音。保持积极的学习态度，相信你会在汉语口语方面取得更大的进步！', 0);
INSERT INTO `score_action` VALUES (10, '1cf096d3', 'http://localhost:8088/audios/1770132428805_recording.mp3', 81.59099578857422, 55.27546405792236, 100, 85.50176620483398, 77.98273626963298, 58.333333333333336, 81.59099578857422, '你的口语测评结果显示出了一些非常积极的方面，整体评分相对较高，准确度也表现得不错，说明你在朗读时能够较好地表达内容。流利度方面稍显不足，可能在朗读时有些停顿，但完整度达到了满分，表明你能够完整地表达句子内容。继续保持这样的努力，你会在汉语口语方面取得更大的进步！\n\n不过，有几个字的发音准确度低于标准，需要特别关注。首先，“声”字的发音准确度为零，声调未能识别，说明这个字可能漏读了。其次，“汉”字的发音准确度也较低，虽然声母的发音得分较高，但韵母的发音准确度明显不足，可能是发音不清晰。再者，“习”字的发音准确度也低于标准，声母和韵母的得分都不理想，尤其是韵母的发音需要加强。\n\n针对这些问题，建议你在练习时，特别关注这些字的发音，确保每个字的声母和韵母都能清晰表达。可以通过慢速朗读来加强对每个字的控制，确保发音准确。同时，尝试多进行跟读练习，模仿标准的发音，提升整体的语感和流利度。可以使用一些发音练习的应用程序，帮助你更好地掌握这些字的发音。保持积极的学习态度，相信你会在汉语口语方面取得更大的进步！', 0);

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'id',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '密码',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户名',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除 0=未删 1=已删',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'user 用户信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1cf096d3', '123', 'yara', '2528691862@qq.com', 0);

SET FOREIGN_KEY_CHECKS = 1;
