package com.shengdonghanyu.backend.interaction;

import org.springframework.stereotype.Component;

@Component
public class LocalScriptReply implements InteractionReply {
    @Override
    public Reply reply(InteractionSessionService.Event event, String previousReply) {
        if ("action.request".equals(event.type())) {
            if ("introduce".equals(event.action())) {
                return new Reply("你好，我是声动汉语的互动角色。这里正在验证输入、指定台词、播放完成和打断。"
                        + "当前回复来自本地脚本，没有调用大模型。", "互动底座介绍");
            }
            return new Reply(previousReply.isEmpty() ? "还没有可以重复的回复，请先输入一句话。" : previousReply,
                    "重复上一条有效回复");
        }
        return new Reply(event.text(), "speech.final".equals(event.type()) ? "本地脚本：朗读确认转写" : "本地脚本：朗读指定台词");
    }
}
