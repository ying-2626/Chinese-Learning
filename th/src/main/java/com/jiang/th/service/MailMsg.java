package com.jiang.th.service;

import com.jiang.th.utils.CodeGeneratorUtil;
import jakarta.annotation.Resource;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class MailMsg {
    @Resource
    private JavaMailSenderImpl mailSender;

    @Autowired
    private CodeGeneratorUtil codeGeneratorUtil;

    public String mail(String email) throws MailException, MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        // 随机验证码
        String code = codeGeneratorUtil.generateCode(6);
        // 邮件
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
        helper.setText("声动汉语提醒您，您的验证码为：" + code, true);
        helper.setSubject("声动汉语验证码");
        helper.setTo(email);
        helper.setFrom("2952651469@qq.com");
        mailSender.send(mimeMessage);
        return code;
    }

}