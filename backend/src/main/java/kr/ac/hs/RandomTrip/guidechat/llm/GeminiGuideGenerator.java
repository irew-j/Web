package kr.ac.hs.RandomTrip.guidechat.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.CandidateDto;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.ContentDto;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.GeminiApiResponseDto;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.GeminiRequestDto;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.LLMGuideResponseDto;
import kr.ac.hs.RandomTrip.guidechat.llm.dto.PartDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gemini API와 상호작용하여 여행 가이드 응답을 생성하고,
 * 대화 기록을 관리하여 연속적인 대화를 가능하게 하는 서비스 클래스.
 */
@Component
public class GeminiGuideGenerator {

    private static final Logger logger = LoggerFactory.getLogger(GeminiGuideGenerator.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 웹소켓 세션 ID를 키로 사용하여 대화 기록을 저장하는 맵.
     * 동시성 문제를 피하기 위해 ConcurrentHashMap을 사용.
     */
    private final Map<String, List<ContentDto>> chatHistories = new ConcurrentHashMap<>();

    /**
     * 새로운 대화 세션을 시작하고 초기 가이드 메시지를 생성합니다.
     * @param sessionId 현재 웹소켓 세션 ID
     * @param destinationName 사용자가 선택한 여행지 이름
     * @return 생성된 초기 가이드 응답
     */
    public LLMGuideResponseDto generateInitialGuide(String sessionId, String destinationName) {
        // 1. 대화 시작을 위한 초기 프롬프트 생성
        String prompt = String.format(
                "당신은 '%s'를 위한 전문 여행 가이드입니다. " +
                        "모든 답변은 2~3문장 이내로 간결하게 작성해주세요. " +
                        "사용자가 특정 장소(예: 음식점, 카페, 명소 등)를 찾는 경우, 방문객에게 도움이 될 짧고 간결한 답변과 함께 장소의 공식 명칭을 {\"reply\": \"...\", \"placeName\": \"...\"} 형식으로 제공하고, 반드시 하나의 장소만 제시하세요. " +
                        "일반적인 질문이거나 장소 추천이 필요 없는 경우, 간단하고 명확한 안내를 {\"reply\": \"...\", \"placeName\": null} 형식으로 제공하세요. " +
                        "항상 한국어로, 전문 가이드처럼 차분하고 정확하게 설명해야 합니다. " +
                        "이제 '%s'에 대해 3문장 이내로 간결하게 소개해주세요. 설명에는 그 장소의 역사, 흥미로운 사실, 그리고 방문객에게 도움이 될 만한 실용적인 팁을 반드시 포함하세요.",
                destinationName, destinationName
        );

        // 2. 새로운 대화 기록 리스트 생성 및 초기 프롬프트 추가
        List<ContentDto> history = new ArrayList<>();
        history.add(new ContentDto("user", Collections.singletonList(new PartDto(prompt))));

        // 3. Gemini API 호출
        LLMGuideResponseDto response = callGeminiApi(history);

        // 4. API 호출이 성공하면, 세션 ID와 함께 대화 기록 저장
        if (response != null) {
            chatHistories.put(sessionId, history);
            logger.info("New chat session initialized for id: {}", sessionId);
        }
        return response;
    }

    /**
     * 기존 대화 세션에 이어 후속 질문에 대한 응답을 생성합니다.
     * @param sessionId 현재 웹소켓 세션 ID
     * @param userMessage 사용자의 새로운 질문 메시지
     * @return 생성된 후속 가이드 응답
     */
    public LLMGuideResponseDto generateFollowUpGuide(String sessionId, String userMessage) {
        // 1. 세션 ID로 기존 대화 기록 조회
        List<ContentDto> history = chatHistories.get(sessionId);

        // 2. 대화 기록이 없는 경우 (비정상적인 접근), 오류 로깅 및 기본 응답 반환
        if (history == null) {
            logger.warn("Chat history not found for session id: {}. A new session may be required.", sessionId);
            return new LLMGuideResponseDto("세션이 만료되었거나 존재하지 않습니다. 대화를 다시 시작해주세요.", null);
        }

        // 3. 대화 기록에 새로운 사용자 메시지 추가
        history.add(new ContentDto("user", Collections.singletonList(new PartDto(userMessage))));

        // 4. 업데이트된 대화 기록으로 Gemini API 호출
        return callGeminiApi(history);
    }

    /**
     * 지정된 세션 ID의 대화 기록을 삭제합니다. (웹소켓 연결 종료 시 호출)
     * @param sessionId 정리할 웹소켓 세션 ID
     */
    public void endChat(String sessionId) {
        chatHistories.remove(sessionId);
        logger.info("Chat history for session {} cleared.", sessionId);
    }

    /**
     * 대화형 세션과 관계없이 특정 장소에 대한 일회성 가이드를 생성합니다.
     * @param destinationName 장소 이름
     * @return 생성된 일회성 가이드 응답
     */
    public LLMGuideResponseDto generateOneTimeGuide(String destinationName) {
        String prompt = String.format(
                "당신은 전문 여행 가이드입니다. '%s'에 대해 3문장 이내로 간결하게 소개해주세요. " +
                        "설명에는 그 장소의 역사, 흥미로운 사실, 그리고 방문객에게 도움이 될 만한 실용적인 팁을 반드시 포함하세요. " +
                        "항상 한국어로, 전문 가이드처럼 차분하고 정확하게 설명해야 합니다. " +
                        "응답은 반드시 {\"reply\": \"소개 내용\", \"placeName\": null} 형식의 JSON으로 제공하세요.",
                destinationName
        );

        // 일회성 요청이므로, 대화 기록(history) 없이 단일 컨텐츠로 API 호출
        List<ContentDto> singleContent = Collections.singletonList(new ContentDto("user", Collections.singletonList(new PartDto(prompt))));
        return callStatelessGeminiApi(singleContent);
    }

    private LLMGuideResponseDto callGeminiApi(List<ContentDto> history) {
        String apiUrl = GEMINI_API_URL + "?key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Gemini API 요청 본문 생성
        GeminiRequestDto requestBody = new GeminiRequestDto(history);
        HttpEntity<GeminiRequestDto> entity = new HttpEntity<>(requestBody, headers);

        try {
            // API 호출
            ResponseEntity<GeminiApiResponseDto> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, GeminiApiResponseDto.class
            );

            // API 응답에서 모델의 답변(Part)을 추출
            Optional<PartDto> modelPart = Optional.ofNullable(response.getBody())
                    .flatMap(body -> body.getCandidates().stream().findFirst())
                    .map(candidate -> {
                        // 중요: 모델의 응답을 대화 기록(history)에 추가하여 다음 대화에서 참조하도록 함
                        history.add(candidate.getContent());
                        return candidate.getContent().getParts().get(0);
                    });

            // 모델의 답변 텍스트를 추출. 없는 경우 기본 메시지 사용.
            String rawText = modelPart.map(PartDto::getText)
                    .orElse("{\"reply\": \"죄송합니다, 답변을 생성할 수 없습니다.\", \"placeName\": null}");

            return parseOrWrapResponse(rawText);

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: " + e.getMessage(), e);
            return new LLMGuideResponseDto("죄송합니다, 지금은 답변할 수 없습니다. 잠시 후 다시 시도해주세요.", null);
        }
    }

