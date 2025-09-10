package kr.ac.hs.RandomTrip.trip.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class LlmTravelCourseExtractor {

    @Value("${azure.openai.endpoint}")
    private String openaiEndpoint;

    @Value("${azure.openai.api-key}")
    private String openaiApiKey;

    @Value("${azure.openai.deployment}")
    private String openaiDeployment;

    @Value("${azure.openai.api-version}")
    private String openaiApiVersion;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<List<TravelCourseItem>> extractTravelCourse(String query, String transport) throws Exception {
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("쿼리가 비어 있습니다");
        }

        String apiUrl = String.format("%s/openai/deployments/%s/chat/completions?api-version=%s",
                openaiEndpoint.endsWith("/") ? openaiEndpoint.substring(0, openaiEndpoint.length() - 1) : openaiEndpoint,
                openaiDeployment, URLEncoder.encode(openaiApiVersion, StandardCharsets.UTF_8.toString()));

        URL url = new URL(apiUrl);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setRequestProperty("api-key", openaiApiKey);
        con.setDoOutput(true);
        con.setConnectTimeout(10000);
        con.setReadTimeout(10000);

        // transport 값에 따라 거리 제한 규칙 설정
        String distanceRule = switch (transport) {
            case "도보" -> """
            **🚶‍♂️ 도보 이동 절대 규칙:**
            - 모든 장소는 반드시 직선거리 300-500m 이내
            - 실제 도보 이동시간 5-8분 이내
            - 같은 블록/상권/관광지구 내에서만 선택
            - 큰 도로, 강, 언덕을 건드리지 않는 평지 이동만 허용
            """;
            case "차량" -> "차량으로 15-20분 이내 (약 8-12km, 같은 시/군 내)";
            case "대중교통" -> "대중교통으로 25-30분 이내 (지하철/버스 2-3정거장)";
            default -> "각 장소 간 거리는 이동 수단에 맞게 현실적인 범위 내여야 합니다.";
        };

        // 지역 제한 규칙
        String locationRule = switch (transport) {
            case "도보" -> """
            **도보 지역 제한:**
            - 입력된 지역의 가장 좁은 범위(동/마을/상권) 내에서만 선택
            - 행정구역이 달라지면 절대 안됨
            - 예: "홍대" → 홍익대학교 주변 500m 반경만
            - 예: "명동" → 명동역 중심 도보권만
            - 예: "이태원" → 이태원역 주변 상권만
            - 예: "강남" → 강남역 기준 반경 400m 이내만
            """;
            case "차량" -> "입력된 시/군 전체 범위에서 선택 가능";
            case "대중교통" -> "입력된 구/시 내에서 대중교통 연결 가능한 지역";
            default -> "입력된 지역명과 정확히 일치하는 행정구역 내에서만 선택";
        };

        // 금지 사항
        String prohibitionRule = switch (transport) {
            case "도보" -> """
            **🚫 도보 시 절대 금지:**
            - 다른 구/동으로 넘어가는 장소
            - 지하철/버스가 필요한 거리
            - 큰 도로(4차선 이상)를 건너는 경로
            - 강/하천을 건너는 이동
            - 언덕/계단이 많은 경로 (고도차 30m 이상)
            - "도보 10분 이상" 표현이 들어가는 장소
            """;
            case "차량" -> "인접 시/도로 넘어가는 장소, 도로 접근 불가능한 등산로";
            case "대중교통" -> "대중교통 미연결 지역, 환승 3회 이상 필요한 장소";
            default -> "현실적으로 이동 불가능한 장소";
        };

        // 구체적 예시
        String exampleRule = switch (transport) {
            case "도보" -> """
            **✅ 도보 올바른 예시:**
            - 홍대입구역 → (5분 걷기) → 홍대놀이터 → (3분 걷기) → 상상마당 → (7분 걷기) → 홍대주차장거리
            - 명동역 → (4분 걷기) → 명동성당 → (6분 걷기) → 남대문시장 → (5분 걷기) → 세종문화회관
            
            **❌ 절대 하면 안되는 예시:**
            - 홍대 → 이태원 (지하철 20분 필요)
            - 강남역 → 압구정역 (버스 필요)
            - 북촌한옥마을 → 남산타워 (경사 심함)
            """;
            default -> "";
        };

        // 시스템 프롬프트
        String systemPrompt = """
        당신은 한국 여행 전문가입니다. 사용자의 이동 수단에 맞는 현실적인 여행 코스를 설계해주세요.

        **🎯 핵심 미션: %s 이동에 최적화된 코스 구성**

        %s

        %s

        %s

        %s

        **기본 규칙:**
        1. **지역 정확성**: 사용자 입력 지역 내에서만 선택
        2. **음식점 완전 제외**: 맛집, 카페, 레스토랑 등 음식 관련 장소 금지
        3. **API 호환성**: TourAPI/Kakao Map에서 검색 가능한 실제 장소명만 사용
        4. **완전한 다양성**: 매번 완전히 다른 장소들로 구성

        **코스 구성:**
        - 총 2개 코스, 각 4개 장소
        - 이동 순서는 지리적으로 자연스럽게 배치
        - 각 장소별 구체적인 추천 이유 필수

        **응답 형식 (순수 JSON만):**
        {"courses": [{"course": [{"order": 1, "place": "장소명", "reason": "추천 이유"}]}]}

        **⚠️ 최종 체크리스트:**
        □ 모든 장소가 %s 이동 거리 내인가?
        □ 음식점이 포함되지 않았는가?
        □ 실제 존재하는 장소명인가?
        □ 이동 경로가 현실적인가?
        □ JSON이 완전한 형태인가?
        """.formatted(
                transport,
                locationRule,
                distanceRule,
                prohibitionRule,
                exampleRule.isEmpty() ? "" : exampleRule + "\n",
                transport
        );


        // JSON 객체로 요청 본문 생성
        ObjectNode requestBody = objectMapper.createObjectNode();
        ObjectNode messageSystem = objectMapper.createObjectNode();
        messageSystem.put("role", "system");
        messageSystem.put("content", systemPrompt);

        ObjectNode messageUser = objectMapper.createObjectNode();
        messageUser.put("role", "user");
        messageUser.put("content", "요청: '" + query + "a' - 위 규칙을 엄격히 준수하여 정확한 지역 내에서만 음식점을 제외한 다양하고 독특한 장소 2개 코스를 추천해주세요. 추천하는 모든 장소명은 한국관광공사 TourAPI 또는 Kakao Map API에서 검색 가능한 공식 명칭이어야 합니다.");

        requestBody.putArray("messages").add(messageSystem).add(messageUser);
        requestBody.put("max_tokens", 1500); // 더 상세한 응답을 위해 토큰 증가
        requestBody.put("temperature", 0.7); // 창의성과 랜덤성을 위해 더 높게 설정
        requestBody.put("top_p", 0.7); // 다양성 확보
        requestBody.put("presence_penalty", 0.5); // 반복 방지 강화
        requestBody.put("frequency_penalty", 0.5); // 다양한 장소 추천 유도 강화

        try (OutputStream os = con.getOutputStream()) {
            byte[] input = objectMapper.writeValueAsBytes(requestBody);
            os.write(input, 0, input.length);
        }

        BufferedReader in = new BufferedReader(new InputStreamReader(
                con.getResponseCode() >= 200 && con.getResponseCode() <= 300 ? con.getInputStream() : con.getErrorStream(), StandardCharsets.UTF_8));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) response.append(line);
        in.close();

        JsonNode root = objectMapper.readTree(response.toString());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.size() == 0) {
            throw new RuntimeException("Azure OpenAI 응답에 choices가 없습니다: " + response.toString());
        }
        String content = choices.get(0).path("message").path("content").asText("");

        // 더 강력한 Markdown 포맷 제거
        String cleanedContent = content
                .replaceAll("(?s)```json\\s*\\n?(.*?)\\s*```", "$1")
                .replaceAll("(?s)```\\s*\\n?(.*?)\\s*```", "$1")
                .replaceAll("^[^{]*", "") // JSON 앞의 모든 텍스트 제거
                .replaceAll("[^}]*$", "") // JSON 뒤의 모든 텍스트 제거
                .trim();

        // 로깅
        System.err.println("Cleaned Content: " + cleanedContent);

        JsonNode coursesJson;
        try {
            coursesJson = objectMapper.readTree(cleanedContent).path("courses");
        } catch (Exception e) {
            throw new RuntimeException("JSON 파싱 오류: " + e.getMessage() + ", 원본: " + cleanedContent);
        }

        List<List<TravelCourseItem>> allCourses = new ArrayList<>();
        for (JsonNode courseNode : coursesJson) {
            List<TravelCourseItem> course = new ArrayList<>();
            for (JsonNode item : courseNode.path("course")) {
                course.add(new TravelCourseItem(
                        item.path("order").asInt(),
                        item.path("place").asText(),
                        item.path("reason").asText()
                ));
            }
            allCourses.add(course);
        }

        // 토큰 모니터링
        System.err.println("Response Token Count: " + root.path("usage").path("total_tokens").asInt());
        return allCourses;
    }

    // 도보 여행 시작점 추천받는 메서드
    public List<String> extractWalkStartPoints(String query) throws Exception {
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("쿼리가 비어 있습니다");
        }

        String apiUrl = String.format("%s/openai/deployments/%s/chat/completions?api-version=%s",
                openaiEndpoint.endsWith("/") ? openaiEndpoint.substring(0, openaiEndpoint.length() - 1) : openaiEndpoint,
                openaiDeployment, URLEncoder.encode(openaiApiVersion, StandardCharsets.UTF_8.toString()));

        URL url = new URL(apiUrl);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setRequestProperty("api-key", openaiApiKey);
        con.setDoOutput(true);
        con.setConnectTimeout(10000);
        con.setReadTimeout(10000);

        String systemPrompt = """
        당신은 한국 지리 전문가입니다. 사용자의 요청에 따라 도보 여행을 시작하기 좋은, 서로 다른 핵심 장소 **두 곳**을 추천해주세요.

        **🎯 핵심 미션: 가장 상징적이고 접근성 좋은 시작점 2곳 추천**

        **규칙:**
        1.  **두 개의 장소**: 반드시 서로 다른 장소 두 곳의 이름을 JSON 형식으로 응답해야 합니다.
        2.  **공식 명칭**: 지도 앱(카카오맵, 네이버지도)에서 검색 가능한 공식 명칭을 사용해야 합니다.
        3.  **음식점/카페 제외**: 관광 명소, 공원, 유명 거리, 등 공공장소 위주로 추천해주세요.
        4.  **순수 JSON 출력**: 어떤 설명이나 부연 없이 순수한 JSON 객체만 출력해야 합니다.

        **응답 형식 (순수 JSON만):**
        {"start_points": ["장소명1", "장소명2"]}

        **올바른 예시:**
        - 사용자: "서울 시청 근처에서 역사 테마로 걷기 좋은 곳 추천해줘"
        - 당신: {"start_points": ["덕수궁", "서울광장"]}
        - 사용자: "부산 광안리에서 바다 보면서 산책 시작할 만한 곳"
        - 당신: {"start_points": ["광안리해수욕장", "민락수변공원"]}
        """;

        ObjectNode requestBody = objectMapper.createObjectNode();
        ObjectNode messageSystem = objectMapper.createObjectNode();
        messageSystem.put("role", "system");
        messageSystem.put("content", systemPrompt);

        ObjectNode messageUser = objectMapper.createObjectNode();
        messageUser.put("role", "user");
        messageUser.put("content", "요청: '" + query + "' - 이 요청에 가장 적합한, 서로 다른 도보 여행 시작점 두 곳을 알려주세요.");

        requestBody.putArray("messages").add(messageSystem).add(messageUser);
        requestBody.put("max_tokens", 100);
        requestBody.put("temperature", 0.5);
        requestBody.put("response_format", objectMapper.createObjectNode().put("type", "json_object")); // JSON 출력 모드 활성화

        try (OutputStream os = con.getOutputStream()) {
            byte[] input = objectMapper.writeValueAsBytes(requestBody);
            os.write(input, 0, input.length);
        }

        BufferedReader in = new BufferedReader(new InputStreamReader(
                con.getResponseCode() >= 200 && con.getResponseCode() <= 300 ? con.getInputStream() : con.getErrorStream(), StandardCharsets.UTF_8));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) response.append(line);
        in.close();

        JsonNode root = objectMapper.readTree(response.toString());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.size() == 0) {
            throw new RuntimeException("Azure OpenAI 응답에 choices가 없습니다: " + response.toString());
        }
        String content = choices.get(0).path("message").path("content").asText("").trim();

        JsonNode startPointsNode = objectMapper.readTree(content).path("start_points");
        List<String> startPoints = new ArrayList<>();
        if (startPointsNode.isArray()) {
            for (JsonNode node : startPointsNode) {
                startPoints.add(node.asText());
            }
        }
        return startPoints;
    }

    // 지역 추천 메서드 추가
    public String extractRegionFromQuery(String query) throws Exception {
        String apiUrl = String.format("%s/openai/deployments/%s/chat/completions?api-version=%s",
                openaiEndpoint.endsWith("/") ? openaiEndpoint.substring(0, openaiEndpoint.length() - 1) : openaiEndpoint,
                openaiDeployment, URLEncoder.encode(openaiApiVersion, StandardCharsets.UTF_8.toString()));

        URL url = new URL(apiUrl);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setRequestProperty("api-key", openaiApiKey);
        con.setDoOutput(true);
        con.setConnectTimeout(10000);
        con.setReadTimeout(10000);

        String systemPrompt = """
        당신은 한국의 지역 추천 전문가입니다. 사용자의 여행 테마에 가장 어울리는 대한민국 **주요 지역(도, 광역시)** 이름을 딱 하나만 추천해주세요.

        **🎯 핵심 미션: 테마에 맞는 지역 이름 하나만 정확히 반환**

        **규칙:**
        1.  **단 하나의 지역**: 반드시 하나의 지역 이름만 응답해야 합니다.
        2.  **지정된 목록**: 다음 목록에 있는 이름 중 하나만 선택해야 합니다:
            [서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주]
        3.  **순수 JSON 출력**: 어떤 설명이나 부연 없이 순수한 JSON 객체만 출력해야 합니다.

        **응답 형식 (순수 JSON만):**
        {"region": "추천지역"}

        **올바른 예시:**
        - 사용자: "바다 보면서 힐링하고 싶어"
        - 당신: {"region": "부산"}
        - 사용자: "역사적인 곳을 탐방하고 싶어"
        - 당신: {"region": "경주"}
        - 사용자: "조용한 산속에서 휴식하고 싶어"
        - 당신: {"region": "강원"}
        """;

        ObjectNode requestBody = objectMapper.createObjectNode();
        ObjectNode messageSystem = objectMapper.createObjectNode();
        messageSystem.put("role", "system");
        messageSystem.put("content", systemPrompt);

        ObjectNode messageUser = objectMapper.createObjectNode();
        messageUser.put("role", "user");
        messageUser.put("content", "요청: '" + query + "' - 이 여행 테마에 가장 적합한 지역 이름 하나를 추천해주세요.");

        requestBody.putArray("messages").add(messageSystem).add(messageUser);
        requestBody.put("max_tokens", 50);
        requestBody.put("temperature", 0.3);
        requestBody.put("response_format", objectMapper.createObjectNode().put("type", "json_object"));

        try (OutputStream os = con.getOutputStream()) {
            byte[] input = objectMapper.writeValueAsBytes(requestBody);
            os.write(input, 0, input.length);
        }

        BufferedReader in = new BufferedReader(new InputStreamReader(
                con.getResponseCode() >= 200 && con.getResponseCode() <= 300 ? con.getInputStream() : con.getErrorStream(), StandardCharsets.UTF_8));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) response.append(line);
        in.close();

        JsonNode root = objectMapper.readTree(response.toString());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.size() == 0) {
            System.err.println("Azure OpenAI 응답에 choices가 없습니다: " + response.toString());
            return null;
        }
        String content = choices.get(0).path("message").path("content").asText("").trim();
        if (content.isEmpty()) {
            System.err.println("Azure OpenAI 응답 content가 비어있습니다.");
            return null;
        }

        JsonNode regionNode = objectMapper.readTree(content).path("region");
        return regionNode.asText(null);
    }

    public static class TravelCourseItem {
        private int order;
        private String place;
        private String reason;

        public TravelCourseItem(int order, String place, String reason) {
            this.order = order;
            this.place = place;
            this.reason = reason;
        }

        public int getOrder() { return order; }
        public String getPlace() { return place; }
        public String getReason() { return reason; }
    }
}