package kr.ac.hs.RandomTrip.guidechat.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Gemini API Content 구조 DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContentDto {
    private String role; // "user" 또는 "model"
    private List<PartDto> parts;
}
