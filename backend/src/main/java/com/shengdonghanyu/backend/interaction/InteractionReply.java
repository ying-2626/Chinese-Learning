package com.shengdonghanyu.backend.interaction;

/** 将来接 Agent 时替换此处；业务轮次仍由 InteractionSession 管理。 */
@FunctionalInterface
public interface InteractionReply {
    Reply reply(InteractionSessionService.Event event, String previousReply);

    record Reply(String text, String title) {
    }
}
