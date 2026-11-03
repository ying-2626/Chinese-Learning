package com.shengdonghanyu.backend.interaction;

/** 把本轮已返回的台词合成为可播放的 WAV；实现由 interaction.tts.provider 选择。 */
public interface SpeechSynthesis {
    byte[] synthesize(InteractionSession session, long turnId, String text);
}
