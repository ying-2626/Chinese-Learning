package com.shengdonghanyu.backend.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT声明信息封装类，用于存储从JWT令牌中解析出的用户信息
 * 实现Serializable接口，便于在分布式系统中传输
 * @Author RedamancyXun
 * @Date 2025/9/15 10:45
 * @Version 1.0
 * @Description: 包含用户ID、用户名、角色列表、令牌签发时间、过期时间等信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtClaims implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long userId;         // 用户ID
    private String username;     // 用户名
    private String roles;        // 角色列表，多个角色用逗号分隔
    private long issuedAt;       // 令牌签发时间（秒）
    private long expirationTime; // 令牌过期时间（秒）
    private String clientId;     // 客户端ID，用于多端认证
    private String tokenType;    // 令牌类型，如"access"或"refresh"

    // 简化的构造方法，适用于常见场景
    public JwtClaims(Long userId, String username, String roles,
                     long issuedAt, long expirationTime) {
        this(userId, username, roles, issuedAt, expirationTime, null, "access");
    }

    /**
     * 将角色字符串转换为列表
     * @return 角色列表
     */
    public List<String> getRoleList() {
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(roles.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
    }

    /**
     * 检查是否包含指定角色
     * @param role 角色名称
     * @return 如果包含返回true，否则返回false
     */
    public boolean hasRole(String role) {
        if (role == null || roles == null) {
            return false;
        }
        return Arrays.stream(roles.split(","))
                    .map(String::trim)
                    .anyMatch(role::equals);
    }

    /**
     * 检查令牌是否已过期
     * @return 如果已过期返回true，否则返回false
     */
    public boolean isExpired() {
        return expirationTime < System.currentTimeMillis() / 1000;
    }

    /**
     * 检查令牌是否即将过期（剩余时间小于指定分钟数）
     * @param minutes 分钟数
     * @return 如果即将过期返回true，否则返回false
     */
    public boolean isAboutToExpire(int minutes) {
        long currentTime = System.currentTimeMillis() / 1000;
        long timeLeft = expirationTime - currentTime;
        return timeLeft > 0 && timeLeft < minutes * 60;
    }

    /**
     * 计算令牌剩余有效时间（秒）
     * @return 剩余有效时间，过期则返回0
     */
    public long getRemainingTime() {
        long currentTime = System.currentTimeMillis() / 1000;
        return Math.max(0, expirationTime - currentTime);
    }
}
    