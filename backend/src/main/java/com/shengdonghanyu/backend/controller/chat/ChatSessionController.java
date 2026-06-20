package com.shengdonghanyu.backend.controller.chat;

import com.shengdonghanyu.backend.common.Result;
import com.shengdonghanyu.backend.entity.ChatMessage;
import com.shengdonghanyu.backend.entity.ChatSession;
import com.shengdonghanyu.backend.service.ChatSessionService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Api(tags = "聊天会话相关接口")
@RestController
@RequestMapping("/chat")
@Slf4j
public class ChatSessionController {

    @Autowired
    private ChatSessionService chatSessionService;

    @PostMapping("/sessions")
    @ApiOperation(value = "创建新会话")
    public Result createSession(@RequestBody(required = false) Map<String, String> body) {
        try {
            String title = (body != null) ? body.get("title") : null;
            ChatSession session = chatSessionService.createSession(title);
            return Result.success(session);
        } catch (Exception e) {
            log.error("创建会话失败", e);
            return Result.fail("创建会话失败");
        }
    }

    @GetMapping("/sessions")
    @ApiOperation(value = "获取当前用户的会话列表")
    public Result listSessions() {
        try {
            List<ChatSession> sessions = chatSessionService.listSessions();
            return Result.success(sessions);
        } catch (Exception e) {
            log.error("获取会话列表失败", e);
            return Result.fail("获取会话列表失败");
        }
    }

    @PutMapping("/sessions/{sessionId}")
    @ApiOperation(value = "更新会话标题")
    public Result updateSessionTitle(@PathVariable Integer sessionId, @RequestBody Map<String, String> body) {
        try {
            String title = body.get("title");
            ChatSession session = chatSessionService.updateSessionTitle(sessionId, title);
            if (session == null) return Result.fail("会话不存在");
            return Result.success(session);
        } catch (Exception e) {
            log.error("更新会话标题失败", e);
            return Result.fail("更新会话标题失败");
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    @ApiOperation(value = "删除会话")
    public Result deleteSession(@PathVariable Integer sessionId) {
        try {
            boolean ok = chatSessionService.deleteSession(sessionId);
            return ok ? Result.success("删除成功") : Result.fail("删除失败");
        } catch (Exception e) {
            log.error("删除会话失败", e);
            return Result.fail("删除会话失败");
        }
    }

    @PostMapping("/sessions/{sessionId}/messages")
    @ApiOperation(value = "保存消息")
    public Result saveMessage(@PathVariable Integer sessionId, @RequestBody Map<String, String> body) {
        try {
            String role = body.get("role");
            String content = body.get("content");
            ChatMessage message = chatSessionService.saveMessage(sessionId, role, content);
            return Result.success(message);
        } catch (Exception e) {
            log.error("保存消息失败", e);
            return Result.fail("保存消息失败");
        }
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @ApiOperation(value = "获取会话消息列表")
    public Result listMessages(@PathVariable Integer sessionId) {
        try {
            List<ChatMessage> messages = chatSessionService.listMessages(sessionId);
            return Result.success(messages);
        } catch (Exception e) {
            log.error("获取消息列表失败", e);
            return Result.fail("获取消息列表失败");
        }
    }
}
