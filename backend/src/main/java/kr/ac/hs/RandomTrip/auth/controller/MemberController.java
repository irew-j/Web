package kr.ac.hs.RandomTrip.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import kr.ac.hs.RandomTrip.auth.dto.LoginRequestDto;
import kr.ac.hs.RandomTrip.auth.dto.MemberDto;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import kr.ac.hs.RandomTrip.auth.security.JwtUtil;
import kr.ac.hs.RandomTrip.auth.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth") // 기본 경로 추가
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 및 회원 관련 API") // Tag 추가
public class MemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final JwtUtil jwtUtil;

    @PostMapping("/members") // 경로 변경
    @Operation(summary = "회원가입", description = "새로운 회원을 등록합니다.")
    public void addMember(@RequestParam String username,
                          @RequestParam String password,
                          @RequestParam String displayName) throws Exception {
        memberService.addMember(username, password, displayName);
    }

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "사용자 인증 후 JWT 토큰을 발급합니다.")
    public Map<String, String> loginJWT(@RequestBody LoginRequestDto loginRequestDto,
                           HttpServletResponse response
    ) {
        var authToken = new UsernamePasswordAuthenticationToken(
                loginRequestDto.getUsername(), loginRequestDto.getPassword()
        );
        var auth = authenticationManagerBuilder.getObject().authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(auth);

        var jwt = jwtUtil.createToken(SecurityContextHolder.getContext().getAuthentication());
        Map<String, String> tokenMap = new HashMap<>();
        tokenMap.put("token", jwt);

        return tokenMap;
    }

    @PostMapping("/logout") // 경로 변경
    @Operation(summary = "로그아웃", description = "현재 로그인된 사용자의 세션을 종료합니다.")
    public ResponseEntity<String> logout() {
        SecurityContextHolder.clearContext(); // SecurityContextHolder 초기화
        return ResponseEntity.ok("로그아웃 성공");
    }

    @GetMapping("/my-page")
    @Operation(summary = "마이페이지 정보 조회", description = "현재 로그인된 사용자의 정보를 조회합니다.")
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
}