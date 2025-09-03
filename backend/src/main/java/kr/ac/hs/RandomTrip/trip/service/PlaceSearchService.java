package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.client.KakaoApiClient;
import kr.ac.hs.RandomTrip.trip.client.TourApiClient;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.dto.TripResponseDto;
import kr.ac.hs.RandomTrip.trip.mapper.DestinationMapper;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class PlaceSearchService {

    private final TourApiClient tourApiClient;
    private final KakaoApiClient kakaoApiClient;
    private final DestinationService destinationService; // DestinationService 주입
    private final DestinationMapper destinationMapper;
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);
    private final LevenshteinDistance levenshteinDistance = new LevenshteinDistance();

    public PlaceSearchService(TourApiClient tourApiClient, KakaoApiClient kakaoApiClient, DestinationService destinationService, DestinationMapper destinationMapper) {
        this.tourApiClient = tourApiClient;
        this.kakaoApiClient = kakaoApiClient;
        this.destinationService = destinationService;
        this.destinationMapper = destinationMapper;
    }

    public List<TripResponseDto> getFestivalsByArea(String areaCode) {
        try {
            if (areaCode == null || areaCode.isEmpty()) {
                return Collections.emptyList();
            }

            JsonNode festivalItems = tourApiClient.searchFestivals(areaCode, 10);
            List<TripResponseDto> festivals = new ArrayList<>();

            if (festivalItems.isArray() && festivalItems.size() > 0) {
                for (JsonNode festivalNode : festivalItems) {
                    // 1. 자기 자신의 private 메서드를 직접 호출합니다.
                    if (isFestivalValid(festivalNode)) {

                        // 2. 복잡한 DB 로직을 DestinationService의 메서드 호출 하나로 대체합니다.
                        Destination finalDestination = destinationService.findOrCreateFestival(festivalNode);

                        if (finalDestination != null) {
                            TripResponseDto festival = destinationMapper.toTripResponse(finalDestination);
                            festival = correctFestivalCoordinates(festival); // DTO 변환 후의 작업은 여기서 처리
                            festivals.add(festival);
                        }
                    }
                }
            }
            return festivals;
        } catch (Exception e) {
            System.err.println("축제 정보 조회 중 오류 발생: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private boolean isFestivalValid(JsonNode festivalNode) {
        try {
            String eventEndDate = festivalNode.path("eventenddate").asText("");
            if (eventEndDate.isEmpty()) return true; // 종료일 없으면 유효 처리

            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
            java.time.LocalDate endDate = java.time.LocalDate.parse(eventEndDate, formatter);
            return !endDate.isBefore(today);
        } catch (Exception e) {
            return true; // 날짜 파싱 오류 시 일단 유효한 것으로 간주
        }
    }

    public List<TripResponseDto> getFestivalsByAreaCode(String areaCode) {
        try {
            return getFestivalsByArea(areaCode);
        } catch (Exception e) {
            System.err.println("축제 정보 조회 중 오류 발생: " + e.getMessage());
            return Collections.singletonList(new TripResponseDto(
                    "축제 정보 조회 실패", "", "", "오류: " + e.getMessage(), "", "", "", ""
            ));
        }
    }

    private TripResponseDto correctFestivalCoordinates(TripResponseDto festival) {
        // "위대한 축구선수 100인 전" 데이터 보정
        if ("위대한 축구선수 100인 전".equals(festival.getTitle()) &&
                festival.getAddress() != null &&
                festival.getAddress().contains("서울특별시 강서구 하늘길 38")) {

            // 올바른 좌표로 보정 (김포공항 인근의 정확한 좌표)
            festival.setMapy("37.5713695798026");  // 위도
            festival.setMapx("126.802960133589");  // 경도
        }

        return festival;
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

    @Transactional
    public Optional<Destination> findTopDestinationByHybridSearch(String placeName) {
        // 1. TourAPI 우선 검색
        try {
            JsonNode tourItems = tourApiClient.searchByKeyword(placeName, "", 1, new String[]{"12", "14", "25", "28"});
            if (tourItems != null && tourItems.size() > 0) {
                // 주입받은 destinationService 인스턴스로 메서드 호출
                return Optional.ofNullable(destinationService.findOrCreateDestinationFromTour(tourItems.get(0)));
            }
        } catch (Exception e) {
            System.err.println("TourAPI search failed during hybrid search: " + e.getMessage());
        }

        // 2. TourAPI에 결과가 없으면 KakaoAPI 검색
        try {
            JsonNode kakaoPlaces = kakaoApiClient.searchPlaces(placeName, "");
            if (kakaoPlaces != null && kakaoPlaces.size() > 0) {
                // 주입받은 destinationService 인스턴스로 메서드 호출
                return Optional.ofNullable(destinationService.findOrCreateDestinationFromKakao(kakaoPlaces.get(0)));
            }
        } catch (Exception e) {
            System.err.println("KakaoAPI search failed during hybrid search: " + e.getMessage());
        }

        return Optional.empty();
    }


    @Transactional
    public TripResponseDto searchAndSavePlace(String placeName, String targetAreaCode, String regionName, String reason) {
        // 1. TourAPI 우선 검색
        try {
            JsonNode tourItems = tourApiClient.searchByKeyword(placeName, targetAreaCode, 1, new String[]{"12", "14", "25", "28"});
            if (tourItems.isArray() && tourItems.size() > 0) {
                JsonNode tourNode = tourItems.get(0);
                // 복잡한 DB 로직을 아래 한 줄로 대체
                Destination destination = destinationService.findOrCreateDestinationFromTour(tourNode);
                if (destination != null) {
                    TripResponseDto response = destinationMapper.toTripResponse(destination);
                    response.setReason(reason);
                    return response;
                }
            }
        } catch (Exception e) {
            System.err.println("TourAPI 키워드 검색 실패 (place: " + placeName + "): " + e.getMessage());
        }

        // 2. KakaoAPI로 검색
        try {
            JsonNode kakaoPlaces = kakaoApiClient.searchPlaces(placeName, regionName);
            if (kakaoPlaces.isArray() && kakaoPlaces.size() > 0) {
                JsonNode placeNode = kakaoPlaces.get(0);
                // 복잡한 DB 로직을 아래 한 줄로 대체
                Destination destination = destinationService.findOrCreateDestinationFromKakao(placeNode);
                if (destination != null) {
                    TripResponseDto response = destinationMapper.toTripResponse(destination);
                    response.setReason(reason);
                    return response;
                }
            }
        } catch (Exception e) {
            System.err.println("KakaoAPI 검색 또는 저장 실패 (place: " + placeName + "): " + e.getMessage());
        }

        return null;
    }

    // 장소 이름으로 Destination 검색
    @Transactional
    public List<TripResponseDto> searchPlace(String keyword) {
        List<Destination> combinedList = new ArrayList<>();
        Set<String> processedTitles = new HashSet<>(); // 중복 체크를 위한 Set

        // 1차 검색 (원본 검색어 사용)
        performSearch(keyword, combinedList, processedTitles);

        // 2차 검색 (1차 검색 결과가 없을 경우, 정제된 검색어 사용)
        if (combinedList.isEmpty()) {
            String cleanedKeyword = cleanSearchQuery(keyword);
            if (!cleanedKeyword.isEmpty() && !cleanedKeyword.equals(keyword)) { // 정제된 키워드가 원본과 다르고 비어있지 않을 때만 재시도
                performSearch(cleanedKeyword, combinedList, processedTitles);
            }
        }

        // 3. 최종 결과 정렬 (원본 검색어와의 유사도 기준)
        // TourAPI 결과가 먼저 오도록 하고, 그 다음 KakaoAPI 결과를 정렬
        combinedList.sort((d1, d2) -> {
            boolean d1FromTour = d1.getContentId() != null && !d1.getContentId().isEmpty();
            boolean d2FromTour = d2.getContentId() != null && !d2.getContentId().isEmpty();

            if (d1FromTour && !d2FromTour) return -1; // d1이 TourAPI, d2가 KakaoAPI -> d1 우선
            if (!d1FromTour && d2FromTour) return 1;  // d2가 TourAPI, d1이 KakaoAPI -> d2 우선

            // 둘 다 TourAPI 또는 둘 다 KakaoAPI인 경우, 정규화된 Levenshtein 유사도로 정렬
            int dist1 = levenshteinDistance.apply(keyword, d1.getTitle());
            int dist2 = levenshteinDistance.apply(keyword, d2.getTitle());
            double normalized1 = (double) dist1 / Math.max(keyword.length(), d1.getTitle().length());
            double normalized2 = (double) dist2 / Math.max(keyword.length(), d2.getTitle().length());
            return Double.compare(normalized1, normalized2); // 정규화된 거리가 짧을수록(유사할수록) 우선
        });

        // 4. 상위 5개 선택 및 TripResponse로 변환
        return combinedList.stream()
                .limit(5)
                .map(destinationMapper::toTripResponse)
                .collect(Collectors.toList());
    }

    // searchPlace의 private 헬퍼 메서드
    private void performSearch(String query, List<Destination> combinedList, Set<String> processedTitles) {
        CompletableFuture<JsonNode> tourFuture = CompletableFuture.supplyAsync(() -> {
            try {
                // 폭탄(Exception)이 터질 수 있는 코드를 try 블록으로 감싼다.
                return tourApiClient.searchByKeyword(query, "", 1, new String[]{"12", "14", "25", "28"});
            } catch (Exception e) {
                // 폭탄이 터졌을 때(catch) 어떻게 할지 정해준다.
                System.err.println("TourAPI 검색 실패: " + e.getMessage());
                return null; // 실패 시에는 null을 반환하도록 처리
            }
        }, executorService);
        CompletableFuture<JsonNode> kakaoFuture = CompletableFuture.supplyAsync(() -> {
            try {
                // 여기도 마찬가지로 try-catch로 감싸준다.
                return kakaoApiClient.searchPlaces(query, "");
            } catch (Exception e) {
                System.err.println("KakaoAPI 검색 실패: " + e.getMessage());
                return null; // 실패 시 null 반환
            }
        }, executorService);

        CompletableFuture.allOf(tourFuture, kakaoFuture).join();

        try {
            JsonNode tourResults = tourFuture.get();
            if (tourResults != null && tourResults.isArray()) {
                for (JsonNode item : tourResults) {
                    if (processedTitles.add(item.path("title").asText())) {
                        // 주입받은 destinationService 인스턴스로 메서드 호출
                        Destination dest = destinationService.findOrCreateDestinationFromTour(item);
                        if (dest != null) combinedList.add(dest);
                    }
                }
            }

            JsonNode kakaoResults = kakaoFuture.get();
            if (kakaoResults != null && kakaoResults.isArray()) {
                for (JsonNode item : kakaoResults) {
                    if (processedTitles.add(item.path("place_name").asText())) {
                        // 주입받은 destinationService 인스턴스로 메서드 호출
                        Destination dest = destinationService.findOrCreateDestinationFromKakao(item);
                        if (dest != null) combinedList.add(dest);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("API 결과 처리 중 오류 발생: " + e.getMessage());
            Thread.currentThread().interrupt();
        }
    }

    // 검색어 정제 헬퍼 메소드
    private String cleanSearchQuery(String query) {
        // 괄호 안의 내용 제거 (예: "모모스커피 본점 - MOMOS COFFEE Flagship Store" -> "모모스커피 본점")
        String cleaned = query.replaceAll("\\s*\\([^)]*\\)|\\s*-\\s*.*", "").trim();

        // 특수문자 제거 (한글, 영어, 숫자만 남김)
        cleaned = cleaned.replaceAll("[^가-힣a-zA-Z0-9\s]", "");

        // 여러 공백을 하나의 공백으로
        cleaned = cleaned.replaceAll("\s+", " ").trim();

        return cleaned;
    }
}
