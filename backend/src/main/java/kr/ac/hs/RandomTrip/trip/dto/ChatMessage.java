package kr.ac.hs.RandomTrip.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    public enum MessageType {
        ENTER, TALK, LEAVE
    }

    private MessageType type;
    private String sender;
    private String receiver;
    private String message;
    private String destinationName; // 목적지 이름 추가
}
