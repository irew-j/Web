package kr.ac.hs.RandomTrip.guidechat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.hs.RandomTrip.guidechat.dto.ChatMessageDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GuideChatControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        List<Transport> transports = List.of(new WebSocketTransport(new StandardWebSocketClient()));
        SockJsClient sockJsClient = new SockJsClient(transports);
        this.stompClient = new WebSocketStompClient(sockJsClient);
        this.stompClient.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @DisplayName("가이드 챗봇 접속 및 실제 API 호출 20회 반복 테스트")
    @RepeatedTest(20)
    void addUser_and_getRealResponse_Repeated() throws Exception {
        // given
        String destinationName = "경복궁";
        CompletableFuture<ChatMessageDto> completableFuture = new CompletableFuture<>();

        // when
        StompSession stompSession = stompClient.connectAsync(String.format("ws://localhost:%d/ws-guide", port), new StompSessionHandlerAdapter() {}).get(1, TimeUnit.SECONDS);

        stompSession.subscribe(String.format("/topic/public/%s", destinationName), new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return ChatMessageDto.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                completableFuture.complete((ChatMessageDto) payload);
            }
        });

        ChatMessageDto enterMessage = new ChatMessageDto();
        enterMessage.setType(ChatMessageDto.MessageType.ENTER);
        enterMessage.setSender("testUser");
        enterMessage.setDestinationName(destinationName);
        stompSession.send("/app/guide.addUser", enterMessage);

        // then: 실제 API 응답이므로, null이 아니고 내용이 비어있지 않은지만 확인합니다.
        ChatMessageDto receivedMessage = completableFuture.get(30, TimeUnit.SECONDS); // 외부 API 호출 시간을 고려해 대기 시간을 30초로 늘립니다.

        assertThat(receivedMessage).isNotNull();
        assertThat(receivedMessage.getType()).isEqualTo(ChatMessageDto.MessageType.ENTER);
        assertThat(receivedMessage.getSender()).isEqualTo("Gemini Guide");
        assertThat(receivedMessage.getMessage()).isNotNull().isNotEmpty();
    }
}
