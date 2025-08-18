package kr.ac.hs.RandomTrip.trip.service;

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
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateGuide(String destinationName, String userMessage) {
        String apiUrl = GEMINI_API_URL + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = String.format(
                "당신은 전문 여행 가이드입니다. 현재 '%s'에 대해 안내하고 있습니다. 사용자가 다음과 같이 질문했습니다: '%s'. 이 질문에 대해 3문장 이내로 간결하게 핵심만 답변해주세요. 답변은 한국어로 해주세요.",
                destinationName, userMessage
        );

        GeminiRequest requestBody = new GeminiRequest(
                Collections.singletonList(new Content(Collections.singletonList(new Part(prompt))))
        );

        HttpEntity<GeminiRequest> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    GeminiResponse.class
            );

            String rawText = Optional.ofNullable(response.getBody())
                    .flatMap(body -> body.getCandidates().stream().findFirst())
                    .map(candidate -> candidate.getContent().getParts().get(0).getText())
                    .orElse("죄송합니다, 답변을 생성할 수 없습니다.");
            return formatGuideText(rawText);

        } catch (RestClientException e) {
            logger.error("Gemini API 호출 중 오류 발생: " + e.getMessage(), e);
            return "죄송합니다, 지금은 답변할 수 없습니다. 잠시 후 다시 시도해주세요.";
        }
    }

    public String generateGuide(String destinationName) {
        String apiUrl = GEMINI_API_URL + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = String.format(
                "당신은 전문 여행 가이드입니다. '%s'에 대해 3문장 이내로 간결하게 핵심만 설명해주세요. 이 장소의 역사, 흥미로운 사실, 그리고 방문객을 위한 유용한 팁을 포함하여, 친절하고 매력적인 톤으로 설명해주세요. 답변은 한국어로 해주세요.",
                destinationName
        );

        GeminiRequest requestBody = new GeminiRequest(
                Collections.singletonList(new Content(Collections.singletonList(new Part(prompt))))
        );

        HttpEntity<GeminiRequest> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    GeminiResponse.class
            );

            String rawText = Optional.ofNullable(response.getBody())
                    .flatMap(body -> body.getCandidates().stream().findFirst())
                    .map(candidate -> candidate.getContent().getParts().get(0).getText())
                    .orElse("죄송합니다, 가이드 정보를 생성할 수 없습니다.");
            return formatGuideText(rawText);

        } catch (RestClientException e) {
            logger.error("Gemini API 호출 중 오류 발생: " + e.getMessage(), e);
            return String.format("[임시 가이드] %s에 오신 것을 환영합니다! (API 호출 실패)", destinationName);
        }
    }
    
    // 문장마다 들여쓰기 추가하는 메서드
    private String formatGuideText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "";
        }
        // 문장 끝에 오는 점과 공백을 찾아 줄바꿈과 들여쓰기를 추가합니다.
        return text.replace(". ", ".\n").trim();
    }



    // --- DTO Classes for Gemini API ---

    @Data
    @AllArgsConstructor
    private static class GeminiRequest {
        private List<Content> contents;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor // 추가
    private static class Content {
        private List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor // 추가
    private static class Part {
        private String text;
    }

    @Data
    @NoArgsConstructor
    private static class GeminiResponse {
        private List<Candidate> candidates;
    }

    @Data
    @NoArgsConstructor
    private static class Candidate {
        private Content content;
    }
}