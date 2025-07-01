package kr.ac.hs.RandomTrip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.ExceptionTranslationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import kr.ac.hs.RandomTrip.auth.security.JwtFilter;

import java.util.*;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf((csrf)-> csrf.disable()); //csrf 끄기
        http.cors(withDefaults());

        http.sessionManagement((session) -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        http.addFilterBefore(new JwtFilter(), ExceptionTranslationFilter.class);

        http.authorizeHttpRequests((authorize) -> authorize
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll() // ⭐ OPTIONS 허용 추가
                .requestMatchers("/**").permitAll()
        );

////        http.formLogin((formLogin) //폼 로그인 기능
////                        -> formLogin.loginPage("/login")
////                        .defaultSuccessUrl("/")
//////                .failureUrl("/fail")
//        );

        http.logout(logout -> logout.logoutUrl("/logout").logoutSuccessUrl("/"));

        return http.build();
    }

    //CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173","https://jolly-pebble-0b2668310.6.azurestaticapps.net","https://randomtripapp-byd3gsg8bhh2f6cx.koreacentral-01.azurewebsites.net")); // React 주소, 백엔드 주소
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // 쿠키 포함 허용 (필요 시)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
