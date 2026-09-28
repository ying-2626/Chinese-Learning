package com.shengdonghanyu.backend.service;

import com.shengdonghanyu.backend.controller.score_action.request.ScoreActionRequest;
import com.shengdonghanyu.backend.entity.ScoreAction;
import com.shengdonghanyu.backend.exception.EnumExceptionType;
import com.shengdonghanyu.backend.exception.MyException;
import com.shengdonghanyu.backend.mapper.ScoreActionMapper;
import com.shengdonghanyu.backend.service.impl.ScoreActionServiceImpl;
import com.shengdonghanyu.backend.util.SessionUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreActionServiceTest {
    @Mock ScoreActionMapper mapper;
    @Mock SessionUtils sessions;
    @InjectMocks ScoreActionServiceImpl service;
    @TempDir Path directory;

    @Test void localUploadWritesInsideConfiguredDirectoryAndReturnsRelativeUrl() throws Exception {
        when(sessions.getUserId()).thenReturn("me");
        ReflectionTestUtils.setField(service,"audioStorageDir",directory.toString());
        ReflectionTestUtils.setField(service,"audioPublicBaseUrl","/audios/");
        byte[] audio={1,2,3,4};
        String url=service.uploadAudioFile(new MockMultipartFile("audioFile","../../sample.wav","audio/wav",audio));
        assertTrue(url.startsWith("/audios/")); assertFalse(url.substring(8).contains("/"));
        assertArrayEquals(audio,Files.readAllBytes(directory.resolve(url.substring(8))));
        verify(sessions).getUserId();
    }

    @Test void unauthenticatedUploadNeverWritesFile() throws Exception {
        when(sessions.getUserId()).thenThrow(new MyException(EnumExceptionType.NEED_SESSION_ID));
        assertThrows(MyException.class,()->service.uploadAudioFile(new MockMultipartFile("audioFile",new byte[]{1})));
        try (var files=Files.list(directory)) { assertEquals(0,files.count()); }
    }

    @Test void nonAudioUploadCannotBePublishedOnTheApplicationOrigin() {
        when(sessions.getUserId()).thenReturn("me");
        assertThrows(MyException.class,()->service.uploadAudioFile(
                new MockMultipartFile("audioFile","page.html","text/html","<script>alert(1)</script>".getBytes())));
    }

    @Test void failedScoreInsertRejectsAndSuccessfulScoreUsesCurrentOwner() {
        when(sessions.getUserId()).thenReturn("me");
        ScoreActionRequest request=ScoreActionRequest.builder().totalScore(88.0).audioUrl("/audios/sample.wav").build();
        assertThrows(MyException.class,()->service.createScoreAction(request));
        when(mapper.insert(any())).thenReturn(1);
        ScoreAction score=service.createScoreAction(request);
        assertEquals("me",score.getUserId()); assertEquals(88.0,score.getTotalScore());
    }
}
