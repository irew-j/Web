package kr.ac.hs.RandomTrip.trip.controller;

import kr.ac.hs.RandomTrip.trip.dto.ChatMessage;
import kr.ac.hs.RandomTrip.trip.llm.GeminiGuideGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Objects;

/**
 * 가이드 채팅 관련 웹소켓 메시지를 처리하는 컨트롤러.
 */
@Controller
@RequiredArgsConstructor
public class GuideChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GeminiGuideGenerator geminiGuideGenerator;

    /**
     * 사용자의 채팅 메시지를 수신하고, 대화 기록을 바탕으로 Gemini 가이드의 응답을 생성하여 전송합니다.
     * @param chatMessage 사용자가 보낸 채팅 메시지
     * @param headerAccessor 웹소켓 세션 정보를 담고 있는 accessor
     */
    @MessageMapping("/guide.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // 세션 ID와 사용자 메시지 추출
        String sessionId = headerAccessor.getSessionId();
        String userMessage = chatMessage.getMessage();

        // 대화 기록을 이어가는 후속 응답 생성
        GeminiGuideGenerator.GuideResponse guideResponse = geminiGuideGenerator.generateFollowUpGuide(sessionId, userMessage);

        // 클라이언트에게 보낼 응답 메시지 구성
        ChatMessage responseMessage = new ChatMessage();
        responseMessage.setSender("Gemini Guide");
        responseMessage.setReceiver(chatMessage.getSender());
        responseMessage.setDestinationName(chatMessage.getDestinationName());
        responseMessage.setMessage(guideResponse.getReply());

        // 응답에 추천 장소가 포함되어 있는지 여부에 따라 메시지 타입 결정
        if (guideResponse.getPlaceName() != null && !guideResponse.getPlaceName().isBlank()) {
            responseMessage.setType(ChatMessage.MessageType.RECOMMEND);
            responseMessage.setPlaceName(guideResponse.getPlaceName());
        } else {
            responseMessage.setType(ChatMessage.MessageType.TALK);
        }

        // 해당 목적지 토픽을 구독하는 클라이언트에게 메시지 전송
        messagingTemplate.convertAndSend(String.format("/topic/public/%s", chatMessage.getDestinationName()), responseMessage);
    }

    /**
     * 사용자가 채팅방에 처음 참여할 때, 초기 가이드 메시지를 생성하여 전송합니다.
     * @param chatMessage 사용자가 보낸 참여 메시지
     * @param headerAccessor 웹소켓 세션 정보를 담고 있는 accessor
     */
    @MessageMapping("/guide.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // 세션 ID, 목적지, 사용자 이름 추출
        String sessionId = headerAccessor.getSessionId();
        String destinationName = chatMessage.getDestinationName();
        String username = chatMessage.getSender();

        // 웹소켓 세션 속성에 사용자 이름과 목적지 저장
        Objects.requireNonNull(headerAccessor.getSessionAttributes()).put("username", username);
        headerAccessor.getSessionAttributes().put("destinationName", destinationName);

        // 새로운 대화 세션을 시작하는 초기 가이드 응답 생성
        GeminiGuideGenerator.GuideResponse initialGuide = geminiGuideGenerator.generateInitialGuide(sessionId, destinationName);

        // 클라이언트에게 보낼 초기 메시지 구성
        ChatMessage initialMessage = new ChatMessage();
        initialMessage.setType(ChatMessage.MessageType.ENTER);
        initialMessage.setSender("Gemini Guide");
        initialMessage.setReceiver(username);
        initialMessage.setMessage(initialGuide.getReply());
        initialMessage.setDestinationName(destinationName);

        // 해당 목적지 토픽을 구독하는 클라이언트에게 메시지 전송
        messagingTemplate.convertAndSend(String.format("/topic/public/%s", destinationName), initialMessage);
    }
}
