package kr.ac.hs.RandomTrip.auth.service;

import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.auth.dto.LoginRequestDto;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    // 로그인 처리를 위해 AuthenticationManagerBuilder와 JwtUtil 주입
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final JwtUtil jwtUtil;

    @Transactional
    public void addMember(String username,
                          String password,
                          String displayName) throws Exception {
        if(username.length() < 4 || password.length() < 4){
            throw new Exception("너무 짧음");
        }
        if(memberRepository.findByUsername(username).isPresent()){
            throw new Exception("존재하는 아이디");
        }
        Member member = new Member();
        member.setUsername(username);
        var hash = passwordEncoder.encode(password);
        member.setPassword(hash);
        member.setDisplayName(displayName);
        member.setRole("ROLE_USER"); // 기본 역할 부여
        memberRepository.save(member);
    }

    /**
     * 로그인 비즈니스 로직을 처리하고 JWT 토큰을 생성합니다.
     * @param loginRequestDto 사용자 ID와 비밀번호
     * @return 생성된 JWT 토큰
     */
    @Transactional
    public String login(LoginRequestDto loginRequestDto) {
        // 1. DTO로부터 인증용 객체(UsernamePasswordAuthenticationToken) 생성
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginRequestDto.getUsername(), loginRequestDto.getPassword());

        // 2. AuthenticationManager를 통해 인증 시도 -> 이 과정에서 MyUserDetailsService.loadUserByUsername 실행
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // 3. 인증 정보를 SecurityContext에 저장
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 4. 인증 정보를 기반으로 JWT 토큰 생성 및 반환
        return jwtUtil.createToken(authentication);
    }
}