    /**
     * 대화 기록을 저장하지 않는 Stateless API 호출 내부 메소드.
     * @param contents API에 보낼 컨텐츠 리스트
     * @return API로부터 받은 응답을 파싱한 GuideResponse 객체
     */
    private LLMGuideResponseDto callStatelessGeminiApi(List<ContentDto> contents) {
        String apiUrl = GEMINI_API_URL + "?key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        GeminiRequestDto requestBody = new GeminiRequestDto(contents);
        HttpEntity<GeminiRequestDto> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<GeminiApiResponseDto> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, GeminiApiResponseDto.class
            );

            String rawText = Optional.ofNullable(response.getBody())
                    .flatMap(body -> body.getCandidates().stream().findFirst())
                    .map(candidate -> candidate.getContent().getParts().get(0).getText())
                    .orElse("{\"reply\": \"죄송합니다, 답변을 생성할 수 없습니다.\", \"placeName\": null}");

            return parseOrWrapResponse(rawText);

        } catch (Exception e) {
            logger.error("Error calling stateless Gemini API or parsing response: " + e.getMessage(), e);
            return new LLMGuideResponseDto("죄송합니다, 지금은 답변할 수 없습니다. 잠시 후 다시 시도해주세요.", null);
        }
    }

    /**
     * API 응답 문자열을 파싱하거나, 파싱 실패 시 일반 텍스트로 감싸서 반환합니다.
     * @param rawText API로부터 받은 원본 응답 문자열
     * @return 파싱되었거나 래핑된 GuideResponse 객체
     */
    private LLMGuideResponseDto parseOrWrapResponse(String rawText) {
        String cleanedText = cleanJsonString(rawText);
        try {
            // JSON으로 파싱 시도
            return objectMapper.readValue(cleanedText, LLMGuideResponseDto.class);
        } catch (Exception e) {
            // 파싱 실패 시, 일반 텍스트 응답으로 간주하고 GuideResponse로 래핑
            logger.warn("Could not parse Gemini response as JSON, wrapping as plain text. Raw: {}", cleanedText);
            return new LLMGuideResponseDto(cleanedText, null);
        }
    }

    /**
     * API 응답에서 JSON 객체 부분만 정확히 추출합니다.
     * 응답 문자열에 포함된 다른 텍스트나 마크다운을 무시합니다.
     * @param rawText 원본 응답 문자열
     * @return 추출된 JSON 문자열. 찾지 못하면 파싱 실패를 유도하기 위해 원본을 반환.
     */
    private String cleanJsonString(String rawText) {
        // 문자열에서 첫 번째 '{'와 마지막 '}'의 위치를 찾습니다.
        int firstBrace = rawText.indexOf('{');
        int lastBrace = rawText.lastIndexOf('}');

        // 유효한 JSON 객체 부분을 찾았다면, 해당 부분만 잘라내어 반환합니다.
        if (firstBrace != -1 && lastBrace != -1 && firstBrace < lastBrace) {
            return rawText.substring(firstBrace, lastBrace + 1).trim();
        }

        // JSON 객체를 찾지 못한 경우, 기존처럼 catch 블록에서 처리되도록 원본을 반환합니다.
        logger.warn("Could not find a valid JSON object within the raw response: {}", rawText);
        return rawText;
    }

}