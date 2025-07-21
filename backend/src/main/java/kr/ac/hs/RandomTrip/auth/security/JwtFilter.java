package kr.ac.hs.RandomTrip.auth.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // WebSocket 엔드포인트는 필터 제외
        return path.startsWith("/ws-guide");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);

        Claims claims;
        try {
            claims = jwtUtil.extractToken(token);
        } catch (Exception e) {
            logger.warn("Invalid JWT Token", e);
            filterChain.doFilter(request, response);
            return;
        }

        var authorities = extractAuthorities(claims);

        var customUser = new CustomUser(
                claims.get("username", String.class),
                "", // 비밀번호는 인증 후에는 필요 없음
                authorities
        );
        customUser.displayName = claims.get("displayName", String.class);

        var authToken = new UsernamePasswordAuthenticationToken(
                customUser, null, authorities
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> extractAuthorities(Claims claims) {
        String authoritiesStr = claims.get("authorities", String.class);
        return Arrays.stream(authoritiesStr.split(","))
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}