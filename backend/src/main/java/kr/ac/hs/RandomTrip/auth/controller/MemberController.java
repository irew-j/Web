package kr.ac.hs.RandomTrip.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import kr.ac.hs.RandomTrip.auth.dto.LoginRequestDto;
import kr.ac.hs.RandomTrip.auth.dto.MemberDto;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import kr.ac.hs.RandomTrip.auth.security.JwtUtil;
import kr.ac.hs.RandomTrip.auth.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    @PostMapping("/members")
    public void addMember(String username,
                          String password,
                          String displayName) throws Exception {
        memberService.addMember(username, password, displayName);
    }

    @GetMapping("/user/1")
    @ResponseBody
    public MemberDto user() {
        var a = memberRepository.findById(1L);
        var result = a.get();
        var data = new MemberDto(result.getUsername(), result.getDisplayName());
        return data;
    }

    @PostMapping("/login")
//    public Map<String, String> loginJWT(@RequestBody Map<String, String> data,
//                                        HttpServletResponse response
    public Map<String, String> loginJWT(@RequestBody LoginRequestDto loginRequestDto,
                           HttpServletResponse response
    ) {
        var authToken = new UsernamePasswordAuthenticationToken(
//                data.get("username"), data.get("password")
                loginRequestDto.getUsername(), loginRequestDto.getPassword()
        );
        var auth = authenticationManagerBuilder.getObject().authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(auth);

        var jwt = JwtUtil.createToken(SecurityContextHolder.getContext().getAuthentication());
//        System.out.println(jwt); 테스트용
//        restapi에 쿠키 필요없음
//        var cookie = new Cookie("jwt", jwt);
//        cookie.setMaxAge(60*60); //jwt 유효기간이랑 비슷하게 or 더 길게 설정
//        cookie.setHttpOnly(true);
//        cookie.setPath("/"); //쿠키가 전송될 URL, /설정시 모든 사이트에 전송
//        response.addCookie(cookie);
//        return jwt;
        Map<String, String> tokenMap = new HashMap<>();
        tokenMap.put("token", jwt);

        return tokenMap;
    }


//    @GetMapping("/my-page/jwt")
//    @ResponseBody
//    String myPageJWT(Authentication auth){
//        var user = (CustomUser) auth.getPrincipal();
//        System.out.println(user);
//        System.out.println(user.displayName);
//        System.out.println(user.getAuthorities());
//        return "mypagedata";
//    }

    @GetMapping("/my-page")
    @ResponseBody
    public MemberDto myPageJWT(Authentication auth) {
        var user = (CustomUser) auth.getPrincipal();

        MemberDto memberDto = new MemberDto();
        memberDto.setUsername(user.getUsername());
        memberDto.setDisplayName(user.displayName);
        List<String> authorities = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)  // 권한 이름을 추출
                .collect(Collectors.toList());

        memberDto.setAuthorities(authorities);

        return memberDto;
    }

    //react 연결 test api
    @RestController
    public class HelloController {

        @GetMapping("/api/hello")
        public String hello() {
            return "Hello from Spring Boot!";
        }
    }




}


