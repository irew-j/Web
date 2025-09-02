package kr.ac.hs.RandomTrip.guidechat.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Gemini API 요청 DTO
 */
@Data
@AllArgsConstructor
public class GeminiRequestDto {
    private List<ContentDto> contents;
}
