package kr.ac.hs.RandomTrip.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    static final SecretKey key =
            Keys.hmacShaKeyFor(Decoders.BASE64.decode(
                    "asdjfklasjdfwnerwqj123nwltjjrwlj32jjwklnsakdjfkjas"
            ));

    // JWT 만들어주는 함수
    public static String createToken(Authentication auth) {
        var user = (CustomUser) auth.getPrincipal();
        var authorities = auth.getAuthorities().stream().map(a -> a.getAuthority())
                .collect(Collectors.joining(","));

        String jwt = Jwts.builder()
                .claim("username", user.getUsername())
                .claim("displayName", user.displayName)
                .claim("authorities", authorities)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) //유효기간 1시간/ ms 단위
                .signWith(key)
                .compact();
        return jwt;
    }

    // JWT를 파라미터로 입력하면 개봉하는 함수
    public static Claims extractToken(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        return claims;
    }

}
