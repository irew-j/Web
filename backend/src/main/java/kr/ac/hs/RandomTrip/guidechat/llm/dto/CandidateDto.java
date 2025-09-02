package kr.ac.hs.RandomTrip.guidechat.llm.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Gemini API Candidate 구조 DTO
 */
@Data
@NoArgsConstructor
public class CandidateDto {
    private ContentDto content;
}
