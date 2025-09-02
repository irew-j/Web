package kr.ac.hs.RandomTrip.exception;

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * API 에러 발생 시 클라이언트에게 반환되는 표준 에러 응답 DTO
 */
@Getter
public class ErrorResponse {

    private final LocalDateTime timestamp = LocalDateTime.now();
    private final int status;
    private final String error;
    private final String code;
    private final String message;

    public ErrorResponse(ErrorCode errorCode) {
        this.status = errorCode.getStatus().value();
        this.error = errorCode.getStatus().name();
        this.code = errorCode.getCode();
        this.message = errorCode.getMessage();
    }
}
