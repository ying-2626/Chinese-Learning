package com.shengdonghanyu.backend.util;

import io.jsonwebtoken.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT 工具类
 * @author RedamancyXun
 * @date 2025/9/15 10:32
 * @version 1.0
 * @Description: JWT 令牌的生成和解析
 */
@Slf4j
public class JwtUtils {

    // JWT密钥，实际项目中应放在配置文件中
    private static final String SECRET_KEY = "RedamancyXun";

    // 令牌过期时间：2小时（单位：毫秒）
    private static final long EXPIRATION_TIME = 2 * 60 * 60 * 1000;

    // 刷新令牌的过期时间：7天（单位：毫秒）
    private static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

    /**
     * 生成JWT令牌
     * @param claims JWT第二部分负载 payload 中存储的内容
     * @return JWT令牌
     */
    public static String generateToken(Map<String, Object> claims) {
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date()) // 签发时间
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // 过期时间
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY) // 签名算法和密钥
                .compact();
    }

    /**
     * 生成JWT令牌
     * @param userId 用户ID
     * @param username 用户名
     * @param roles 角色列表
     * @return 生成的JWT令牌
     */
    public static String generateToken(Long userId, String username, String roles) {
        // 设置令牌的声明信息
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("roles", roles);

        // 生成并返回令牌
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date()) // 签发时间
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // 过期时间
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY) // 签名算法和密钥
                .compact();
    }

    /**
     * 生成刷新令牌（有效期更长）
     * @param claims JWT第二部分负载 payload 中存储的内容
     * @return 生成的刷新令牌
     */
    public static String generateRefreshToken(Map<String, Object> claims) {
        claims.put("type", "refresh"); // 标记为刷新令牌

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

    /**
     * 生成刷新令牌（有效期更长）
     * @param userId 用户ID
     * @param username 用户名
     * @return 生成的刷新令牌
     */
    public static String generateRefreshToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("type", "refresh"); // 标记为刷新令牌

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

//    /**
//     * 解析JWT令牌
//     * @param jwt JWT令牌
//     * @return JWT第二部分负载 payload 中存储的内容
//     */
//    public static Claims parseJWT(String jwt) {
//        Claims claims = Jwts.parser()
//                .setSigningKey(SECRET_KEY)
//                .parseClaimsJws(jwt)
//                .getBody();
//
//        return claims;
//    }

    /**
     * 解析JWT令牌，获取所有声明信息
     * @param token JWT令牌
     * @return 包含所有声明的Jws<Claims>对象
     * @throws ExpiredJwtException 令牌过期异常
     * @throws MalformedJwtException 令牌格式错误异常
     * @throws SignatureException 签名验证失败异常
     */
    public static JwtClaims parseJWT(String token) throws ExpiredJwtException, MalformedJwtException, SignatureException {
        Claims claims = Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody();

        // 将Claims转换为自定义的JwtClaims对象
        return new JwtClaims(
                claims.get("userId", Long.class),
                claims.get("username", String.class),
                claims.get("roles", String.class),
                claims.getIssuedAt().getTime() / 1000,  // 转换为秒
                claims.getExpiration().getTime() / 1000  // 转换为秒
        );
    }

    /**
     * 刷新令牌：根据旧令牌生成新令牌
     * @param oldToken 旧的JWT令牌
     * @return 新的JWT令牌
     * @throws Exception 令牌解析失败时抛出异常
     */
    public static String refreshToken(String oldToken) throws Exception {
        try {
            // 解析旧令牌，验证其有效性
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET_KEY)
                    .parseClaimsJws(oldToken)
                    .getBody();

            // 从旧令牌中获取用户信息
            Long userId = claims.get("userId", Long.class);
            String username = claims.get("username", String.class);
            String roles = claims.get("roles", String.class);

            // 生成新的令牌，使用相同的用户信息但更新过期时间
            return generateToken(userId, username, roles);

        } catch (ExpiredJwtException e) {
            // 如果旧令牌已过期，但在刷新令牌有效期内，仍可以刷新
            // 注意：这需要配合刷新令牌机制，此处仅为示例
            log.warn("令牌已过期，但尝试刷新: {}", e.getMessage());

            // 从过期的令牌中提取声明（即使过期也能获取到声明）
            Claims claims = e.getClaims();
            Long userId = claims.get("userId", Long.class);
            String username = claims.get("username", String.class);
            String roles = claims.get("roles", String.class);

            // 生成新令牌
            return generateToken(userId, username, roles);
        } catch (Exception e) {
            log.error("刷新令牌失败: {}", e.getMessage());
            throw new Exception("刷新令牌失败: " + e.getMessage());
        }
    }

    /**
     * 从令牌中获取用户名
     * @param token JWT令牌
     * @return 用户名
     */
    public static String getUsernameFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("username", String.class));
    }

    /**
     * 从令牌中获取用户ID
     * @param token JWT令牌
     * @return 用户ID
     */
    public static Long getUserIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("userId", Long.class));
    }

    /**
     * 检查令牌是否过期
     * @param token JWT令牌
     * @return 如果过期返回true，否则返回false
     */
    public static boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * 从令牌中获取过期时间
     * @param token JWT令牌
     * @return 过期时间
     */
    public static Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * 从令牌中获取指定的声明
     * @param token JWT令牌
     * @param claimsResolver 声明解析器
     * @param <T> 声明类型
     * @return 声明值
     */
    public static <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * 从令牌中获取所有声明
     * @param token JWT令牌
     * @return 包含所有声明的Claims对象
     */
    private static Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody();
    }
}
