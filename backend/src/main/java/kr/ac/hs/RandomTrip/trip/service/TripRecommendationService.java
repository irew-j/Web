package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.client.KakaoApiClient;
import kr.ac.hs.RandomTrip.trip.client.TourApiClient;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.dto.TripRecommendRequestDto;
import kr.ac.hs.RandomTrip.trip.dto.TripResponseDto;
import kr.ac.hs.RandomTrip.trip.llm.LlmTravelCourseExtractor;
import kr.ac.hs.RandomTrip.trip.mapper.DestinationMapper;
import kr.ac.hs.RandomTrip.trip.util.RegionUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class TripRecommendationService {
    private final LlmTravelCourseExtractor llmTravelCourseExtractor;
    private final PlaceSearchService placeSearchService;
    private final TripOptimizationService tripOptimizationService;
    private final DestinationService destinationService; // 랜덤 여행지 생성 시 필요
    private final DestinationMapper destinationMapper;
    private final TourApiClient tourApiClient; // 랜덤 여행지 생성 시 필요
    private final KakaoApiClient kakaoApiClient; // 도보 여행 시 필요
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);
    private final Random random = new Random();

    public TripRecommendationService(LlmTravelCourseExtractor llmTravelCourseExtractor, PlaceSearchService placeSearchService,
                                     TripOptimizationService tripOptimizationService, DestinationService destinationService,
                                     DestinationMapper destinationMapper, TourApiClient tourApiClient, KakaoApiClient kakaoApiClient) {
        this.llmTravelCourseExtractor = llmTravelCourseExtractor;
        this.placeSearchService = placeSearchService;
        this.tripOptimizationService = tripOptimizationService;
        this.destinationService = destinationService;
        this.destinationMapper = destinationMapper;
        this.tourApiClient = tourApiClient;
        this.kakaoApiClient = kakaoApiClient;
    }

    // 도보 여행 추천 메서드
    @Transactional
    private List<List<TripResponseDto>> recommendWalkCourse(TripRecommendRequestDto request) throws Exception {
        final String originalQuery = request.getQuery();
        String extractedRegion = RegionUtil.getRegionNameFromQuery(originalQuery);

        final String finalRegionName; // 람다 내에서 사용될 final 변수

        if (extractedRegion != null && !extractedRegion.isBlank()) {
            finalRegionName = extractedRegion; // 기존 쿼리에서 지역명 추출 성공
        } else {
            // 쿼리에 지역명이 없을 경우 AI에게 추천 요청
            System.out.println("요청에서 지역명을 찾을 수 없어 AI에게 지역 추천을 요청합니다: " + originalQuery);
            try {
                String recommendedRegion = llmTravelCourseExtractor.extractRegionFromQuery(originalQuery);
                if (recommendedRegion == null || recommendedRegion.isBlank()) {
                    System.err.println("AI가 지역을 추천하지 못했습니다.");
                    return Collections.emptyList();
                }
                finalRegionName = recommendedRegion; // AI가 추천한 지역명을 할당
                System.out.println("AI가 추천한 지역: " + finalRegionName);
            } catch (Exception e) {
                System.err.println("AI 지역 추천 중 오류 발생: " + e.getMessage());
                return Collections.emptyList();
            }
        }

        final String regionKeyword = finalRegionName.replace("경기도 ", "").replace("특별시", "").replace("광역시", "").replace("시", "");

        // 1. LLM으로 도보 여행 시작점 2개 추천받기 (AI가 추천한 지역명 포함)
        String queryForStartPoints = originalQuery + " (" + finalRegionName + ")";
        List<String> startPointNames = llmTravelCourseExtractor.extractWalkStartPoints(queryForStartPoints);
        if (startPointNames == null || startPointNames.isEmpty()) {
            System.err.println("LLM으로부터 도보 여행 시작점을 추천받지 못했습니다.");
            return Collections.emptyList();
        }

        // 2. 추천받은 시작점들을 검증하고, 유효한 시작점만 병렬로 코스 생성
        List<CompletableFuture<List<TripResponseDto>>> courseFutures = startPointNames.stream()
            .map(startPointName -> CompletableFuture.supplyAsync(() -> {
                try {
                    // 시작점 검증 (finalRegionName 사용)
                    JsonNode placeResults = kakaoApiClient.searchPlaces(startPointName, finalRegionName);
                    if (placeResults == null || !placeResults.isArray() || placeResults.size() == 0) {
                        System.err.println("경고: 추천된 시작점을 찾을 수 없음 - " + startPointName);
                        return null;
                    }

                    JsonNode validStartPoint = null;
                    for (JsonNode place : placeResults) {
                        String address = place.path("address_name").asText();
                        String category = place.path("category_group_code").asText();

                        // 주소와 카테고리를 모두 확인 (AT4: 관광명소, CT1: 문화시설)
                        if (address.contains(regionKeyword) && ("AT4".equals(category) || "CT1".equals(category))) {
                            validStartPoint = place;
                            System.out.println("유효한 시작점 찾음: " + place.path("place_name").asText() + " (카테고리: " + category + ")");
                            break;
                        }
                    }

                    if (validStartPoint == null) {
                        System.err.println("경고: 추천된 시작점 중 요청 지역과 일치하고 여행지에 적합한 카테고리(AT4, CT1)의 장소를 찾지 못함 - " + startPointName);
                        return null;
                    }

                    // 검증 통과, 코스 생성 (finalRegionName, regionKeyword 사용)
                    return createSingleWalkCourse(validStartPoint, finalRegionName, regionKeyword);
                } catch (Exception e) {
                    System.err.println("도보 코스 생성 중 오류 발생 (시작점: " + startPointName + "): " + e.getMessage());
                    return null;
                }
            }, executorService))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        if (courseFutures.isEmpty()) {
            System.err.println("검증을 통과한 유효한 시작점이 없습니다.");
            return Collections.emptyList();
        }

        CompletableFuture<Void> allCoursesFuture = CompletableFuture.allOf(courseFutures.toArray(new CompletableFuture[0]));

        return allCoursesFuture.thenApply(v ->
            courseFutures.stream()
                .map(CompletableFuture::join)
                .filter(course -> course != null && !course.isEmpty())
                .collect(Collectors.toList())
        ).get();
    }

    private List<TripResponseDto> createSingleWalkCourse(JsonNode startPlace, String regionName, String regionKeyword) throws Exception {
        String startPointName = startPlace.path("place_name").asText();
        String startX = startPlace.path("x").asText();
        String startY = startPlace.path("y").asText();

        final int SEARCH_RADIUS = 2500;
        CompletableFuture<JsonNode> attractionsFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return kakaoApiClient.searchByCategory("AT4", startX, startY, SEARCH_RADIUS);
            } catch (Exception e) { return null; }
        }, executorService);

        CompletableFuture<JsonNode> cultureFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return kakaoApiClient.searchByCategory("CT1", startX, startY, SEARCH_RADIUS);
            } catch (Exception e) { return null; }
        }, executorService);

        CompletableFuture.allOf(attractionsFuture, cultureFuture).join();

        Map<String, TripResponseDto> nearbyPlaces = new LinkedHashMap<>();

        Destination startDest = destinationService.findOrCreateDestinationFromKakao(startPlace);
        if (startDest != null) {
            nearbyPlaces.put(startDest.getTitle(), destinationMapper.toTripResponse(startDest));
        }

        String mainKeyword = startPointName.split(" ")[0];

        addPlacesToMap(nearbyPlaces, attractionsFuture.get(), mainKeyword, regionKeyword);
        addPlacesToMap(nearbyPlaces, cultureFuture.get(), mainKeyword, regionKeyword);

        List<TripResponseDto> finalCourse = new ArrayList<>(nearbyPlaces.values());
        if (finalCourse.size() > 1) {
            finalCourse = tripOptimizationService.optimizeRoute(finalCourse);
        }
        return finalCourse.stream().limit(4).collect(Collectors.toList());
    }

    private void addPlacesToMap(Map<String, TripResponseDto> placeMap, JsonNode placesNode, String startPointKeyword, String regionKeyword) {
        if (placesNode != null && placesNode.isArray()) {
            for (JsonNode place : placesNode) {
                String placeName = place.path("place_name").asText();
                String address = place.path("address_name").asText();

                if (placeName.contains(startPointKeyword) && !placeName.equals(startPointKeyword)) {
                    continue;
                }
                if (!address.contains(regionKeyword)) {
                    continue;
                }

                Destination dest = destinationService.findOrCreateDestinationFromKakao(place);
                if (dest != null) {
                    placeMap.putIfAbsent(dest.getTitle(), destinationMapper.toTripResponse(dest));
                }
            }
        }
    }

    private CompletableFuture<List<TripResponseDto>> processCourseConcurrently(
            List<LlmTravelCourseExtractor.TravelCourseItem> courseItems,
            String targetAreaCode, String regionName) {

        List<CompletableFuture<TripResponseDto>> placeFutures = courseItems.stream()
                .map(item -> CompletableFuture.supplyAsync(() ->
                                placeSearchService.searchAndSavePlace(item.getPlace(), targetAreaCode, regionName, item.getReason()),
                        executorService
                ))
                .collect(Collectors.toList());

        return CompletableFuture.allOf(placeFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    List<TripResponseDto> tripResponses = placeFutures.stream()
                            .map(CompletableFuture::join)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                    return tripOptimizationService.optimizeRoute(tripResponses);
                });
    }

    // 여행 추천 메서드
    @Transactional
    public List<List<TripResponseDto>> recommendTrip(TripRecommendRequestDto request, String transport) {
        try {
            // "도보"일 경우 새로운 로직 실행
            if ("도보".equals(transport)) {
                return recommendWalkCourse(request);
            }

            // 기존 차량, 대중교통 로직
            String targetAreaCode = destinationMapper.resolveAreaCode(request.getQuery());
            String regionName = RegionUtil.getRegionNameFromQuery(request.getQuery());

            List<List<LlmTravelCourseExtractor.TravelCourseItem>> allCourseItems =
                    llmTravelCourseExtractor.extractTravelCourse(request.getQuery(), transport);

            if (allCourseItems.isEmpty()) {
                return Collections.emptyList();
            }

            List<CompletableFuture<List<TripResponseDto>>> courseFutures = allCourseItems.stream()
                    .map(courseItems -> processCourseConcurrently(courseItems, targetAreaCode, regionName))
                    .collect(Collectors.toList());

            CompletableFuture<Void> allCourses = CompletableFuture.allOf(courseFutures.toArray(new CompletableFuture[0]));

            return allCourses.thenApply(v ->
                    courseFutures.stream()
                            .map(CompletableFuture::join)
                            .filter(course -> !course.isEmpty())
                            .collect(Collectors.toList())
            ).get();

        } catch (Exception e) {
            System.err.println("Recommend trip failed: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional
    public TripResponseDto getRandomDestination() {
        try {
            String[] allowedContentTypes = {"12", "14", "25", "28"}; // 관광지, 문화시설, 여행코스, 레포츠
            int maxRetries = 10; // 최대 재시도 횟수

            for (int i = 0; i < maxRetries; i++) {
                int randomPage = random.nextInt(100) + 1; // 1부터 100까지 랜덤 페이지
                JsonNode items = tourApiClient.fetchAreaBasedList(randomPage, 10); // 10개 항목 가져오기

                if (items.isArray() && items.size() > 0) {
                    List<JsonNode> filtered = new ArrayList<>();
                    for (JsonNode item : items) {
                        String contentTypeId = item.path("contenttypeid").asText();
                        if (Arrays.asList(allowedContentTypes).contains(contentTypeId)) {
                            filtered.add(item);
                        }
                    }

                    if (!filtered.isEmpty()) {
                        JsonNode selected = filtered.get(random.nextInt(filtered.size()));

                        // DB에서 찾아보고 없으면 새로 저장
                        Destination destination = destinationService.findOrCreateDestinationFromTour(selected);

                        if (destination != null) {
                            return destinationMapper.toTripResponse(destination);
                        }
                    }
                }
            }
            System.err.println("랜덤 관광지 검색 실패: 조건에 맞는 관광지 정보를 찾을 수 없습니다.");
            return new TripResponseDto(); // 실패 시 빈 TripResponse 반환
        } catch (Exception e) {
            System.err.println("getRandomDestination API 호출 오류: " + e.getMessage());
            return new TripResponseDto(); // 오류 발생 시 빈 TripResponse 반환
        }
    }
}
