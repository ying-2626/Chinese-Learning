package com.jiang.th.utils;


import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class JwtUtil {
    /**
     * 生成JWT令牌
     *
     * @param claims JWT第二部分负载 payload 中存储的内容
     * @return
     */
    //static SecretKey key = Jwts.SIG.HS256.key().build();

    static SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode("ht1gnaij1moc1com1jiang1th1utils1jwt1zepher1tpku1tf1log"));
    public static String generateJwt(String user_name) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("user_name", user_name);
        Long expire = 43200000L;

        return Jwts.builder()
                .issuer("jiang")
                .subject("magic")
                .expiration(new Date(System.currentTimeMillis() + expire))
                .signWith(key, Jwts.SIG.HS256)
                .claims(claims)
                .compact();

    }

    /**
     * 解析JWT令牌
     *
     * @param jwt JWT令牌
     * @return JWT第二部分负载 payload 中存储的内容
     */
    public static Claims parseJWT(String jwt) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
    }


    public static String parseClaimUsername(String jwt) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload()
                .get("user_name", String.class);
    }


}