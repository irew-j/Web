package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class DestinationMapper {

    private final TourApiClient tourApiClient;

    public DestinationMapper(TourApiClient tourApiClient) {
        this.tourApiClient = tourApiClient;
    }

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
        return null;
    }

    public List<JsonNode> filterByAreaCode(JsonNode items, String targetAreaCode) {
        List<JsonNode> filtered = new ArrayList<>();
        if (items.isArray() && items.size() > 0) {
            for (JsonNode item : items) {
                if (targetAreaCode == null || targetAreaCode.equals(item.path("areacode").asText(""))) {
                    filtered.add(item);
                }
            }
        }
        return filtered;
    }

    public TripResponse toTripResponse(JsonNode selected) throws Exception {
        String contentId = selected.path("contentid").asText("");
        String contentTypeId = selected.path("contenttypeid").asText("");
        String title = extractPlaceName(selected.path("title").asText("제목 없음"));
        String addr1 = selected.path("addr1").asText("");
        String addr2 = selected.path("addr2").asText("");
        String address = addr1 + (addr2.isEmpty() ? "" : " " + addr2);
        String areaCode = selected.path("areacode").asText("");
        String sigunguCode = selected.path("sigungucode").asText("");
        String mapy = selected.path("mapy").asText("");
        String mapx = selected.path("mapx").asText("");
        String imageUrl = selected.path("firstimage").asText("");
        if (imageUrl.isEmpty()) imageUrl = selected.path("firstimage2").asText("");

        // 상세 정보 가져오기
        JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, contentTypeId);
        String description = "상세 설명 없음";
        if (detailItem.isArray() && detailItem.size() > 0) {
            description = detailItem.get(0).path("overview").asText("상세 설명 없음").replaceAll("<[^>]*>", "");
            if (imageUrl.isEmpty()) imageUrl = detailItem.get(0).path("firstimage").asText("");
            if (imageUrl.isEmpty()) imageUrl = detailItem.get(0).path("firstimage2").asText("");
            if (address.isEmpty() || address.trim().equals("주소 없음")) {
                addr1 = detailItem.get(0).path("addr1").asText("");
                addr2 = detailItem.get(0).path("addr2").asText("");
                address = addr1 + (addr2.isEmpty() ? "" : " " + addr2);
            }
            if (mapy.isEmpty()) mapy = detailItem.get(0).path("mapy").asText("");
            if (mapx.isEmpty()) mapx = detailItem.get(0).path("mapx").asText("");
        }

//        // 이미지가 없는 경우 관광사진 정보 API 호출
//        if (imageUrl.isEmpty()) {
//            try {
//                JsonNode imageItems = tourApiClient.fetchImageByKeyword(title);
//                if (imageItems.isArray() && imageItems.size() > 0) {
//                    imageUrl = imageItems.get(0).path("galWebImageUrl").asText("");
//                }
//            } catch (Exception e) {
//                // 로그 추가 (디버깅용)
//                System.err.println("Failed to fetch image for title: " + title + ", error: " + e.getMessage());
//            }
//        }

        if (address.isEmpty() || address.trim().equals("주소 없음")) {
            String areaName = getAreaNameFromCode(areaCode);
            String sigunguName = getSigunguNameFromCode(areaCode, sigunguCode);
            address = areaName + (sigunguName.isEmpty() ? "" : " " + sigunguName);
            if (address.isEmpty()) address = "대한민국";
        }

        // 최종적으로 이미지가 없으면 값 비워둠
        if (imageUrl.isEmpty()) {
            imageUrl = "";
        }

        // reason을 포함한 생성자 대신 기본 생성자를 사용하고 이후에 필요시 reason 설정
        return new TripResponse(
                title, address.trim(), imageUrl, description, areaCode, contentTypeId, mapy, mapx
        );
    }

    private String extractPlaceName(String title) {
        if (title == null || title.isEmpty()) return "관광지";
        String[] patterns = {"에서 누리는", "에서 즐기는", "에서 체험하는", "에서", "으로", "로 떠나는", "로",
                "여행", "힐링", "관광", "체험", "즐길거리", "풍경", "명소", "추천"};
        String result = title;
        for (String pattern : patterns) {
            int index = result.indexOf(pattern);
            if (index > 0) result = result.substring(0, index).trim();
        }
        return result.length() <= 2 ? title : result;
    }

    private String getAreaNameFromCode(String areaCode) {
        return areaCodeMap.getOrDefault(areaCode, "");
    }

    private String getSigunguNameFromCode(String areaCode, String sigunguCode) {
        if (areaCode.equals("1") && sigunguCode.equals("1")) return "종로구";
        if (areaCode.equals("1") && sigunguCode.equals("2")) return "중구";
        if (areaCode.equals("6") && sigunguCode.equals("1")) return "중구";
        return "";
    }
}