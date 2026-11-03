package com.shengdonghanyu.backend.interaction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/** macOS 本机预览专用（INTERACTION_TTS_PROVIDER=local）；不会自动回退到其他实现。 */
@Component
@ConditionalOnProperty(name = "interaction.tts.provider", havingValue = "local")
public class LocalSpeechSynthesis implements SpeechSynthesis {
    private static final Logger LOG = LoggerFactory.getLogger(LocalSpeechSynthesis.class);

    @Override
    public byte[] synthesize(InteractionSession session, long turnId, String text) {
        session.requireSpeech(turnId, text);
        Path executable = Path.of("/usr/bin/say");
        if (!System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("mac")
                || !Files.isExecutable(executable)) {
            throw unavailable("本地语音预览仅支持提供 /usr/bin/say 的 macOS。");
        }
        Path output = null;
        Process process = null;
        try {
            output = Files.createTempFile("soundarin-tts-", ".wav");
            process = new ProcessBuilder(executable.toString(), "-v", "Tingting", "-o", output.toString(),
                    "--file-format=WAVE", "--data-format=LEI16@22050", "-f", "-")
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();
            session.registerSpeech(turnId, text, process);
            try (OutputStream stdin = process.getOutputStream()) {
                stdin.write(text.getBytes(StandardCharsets.UTF_8));
            }
            if (!process.waitFor(20, TimeUnit.SECONDS)) {
                session.requireSpeechProcess(turnId, process);
                throw unavailable("本地语音生成超时，请缩短台词后重试。");
            }
            session.requireSpeechProcess(turnId, process);
            if (process.exitValue() != 0) {
                throw unavailable("本地语音生成失败，请检查 macOS 的 Tingting 中文语音是否可用。");
            }
            byte[] audio = Files.readAllBytes(output);
            if (audio.length < 44 || audio[0] != 'R' || audio[1] != 'I' || audio[2] != 'F'
                    || audio[3] != 'F' || audio[8] != 'W' || audio[9] != 'A' || audio[10] != 'V' || audio[11] != 'E') {
                throw unavailable("本地语音没有生成有效 WAV 音频。");
            }
            session.completeSpeech(turnId, process);
            return audio;
        } catch (IOException error) {
            // 中断导致的管道关闭应报告过期轮次，不能伪装为一个可播放的成功结果。
            if (process == null) session.requireSpeech(turnId, text);
            else session.requireSpeechProcess(turnId, process);
            throw unavailable("本地语音生成失败，请检查 macOS 的语音服务。");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw unavailable("本地语音生成已中断。");
        } finally {
            if (process != null) {
                session.releaseSpeech(process);
                if (process.isAlive()) {
                    process.destroyForcibly();
                }
            }
            if (output != null) {
                try {
                    Files.deleteIfExists(output);
                } catch (IOException error) {
                    LOG.warn("本地语音临时文件清理失败", error);
                }
            }
        }
    }

    private ResponseStatusException unavailable(String message) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
