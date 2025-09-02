package kr.ac.hs.RandomTrip.trip.websocket;

import kr.ac.hs.RandomTrip.trip.llm.GeminiGuideGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * 웹소켓 연결 이벤트를 감지하여 관련 비즈니스 로직을 처리하는 리스너 클래스.
 */
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final GeminiGuideGenerator geminiGuideGenerator;

    /**
     * 웹소켓 연결이 끊어지는 이벤트를 처리합니다.
     * 연결이 끊긴 세션의 대화 기록을 메모리에서 삭제하여 누수를 방지합니다.
     * @param event 세션 연결 종료 이벤트 객체
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        logger.info("WebSocket session disconnected: {}. Cleaning up chat history.", sessionId);
        geminiGuideGenerator.endChat(sessionId);
    }
}
