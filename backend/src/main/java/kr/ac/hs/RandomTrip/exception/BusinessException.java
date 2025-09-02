package kr.ac.hs.RandomTrip.exception;

import lombok.Getter;

/**
 * 비즈니스 로직상 발생할 수 있는 예외의 최상위 클래스.
 * 모든 비즈니스 예외는 이 클래스를 상속받아 구현합니다.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
