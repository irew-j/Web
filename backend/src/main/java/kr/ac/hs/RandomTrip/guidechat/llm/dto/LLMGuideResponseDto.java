package kr.ac.hs.RandomTrip.guidechat.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 서비스에서 사용하는 최종 응답 DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LLMGuideResponseDto {
    private String reply;
    private String placeName;
}
