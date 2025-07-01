package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.dto.TripRecommendRequest;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class TripService {
    private final TourApiClient tourApiClient;
    private final KakaoApiClient kakaoApiClient;
    private final LlmTravelCourseExtractor llmTravelCourseExtractor;
    private final DestinationMapper destinationMapper;
    private final Random random = new Random();

    // 스레드 풀 생성 (장소 검색용)
    private final ExecutorService executorService = Executors.newFixedThreadPool(8);

    public TripService(TourApiClient tourApiClient, KakaoApiClient kakaoApiClient,
                       LlmTravelCourseExtractor llmTravelCourseExtractor, DestinationMapper destinationMapper) {
        this.tourApiClient = tourApiClient;
        this.kakaoApiClient = kakaoApiClient;
        this.llmTravelCourseExtractor = llmTravelCourseExtractor;
        this.destinationMapper = destinationMapper;
    }

    public TripResponse getRandomDestination() {
        try {
            String[] allowedContentTypes = {"12", "14", "25", "28"}; // 관광지, 문화시설, 여행코스, 레포츠
            int maxRetries = 10;

            for (int i = 0; i < maxRetries; i++) {
                int randomPage = random.nextInt(100) + 1;
                JsonNode items = tourApiClient.fetchAreaBasedList(randomPage, 10);

                if (items.isArray()) {
                    List<JsonNode> filtered = new ArrayList<>();
                    for (JsonNode item : items) {
                        String contentTypeId = item.path("contenttypeid").asText();
                        if (Arrays.asList(allowedContentTypes).contains(contentTypeId)) {
                            filtered.add(item);
                        }
                    }

                    if (!filtered.isEmpty()) {
                        JsonNode selected = filtered.get(random.nextInt(filtered.size()));
                        return destinationMapper.toTripResponse(selected);
                    }
                }
            }

            return new TripResponse("조건에 맞는 관광지 정보가 없습니다.", "", "", "", "", "", Collections.emptyList().toString(), "", "");
        } catch (Exception e) {
            return new TripResponse("API 호출 오류", "", "", e.getMessage(), "", "", Collections.emptyList().toString(), "", "");
        }
    }

    public List<List<TripResponse>> recommendTrip(TripRecommendRequest request, String transport) {
        try {
            String targetAreaCode = destinationMapper.resolveAreaCode(request.getQuery());
            String regionName = getRegionNameFromQuery(request.getQuery());

            // transport 인자를 LLM 호출에 추가
            List<List<LlmTravelCourseExtractor.TravelCourseItem>> allCourseItems =
                    llmTravelCourseExtractor.extractTravelCourse(request.getQuery(), transport);

            if (allCourseItems.isEmpty()) {
                return Collections.singletonList(Collections.singletonList(new TripResponse(
                        "코스 생성 실패", "", "", "여행 코스를 생성할 수 없습니다.", "", "", "", ""
                )));
            }

            // 나머지 로직은 동일
            List<CompletableFuture<List<TripResponse>>> courseFutures = allCourseItems.stream()
                    .map(courseItems -> processCourseConcurrently(courseItems, targetAreaCode, regionName))
                    .collect(Collectors.toList());

            CompletableFuture<Void> allCourses = CompletableFuture.allOf(
                    courseFutures.toArray(new CompletableFuture[0])
            );

            List<List<TripResponse>> results = allCourses.thenApply(v ->
                    courseFutures.stream()
                            .map(CompletableFuture::join)
                            .filter(course -> !course.isEmpty())
                            .collect(Collectors.toList())
            ).get();


            if (results.isEmpty()) {
                return Collections.singletonList(Collections.singletonList(new TripResponse(
                        "추천 실패", "", "", "코스에 맞는 여행지를 찾을 수 없습니다.", "", "", "", ""
                )));
            }


            return results;

        } catch (Exception e) {
            return Collections.singletonList(Collections.singletonList(new TripResponse(
                    "추천 실패", "", "", "오류: " + e.getMessage(), "", "", "", ""
            )));
        }
    }

    // 코스 내 장소들을 병렬로 처리
    private CompletableFuture<List<TripResponse>> processCourseConcurrently(
            List<LlmTravelCourseExtractor.TravelCourseItem> courseItems,
            String targetAreaCode, String regionName) {

        List<CompletableFuture<TripResponse>> placeFutures = courseItems.stream()
                .map(item -> CompletableFuture.supplyAsync(() ->
                                searchPlaceFromBothApis(item.getPlace(), targetAreaCode, regionName, item.getReason()),
                        executorService
                ))
                .collect(Collectors.toList());

        return CompletableFuture.allOf(placeFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    List<TripResponse> tripResponses = placeFutures.stream()
                            .map(CompletableFuture::join)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());

                    return tripResponses.isEmpty()
                            ? Collections.singletonList(new TripResponse(
                            "검색 결과 없음", "", "", "코스에 맞는 여행지를 찾을 수 없습니다.", "", "", "", ""
                    ))
                            : optimizeRoute(tripResponses);
                });
    }

    // 개선된 장소 검색 (타임아웃 추가)
    private TripResponse searchPlaceFromBothApis(String placeName, String targetAreaCode, String regionName, String reason) {
        try {
            String[] allowedContentTypes = {"12", "14", "25", "28"};

            // 1. Tour API 검색 (타임아웃 단축)
            JsonNode tourItems = tourApiClient.searchByKeyword(placeName, targetAreaCode, 5, allowedContentTypes); // numOfRows 줄임
            List<JsonNode> filteredItems = destinationMapper.filterByAreaCode(tourItems, targetAreaCode);

            if (!filteredItems.isEmpty()) {
                JsonNode selected = filteredItems.get(0); // 랜덤 대신 첫 번째 결과 사용
                TripResponse trip = destinationMapper.toTripResponse(selected);
                trip.setReason(reason);
                return trip;
            }

            // 2. Kakao API 검색 (백업)
            JsonNode kakaoPlaces = kakaoApiClient.searchPlaces(placeName, regionName);
            if (kakaoPlaces.isArray() && kakaoPlaces.size() > 0) {
                return kakaoApiClient.toTripResponse(kakaoPlaces.get(0), reason);
            }

            return null;

        } catch (Exception e) {
            System.err.println("장소 검색 중 오류 발생 (" + placeName + "): " + e.getMessage());
            return null;
        }
    }

    private String getRegionNameFromQuery(String query) {
        Map<String, String> regionMap = new HashMap<>();
        regionMap.put("서울", "서울");
        regionMap.put("부산", "부산");
        regionMap.put("대구", "대구");
        regionMap.put("인천", "인천");
        regionMap.put("광주", "광주");
        regionMap.put("대전", "대전");
        regionMap.put("울산", "울산");
        regionMap.put("세종", "세종");
        regionMap.put("경기", "경기도");
        regionMap.put("강원", "강원도");
        regionMap.put("충북", "충청북도");
        regionMap.put("충남", "충청남도");
        regionMap.put("전북", "전라북도");
        regionMap.put("전남", "전라남도");
        regionMap.put("경북", "경상북도");
        regionMap.put("경남", "경상남도");
        regionMap.put("제주", "제주도");
        regionMap.put("수원", "경기도 수원");
        regionMap.put("한신대", "경기도 오산");

        for (Map.Entry<String, String> entry : regionMap.entrySet()) {
            if (query.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private List<TripResponse> optimizeRoute(List<TripResponse> points) {
        if (points.size() <= 2) return points;

        List<TripResponse> route = new ArrayList<>();
        List<TripResponse> unvisited = new ArrayList<>(points);

        // 첫 번째 장소(대표 장소)를 고정
        TripResponse current = unvisited.remove(0);
        route.add(current);

        // 나머지 장소들만 최적화
        while (!unvisited.isEmpty()) {
            TripResponse finalCurrent = current;
            TripResponse next = unvisited.stream()
                    .min(Comparator.comparingDouble(p -> distance(finalCurrent, p)))
                    .orElse(unvisited.get(0));

            route.add(next);
            unvisited.remove(next);
            current = next;
        }

        return route;
    }

    private double distance(TripResponse a, TripResponse b) {
        try {
            double lat1 = Double.parseDouble(a.getMapy());
            double lon1 = Double.parseDouble(a.getMapx());
            double lat2 = Double.parseDouble(b.getMapy());
            double lon2 = Double.parseDouble(b.getMapx());
            double dLat = Math.toRadians(lat2 - lat1);
            double dLon = Math.toRadians(lon2 - lon1);
            double r = 6371;
            double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return 2 * r * Math.asin(Math.sqrt(h));
        } catch (Exception e) {
            return Double.MAX_VALUE;
        }
    }
}