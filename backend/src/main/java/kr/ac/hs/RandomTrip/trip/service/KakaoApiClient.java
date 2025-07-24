package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class KakaoApiClient {

    @Value("${kakao.api-key}")
    private String kakaoApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonNode searchPlaces(String keyword, String region) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("https://dapi.kakao.com/v2/local/search/keyword.json");

        // 검색어 구성: 키워드 + 지역 정보
        String searchQuery = keyword;
        if (region != null && !region.isEmpty()) {
            searchQuery = keyword + " " + region;
        }

        urlBuilder.append("?query=").append(URLEncoder.encode(searchQuery, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&size=15"); // 검색 결과 개수

        URL url = new URL(urlBuilder.toString());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Authorization", "KakaoAK " + kakaoApiKey);
        conn.setRequestProperty("Content-type", "application/json");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);

        BufferedReader rd = new BufferedReader(new InputStreamReader(
                conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300 ?
                        conn.getInputStream() : conn.getErrorStream(), "UTF-8"));

        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            sb.append(line);
        }
        rd.close();
        conn.disconnect();

        // 응답 로깅 (디버깅용)
//        System.err.println("Kakao API Response for keyword '" + searchQuery + "': " + sb.toString());

        JsonNode response = objectMapper.readTree(sb.toString());
        return response.path("documents");
    }

    public TripResponse toTripResponse(JsonNode kakaoPlace, String reason) {
        String title = kakaoPlace.path("place_name").asText("장소명 없음");
        String address = kakaoPlace.path("road_address_name").asText("");
        if (address.isEmpty()) {
            address = kakaoPlace.path("address_name").asText("주소 없음");
        }

        String mapy = kakaoPlace.path("y").asText(""); // 위도
        String mapx = kakaoPlace.path("x").asText(""); // 경도

        // Kakao API에서는 이미지 정보를 제공하지 않으므로 빈 문자열
        String imageUrl = "";

        // description은 빈 문자열로 설정
        String description = "";

//        // 카테고리 정보를 description으로 활용
//        String categoryName = kakaoPlace.path("category_name").asText("");
//        String phone = kakaoPlace.path("phone").asText("");
//        String placeUrl = kakaoPlace.path("place_url").asText("");
//
//        StringBuilder description = new StringBuilder();
//        if (!categoryName.isEmpty()) {
//            description.append("카테고리: ").append(categoryName);
//        }
//        if (!phone.isEmpty()) {
//            if (description.length() > 0) description.append("\n");
//            description.append("전화번호: ").append(phone);
//        }
//        if (!placeUrl.isEmpty()) {
//            if (description.length() > 0) description.append("\n");
//            description.append("상세정보: ").append(placeUrl);
//        }
//        if (description.length() == 0) {
//            description.append("Kakao API를 통해 검색된 장소입니다.");
//        }

        TripResponse response = new TripResponse(
                title, address, imageUrl, description.toString(),
                "", "", mapy, mapx // areaCode, contentTypeId는 빈 문자열
        );

        if (reason != null && !reason.isEmpty()) {
            response.setReason(reason);
        }

        return response;
    }
}