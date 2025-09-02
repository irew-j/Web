package kr.ac.hs.RandomTrip.guidechat.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 필드는 JSON 변환 시 제외
public class ChatMessageDto {
    public enum MessageType {
        ENTER, TALK, LEAVE, RECOMMEND
    }

    private MessageType type;
    private String sender;
    private String receiver;
    private String message;
    private String destinationName; // 목적지 이름 추가
    private String placeName; // 추천 장소 이름
}
