package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class DestinationMapper {

    // TourApiClient 제거

    private final Map<String, String> areaCodeMap = new HashMap<String, String>() {{
        put("1", "서울"); put("2", "인천"); put("3", "대전"); put("4", "대구"); put("5", "광주");
        put("6", "부산"); put("7", "울산"); put("8", "세종"); put("31", "경기도"); put("32", "강원도");
        put("33", "충청북도"); put("34", "충청남도"); put("35", "경상북도"); put("36", "경상남도");
        put("37", "전라북도"); put("38", "전라남도"); put("39", "제주도");
    }};

    private final Map<String, String> areaNameToCodeMap = new HashMap<String, String>() {{
        for (Map.Entry<String, String> entry : areaCodeMap.entrySet()) {
            put(entry.getValue(), entry.getKey());
        }
    }};

    public String resolveAreaCode(String query) {
        for (Map.Entry<String, String> entry : areaNameToCodeMap.entrySet()) {
            if (query.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null; // Or throw an exception if an area code is always expected
    }

    // DB에 저장된 Destination 객체를 TripResponse DTO로 변환
    public TripResponse toTripResponse(Destination destination) {
        return new TripResponse(
                destination.getId(),
                destination.getTitle(),
                destination.getAddress(),
                destination.getImageUrl(),
                destination.getDescription(),
                destination.getAreaCode(),
                destination.getContentTypeId(),
                destination.getMapy(),
                destination.getMapx()
        );
    }

    // Kakao API 응답(JsonNode)을 Destination 객체로 변환 (ID는 아직 없음)
    public Destination toDestination(JsonNode placeNode) {
        String title = placeNode.path("place_name").asText();
        String address = placeNode.path("address_name").asText();
        String mapx = placeNode.path("x").asText();
        String mapy = placeNode.path("y").asText();
        // Kakao API는 contentId, contentTypeId, description, imageUrl이 없으므로 기본값/추가처리 필요
        return new Destination(title, address, "", "", "", "", mapy, mapx, null);
    }

    // TourAPI 응답(JsonNode)을 Destination 객체로 변환 (ID는 아직 없음)
    public Destination toDestination(JsonNode tourNode, String description, String imageUrl) {
        String contentId = tourNode.path("contentid").asText();
        String contentTypeId = tourNode.path("contenttypeid").asText();
        String title = tourNode.path("title").asText("제목 없음");
        String address = tourNode.path("addr1").asText("");
        String areaCode = tourNode.path("areacode").asText();
        String mapx = tourNode.path("mapx").asText();
        String mapy = tourNode.path("mapy").asText();

        return new Destination(title, address, imageUrl, description, areaCode, contentTypeId, mapy, mapx, contentId);
    }
}