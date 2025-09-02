package kr.ac.hs.RandomTrip.guidechat.llm.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Gemini API 응답 루트 DTO
 */
@Data
@NoArgsConstructor
public class GeminiApiResponseDto {
    private List<CandidateDto> candidates;
}
