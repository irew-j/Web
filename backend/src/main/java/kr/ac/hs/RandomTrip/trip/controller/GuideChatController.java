package kr.ac.hs.RandomTrip.trip.controller;

import kr.ac.hs.RandomTrip.trip.dto.ChatMessage;
import kr.ac.hs.RandomTrip.trip.service.GeminiGuideGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class GuideChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GeminiGuideGenerator geminiGuideGenerator;

    @MessageMapping("/guide.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        String destinationName = chatMessage.getDestinationName();
        String userMessage = chatMessage.getMessage();

        // Gemini API를 호출하여 구조화된 가이드 응답 생성
        GeminiGuideGenerator.GuideResponse guideResponse = geminiGuideGenerator.generateGuide(destinationName, userMessage);

        ChatMessage responseMessage = new ChatMessage();
        responseMessage.setSender("Gemini Guide");
        responseMessage.setReceiver(chatMessage.getSender());
        responseMessage.setDestinationName(destinationName);
        responseMessage.setMessage(guideResponse.getReply());

        // 장소 추천이 있는지 확인
        if (guideResponse.getPlaceName() != null && !guideResponse.getPlaceName().isBlank()) {
            responseMessage.setType(ChatMessage.MessageType.RECOMMEND);
            responseMessage.setPlaceName(guideResponse.getPlaceName());
        } else {
            responseMessage.setType(ChatMessage.MessageType.TALK);
        }

        messagingTemplate.convertAndSend(String.format("/topic/public/%s", destinationName), responseMessage);
    }

    @MessageMapping("/guide.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String destinationName = chatMessage.getDestinationName();
        String username = chatMessage.getSender();

        // 세션에 사용자 이름과 목적지 저장
        Objects.requireNonNull(headerAccessor.getSessionAttributes()).put("username", username);
        headerAccessor.getSessionAttributes().put("destinationName", destinationName);

        // 초기 가이드 메시지 생성
        GeminiGuideGenerator.GuideResponse initialGuide = geminiGuideGenerator.generateGuide(destinationName);

        ChatMessage initialMessage = new ChatMessage();
        initialMessage.setType(ChatMessage.MessageType.ENTER);
        initialMessage.setSender("Gemini Guide");
        initialMessage.setReceiver(username);
        initialMessage.setMessage(initialGuide.getReply()); // 응답 객체의 reply 필드 사용
        initialMessage.setDestinationName(destinationName);

        messagingTemplate.convertAndSend(String.format("/topic/public/%s", destinationName), initialMessage);
    }
}
