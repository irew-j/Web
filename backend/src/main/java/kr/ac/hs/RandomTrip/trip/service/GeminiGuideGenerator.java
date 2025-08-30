package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class GeminiGuideGenerator {

    private static final Logger logger = LoggerFactory.getLogger(GeminiGuideGenerator.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GuideResponse generateGuide(String destinationName, String userMessage) {
        String prompt = String.format(
                "당신은 '%s'를 위한 전문 여행 가이드입니다. 사용자가 다음과 같이 질문했습니다: '%s'. " +
                        "요청 내용을 분석한 뒤 아래 규칙에 따라 답변하세요. " +
                        "1) 사용자가 특정 장소(예: 음식점, 카페, 명소 등)를 찾는 경우 → " +
                        "{\"reply\": \"방문객에게 도움이 될 짧고 간결한 답변 (2~3문장 이내)\", \"placeName\": \"장소의 공식 명칭\"} 형식으로 답변합니다. " +
                        "2) 일반적인 질문이거나 장소 추천이 필요 없는 경우 → " +
                        "{\"reply\": \"간단하고 명확한 안내 (2~3문장 이내)\", \"placeName\": null} 형식으로 답변합니다. " +
                        "답변은 항상 한국어로 작성하고, 장소 추천 시 반드시 하나의 장소만 제시하세요.",
                destinationName, userMessage
        );
        return callGeminiApi(prompt);
    }

    public GuideResponse generateGuide(String destinationName) {
        String prompt = String.format(
                "당신은 전문 여행 가이드입니다. '%s'에 대해 3문장 이내로 간결하게 소개해주세요. " +
                        "설명에는 그 장소의 역사, 흥미로운 사실, 그리고 방문객에게 도움이 될 만한 실용적인 팁을 반드시 포함하세요. " +
                        "항상 한국어로, 전문 가이드처럼 차분하고 정확하게 설명해야 합니다. " +
                        "응답은 반드시 {\"reply\": \"소개 내용\", \"placeName\": null} 형식의 JSON으로 제공하세요.",
                destinationName
        );
        return callGeminiApi(prompt);
    }

    private GuideResponse callGeminiApi(String prompt) {
        String apiUrl = GEMINI_API_URL + "?key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        GeminiRequest requestBody = new GeminiRequest(
                Collections.singletonList(new Content(Collections.singletonList(new Part(prompt))))
        );
        HttpEntity<GeminiRequest> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<GeminiApiResponse> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, GeminiApiResponse.class
            );

            String rawJson = Optional.ofNullable(response.getBody())
                    .flatMap(body -> body.getCandidates().stream().findFirst())
                    .map(candidate -> candidate.getContent().getParts().get(0).getText())
                    .orElse("{\"reply\": \"죄송합니다, 답변을 생성할 수 없습니다.\", \"placeName\": null}");

            // Clean up the raw JSON string
            rawJson = cleanJsonString(rawJson);

            return objectMapper.readValue(rawJson, GuideResponse.class);

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: " + e.getMessage(), e);
            return new GuideResponse("죄송합니다, 지금은 답변할 수 없습니다. 잠시 후 다시 시도해주세요.", null);
        }
    }

    private String cleanJsonString(String rawJson) {
        // Remove markdown backticks for JSON block
        String cleaned = rawJson.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    // --- DTO Classes for this Service ---
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GuideResponse {
        private String reply;
        private String placeName;
    }

    // --- DTO Classes for Gemini API ---
    @Data
    @AllArgsConstructor
    private static class GeminiRequest {
        private List<Content> contents;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class Content {
        private List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class Part {
        private String text;
    }

    @Data
    @NoArgsConstructor
    private static class GeminiApiResponse {
        private List<Candidate> candidates;
    }

    @Data
    @NoArgsConstructor
    private static class Candidate {
        private Content content;
    }
}