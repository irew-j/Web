package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.client.TourApiClient;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.mapper.DestinationMapper;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true) // 기본적으로 읽기 전용, 쓰기 메서드에 @Transactional 추가
public class DestinationService {
    private final DestinationRepository destinationRepository;
    private final DestinationMapper destinationMapper;
    private final TourApiClient tourApiClient;

    public DestinationService(DestinationRepository destinationRepository, DestinationMapper destinationMapper, TourApiClient tourApiClient) {
        this.destinationRepository = destinationRepository;
        this.destinationMapper = destinationMapper;
        this.tourApiClient = tourApiClient;
    }

    @Transactional
    public Destination findOrCreateDestinationFromTour(JsonNode tourNode) {
        String contentId = tourNode.path("contentid").asText();
        return destinationRepository.findByContentId(contentId)
                .orElseGet(() -> {
                    try {
                        JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, tourNode.path("contenttypeid").asText());
                        String description = "";
                        if (detailItem.isArray() && detailItem.size() > 0) {
                            description = detailItem.get(0).path("overview").asText("").replaceAll("<[^>]*>", "");
                        }
                        String imageUrl = tourNode.path("firstimage").asText("");
                        if (imageUrl.isEmpty()) imageUrl = tourNode.path("firstimage2").asText("");

                        Destination newDest = destinationMapper.toDestination(tourNode, description, imageUrl);
                        return destinationRepository.save(newDest);
                    } catch (Exception e) {
                        System.err.println("TourAPI 상세정보 조회 또는 저장 실패: " + e.getMessage());
                        return null;
                    }
                });
    }

    @Transactional
    public Destination findOrCreateDestinationFromKakao(JsonNode kakaoNode) {
        String title = kakaoNode.path("place_name").asText();
        // Kakao는 contentId가 없으므로 title로만 조회. 동명이소 문제를 감수.
        return destinationRepository.findByTitle(title).stream().findFirst()
                .orElseGet(() -> {
                    Destination newDest = destinationMapper.toDestination(kakaoNode);
                    return destinationRepository.save(newDest);
                });
    }
    @Transactional
    public Destination findOrCreateFestival(JsonNode festivalNode) {
        String contentId = festivalNode.path("contentid").asText();

        // contentId로 DB에서 축제 정보를 찾아봅니다.
        Optional<Destination> existingOpt = destinationRepository.findByContentId(contentId);

        if (existingOpt.isPresent()) {
            // 이미 DB에 있다면 기간 정보만 업데이트가 필요한지 확인합니다.
            Destination dest = existingOpt.get();
            if (dest.getFestivalPeriod() == null || dest.getFestivalPeriod().isEmpty()) {
                String startDate = festivalNode.path("eventstartdate").asText("");
                String endDate = festivalNode.path("eventenddate").asText("");
                // 기간 포맷팅 로직은 PlaceSearchService에서 가져와야 합니다.
                // 혹은 별도의 Util 클래스로 분리하는 것이 가장 좋습니다.
                // 여기서는 임시로 private 메서드로 만들었다고 가정하겠습니다.
                dest.setFestivalPeriod(formatFestivalPeriod(startDate, endDate));
                return destinationRepository.save(dest);
            }
            return dest; // 업데이트 필요 없으면 그대로 반환
        } else {
            // DB에 없다면 새로 생성합니다.
            try {
                JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, "15"); // "15"는 축제 content type id
                String description = (detailItem.isArray() && detailItem.size() > 0) ?
                        detailItem.get(0).path("overview").asText("").replaceAll("<[^>]*>", "") : "";
                String imageUrl = festivalNode.path("firstimage").asText("");
                if (imageUrl.isEmpty()) imageUrl = festivalNode.path("firstimage2").asText("");

                Destination newDest = destinationMapper.toDestination(festivalNode, description, imageUrl);

                String startDate = festivalNode.path("eventstartdate").asText("");
                String endDate = festivalNode.path("eventenddate").asText("");
                newDest.setFestivalPeriod(formatFestivalPeriod(startDate, endDate));

                return destinationRepository.save(newDest);
            } catch (Exception e) {
                System.err.println("축제 상세정보 조회 또는 저장 실패: " + e.getMessage());
                return null;
            }
        }
    }

    // 기간 포맷팅 로직도 DestinationService로 가져옵니다.
    private String formatFestivalPeriod(String startDate, String endDate) {
        // ... (기존 formatFestivalPeriod 메서드 내용과 동일)
        try {
            if (startDate.isEmpty() && endDate.isEmpty()) return "";
            java.time.format.DateTimeFormatter inputFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
            java.time.format.DateTimeFormatter outputFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyy.MM.dd");

            if (!startDate.isEmpty() && !endDate.isEmpty()) {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate, inputFormatter);
                java.time.LocalDate end = java.time.LocalDate.parse(endDate, inputFormatter);
                return start.format(outputFormatter) + " ~ " + end.format(outputFormatter);
            }
            // ...
            return "";
        } catch (Exception e) {
            return "";
        }
    }
}
