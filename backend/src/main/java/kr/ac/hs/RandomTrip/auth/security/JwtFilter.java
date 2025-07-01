package kr.ac.hs.RandomTrip.auth.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;


public class JwtFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        //요청들어올때마다 실행할코드
        Cookie[] cookies = request.getCookies();
        if (cookies == null){
            filterChain.doFilter(request, response);
            return;
        }

        String jwtCookie = null;
        for (Cookie cookie : cookies) {
            if ("jwt".equals(cookie.getName())) {
                jwtCookie = cookie.getValue();
                break;
            }
        }

        if (jwtCookie == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Claims claim;
        try {
            claim = JwtUtil.extractToken(jwtCookie);
        } catch (Exception e) {
            System.out.println("유효기간 만료되거나 이상함");
            filterChain.doFilter(request, response);
            return;
        }

        var arr = claim.get("authorities").toString().split(",");
        var authorities = Arrays.stream(arr)
                .map(a -> new SimpleGrantedAuthority(a)).toList();

        var customUser = new CustomUser(
                claim.get("username").toString(),
                "none",
                authorities
        );
        customUser.displayName = claim.get("displayName").toString();

        var authToken = new UsernamePasswordAuthenticationToken(
                customUser, null, authorities
        );
        authToken.setDetails(new WebAuthenticationDetailsSource()
                .buildDetails(request)
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);


        filterChain.doFilter(request, response);
    }


}
