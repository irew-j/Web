package kr.ac.hs.RandomTrip.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ApiPerformanceLogAspect {

    // "performance.logger"라는 이름으로 로거를 생성합니다. 이 이름은 logback-spring.xml에서 사용됩니다.
    private static final Logger performanceLogger = LoggerFactory.getLogger("performance.logger");

    // kr.ac.hs.RandomTrip 패키지 내의 모든 Controller 클래스의 모든 public 메소드에 적용됩니다.
    @Around("execution(* kr.ac.hs.RandomTrip..*Controller.*(..)) || @annotation(org.springframework.messaging.handler.annotation.MessageMapping)")
    public Object logApiPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();
        Object result;

        try {
            // 대상 API 메소드를 실행합니다.
            result = joinPoint.proceed();
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            // API가 성공적으로 실행되었을 때 로그를 기록합니다.
            performanceLogger.info("[SUCCESS] Method: {} | Duration: {}ms", methodName, duration);

        } catch (Throwable throwable) {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            // API 실행 중 예외가 발생했을 때 로그를 기록합니다.
            performanceLogger.error("[FAILURE] Method: {} | Duration: {}ms | Error: {}", methodName, duration, throwable.getMessage());
            
            // 예외를 다시 던져서 Spring의 기본 예외 처리가 동작하도록 합니다.
            throw throwable;
        }

        return result;
    }
}
