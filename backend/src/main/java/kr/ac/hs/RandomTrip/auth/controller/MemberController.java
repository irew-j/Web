package kr.ac.hs.RandomTrip.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.ac.hs.RandomTrip.auth.dto.LoginRequestDto;
import kr.ac.hs.RandomTrip.auth.dto.MemberResponseDto;
import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import kr.ac.hs.RandomTrip.auth.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth") // 기본 경로 추가
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 및 회원 관련 API") // Tag 추가
public class MemberController {

    // Controller는 Service 계층에만 의존하도록 변경
    private final MemberService memberService;

    @PostMapping("/members") // 경로 변경
    @Operation(summary = "회원가입", description = "새로운 회원을 등록합니다.")
    public void addMember(@RequestParam String username,
                          @RequestParam String password,
                          @RequestParam String displayName) {
        memberService.addMember(username, password, displayName);
    }

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "사용자 인증 후 JWT 토큰을 발급합니다.")
    public Map<String, String> loginJWT(@RequestBody LoginRequestDto loginRequestDto) {
        // 비즈니스 로직(로그인)을 Service 계층에 위임
        String jwt = memberService.login(loginRequestDto);

        // 응답으로 보낼 토큰을 Map에 담아 반환
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
    public MemberResponseDto myPageJWT(Authentication auth) {
        // Principal 객체를 CustomUser 타입으로 캐스팅
        var user = (CustomUser) auth.getPrincipal();

        // DTO의 정적 팩토리 메소드를 사용하여 간결하게 객체를 생성하고 반환
        return MemberResponseDto.from(user);
    }
}
