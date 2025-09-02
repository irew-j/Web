package kr.ac.hs.RandomTrip.auth.dto;

import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class MemberResponseDto {
    // API 응답에 필요한 정보만 포함하도록 필드 수정
    private String username;
    private String displayName;
    private List<String> authorities;

    // JSON 라이브러리(Jackson)가 역직렬화 시 사용할 수 있도록 기본 생성자 유지
    public MemberResponseDto() {
    }

    // 모든 필드를 초기화하는 생성자
    private MemberResponseDto(String username, String displayName, List<String> authorities) {
        this.username = username;
        this.displayName = displayName;
        this.authorities = authorities;
    }

    /**
     * CustomUser 객체로부터 MemberResponseDto를 생성하는 정적 팩토리 메소드.
     * 객체 생성 로직을 캡슐화하여 Controller의 코드를 간결하게 만듭니다.
     * @param user 인증된 사용자 정보를 담고 있는 CustomUser 객체
     * @return 변환된 MemberResponseDto 객체
     */
    public static MemberResponseDto from(CustomUser user) {
        // 권한 목록을 문자열 리스트로 변환
        List<String> authorities = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // 생성자를 사용하여 DTO 객체 생성 및 반환
        return new MemberResponseDto(user.getUsername(), user.getDisplayName(), authorities);
    }
}
