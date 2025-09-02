package kr.ac.hs.RandomTrip.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 회원가입 관련 에러 (U_ _ _)
    USERNAME_TOO_SHORT(HttpStatus.BAD_REQUEST, "U001", "아이디는 4자 이상이어야 합니다."),
    PASSWORD_TOO_SHORT(HttpStatus.BAD_REQUEST, "U002", "비밀번호는 4자 이상이어야 합니다."),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT, "U003", "이미 존재하는 아이디입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
