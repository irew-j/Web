package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

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

    private String getAreaNameFromCode(String areaCode) {
        return areaCodeMap.getOrDefault(areaCode, "");
    }

    public TripResponse toFestivalTripResponse(JsonNode festivalNode) throws Exception {
        String contentId = festivalNode.path("contentid").asText("");
        String contentTypeId = "15"; // 축제/행사 고정
        String title = festivalNode.path("title").asText("축제 정보 없음");
        String addr1 = festivalNode.path("addr1").asText("");
        String addr2 = festivalNode.path("addr2").asText("");
        String address = addr1 + (addr2.isEmpty() ? "" : " " + addr2);
        String areaCode = festivalNode.path("areacode").asText("");
        String mapy = festivalNode.path("mapy").asText("");
        String mapx = festivalNode.path("mapx").asText("");
        String imageUrl = festivalNode.path("firstimage").asText("");
        if (imageUrl.isEmpty()) imageUrl = festivalNode.path("firstimage2").asText("");

        // 축제 기간 정보 추출
        String eventStartDate = festivalNode.path("eventstartdate").asText("");
        String eventEndDate = festivalNode.path("eventenddate").asText("");
        String festivalPeriod = formatFestivalPeriod(eventStartDate, eventEndDate);

        // 상세 정보 가져오기
        JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, contentTypeId);
        String description = "축제 상세 설명 없음";
        if (detailItem.isArray() && detailItem.size() > 0) {
            description = detailItem.get(0).path("overview").asText("축제 상세 설명 없음").replaceAll("<[^>]*>", "");
            if (imageUrl.isEmpty()) imageUrl = detailItem.get(0).path("firstimage").asText("");
            if (imageUrl.isEmpty()) imageUrl = detailItem.get(0).path("firstimage2").asText("");
        }

        // 축제 기간 정보를 description에 추가
        if (!festivalPeriod.isEmpty()) {
            description = "🎉 축제 기간: " + festivalPeriod + "\n\n" + description;
        }

        if (address.isEmpty() || address.trim().equals("주소 없음")) {
            String areaName = getAreaNameFromCode(areaCode);
            address = areaName.isEmpty() ? "대한민국" : areaName;
        }

        TripResponse response = new TripResponse(title, address.trim(), imageUrl, description, areaCode, contentTypeId, mapy, mapx);
        // 임시로 채워넣음
        response.setReason("🎪 이 지역에서 열리는 특별한 축제입니다!");

        return response;
    }

    private String formatFestivalPeriod(String startDate, String endDate) {
        try {
            if (startDate.isEmpty() && endDate.isEmpty()) {
                return "";
            }

            java.time.format.DateTimeFormatter inputFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
            java.time.format.DateTimeFormatter outputFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyy.MM.dd");

            if (!startDate.isEmpty() && !endDate.isEmpty()) {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate, inputFormatter);
                java.time.LocalDate end = java.time.LocalDate.parse(endDate, inputFormatter);

                if (start.equals(end)) {
                    return start.format(outputFormatter);
                } else {
                    return start.format(outputFormatter) + " ~ " + end.format(outputFormatter);
                }
            } else if (!startDate.isEmpty()) {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate, inputFormatter);
                return start.format(outputFormatter) + " ~";
            } else {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate, inputFormatter);
                return "~ " + end.format(outputFormatter);
            }
        } catch (Exception e) {
            return "";
        }
    }
}