package kr.ac.hs.RandomTrip.trip.service;

import com.fasterxml.jackson.databind.JsonNode;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.dto.TripRecommendRequest;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final DestinationRepository destinationRepository; // 주입
    private final Random random = new Random();

    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    public TripService(TourApiClient tourApiClient, KakaoApiClient kakaoApiClient,
                       LlmTravelCourseExtractor llmTravelCourseExtractor, DestinationMapper destinationMapper,
                       DestinationRepository destinationRepository) { // 주입
        this.tourApiClient = tourApiClient;
        this.kakaoApiClient = kakaoApiClient;
        this.llmTravelCourseExtractor = llmTravelCourseExtractor;
        this.destinationMapper = destinationMapper;
        this.destinationRepository = destinationRepository; // 주입
    }

    @Transactional
    public TripResponse getRandomDestination() {
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
                        String contentId = selected.path("contentid").asText();
                        
                        // DB에서 찾아보고 없으면 새로 저장
                        Destination destination = destinationRepository.findByContentId(contentId)
                                .orElseGet(() -> {
                                    try {
                                        JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, selected.path("contenttypeid").asText());
                                        String description = "";
                                        if (detailItem.isArray() && detailItem.size() > 0) {
                                            description = detailItem.get(0).path("overview").asText("").replaceAll("<[^>]*>", "");
                                        }
                                        String imageUrl = selected.path("firstimage").asText("");
                                        if (imageUrl.isEmpty()) imageUrl = selected.path("firstimage2").asText("");

                                        Destination newDest = destinationMapper.toDestination(selected, description, imageUrl);
                                        return destinationRepository.save(newDest);
                                    } catch (Exception e) {
                                        System.err.println("랜덤 관광지 상세정보 조회 또는 저장 실패: " + e.getMessage());
                                        return null;
                                    }
                                });

                        if (destination != null) {
                            return destinationMapper.toTripResponse(destination);
                        }
                    }
                }
            }
            System.err.println("랜덤 관광지 검색 실패: 조건에 맞는 관광지 정보를 찾을 수 없습니다.");
            return new TripResponse(); // 실패 시 빈 TripResponse 반환
        } catch (Exception e) {
            System.err.println("getRandomDestination API 호출 오류: " + e.getMessage());
            return new TripResponse(); // 오류 발생 시 빈 TripResponse 반환
        }
    }

    @Transactional
    public List<List<TripResponse>> recommendTrip(TripRecommendRequest request, String transport) {
        try {
            String targetAreaCode = destinationMapper.resolveAreaCode(request.getQuery());
            String regionName = getRegionNameFromQuery(request.getQuery());

            List<List<LlmTravelCourseExtractor.TravelCourseItem>> allCourseItems =
                    llmTravelCourseExtractor.extractTravelCourse(request.getQuery(), transport);

            if (allCourseItems.isEmpty()) {
                return Collections.emptyList();
            }

            List<CompletableFuture<List<TripResponse>>> courseFutures = allCourseItems.stream()
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

    private CompletableFuture<List<TripResponse>> processCourseConcurrently(
            List<LlmTravelCourseExtractor.TravelCourseItem> courseItems,
            String targetAreaCode, String regionName) {

        List<CompletableFuture<TripResponse>> placeFutures = courseItems.stream()
                .map(item -> CompletableFuture.supplyAsync(() ->
                                searchAndSavePlace(item.getPlace(), targetAreaCode, regionName, item.getReason()),
                        executorService
                ))
                .collect(Collectors.toList());

        return CompletableFuture.allOf(placeFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    List<TripResponse> tripResponses = placeFutures.stream()
                            .map(CompletableFuture::join)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                    return optimizeRoute(tripResponses);
                });
    }

    @Transactional
    public TripResponse searchAndSavePlace(String placeName, String targetAreaCode, String regionName, String reason) {
        // 1. TourAPI 우선 검색
        try {
            JsonNode tourItems = tourApiClient.searchByKeyword(placeName, targetAreaCode, 1, new String[]{"12", "14", "25", "28"});
            if (tourItems.isArray() && tourItems.size() > 0) {
                JsonNode tourNode = tourItems.get(0);
                String contentId = tourNode.path("contentid").asText();
                if (contentId != null && !contentId.isEmpty()) {
                    // contentId가 있으면 DB에서 찾아보고, 없으면 새로 만들어 저장 (findOrCreate)
                    Destination destination = destinationRepository.findByContentId(contentId)
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
                                    System.err.println("TourAPI 상세정보 조회 또는 저장 실패 (place: " + placeName + "): " + e.getMessage());
                                    return null; // 실패 시 null 반환
                                }
                            });

                    if (destination != null) {
                        TripResponse response = destinationMapper.toTripResponse(destination);
                        response.setReason(reason);
                        return response; // 성공적으로 TourAPI 정보를 찾았으므로 반환
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("TourAPI 키워드 검색 실패 (place: " + placeName + "): " + e.getMessage());
            // 실패 시 아래 카카오 로직으로 넘어감
        }

        // 2. TourAPI에서 못찾았거나 실패하면 KakaoAPI로 검색
        try {
            JsonNode kakaoPlaces = kakaoApiClient.searchPlaces(placeName, regionName);
            if (kakaoPlaces.isArray() && kakaoPlaces.size() > 0) {
                JsonNode placeNode = kakaoPlaces.get(0);
                String title = placeNode.path("place_name").asText();

                // title로 DB 조회 후 없으면 생성
                List<Destination> existingDestinations = destinationRepository.findByTitle(title);
                Destination destination;
                if (!existingDestinations.isEmpty()) {
                    destination = existingDestinations.get(0); // 첫 번째 결과 사용
                } else {
                    Destination newDest = destinationMapper.toDestination(placeNode);
                    destination = destinationRepository.save(newDest);
                }

                TripResponse response = destinationMapper.toTripResponse(destination);
                response.setReason(reason);
                return response;
            }
        } catch (Exception e) {
            System.err.println("KakaoAPI 검색 또는 저장 실패 (place: " + placeName + "): " + e.getMessage());
        }

        return null; // 최종적으로 모든 API에서 장소를 찾지 못한 경우
    }

    // ... (getRegionNameFromQuery, optimizeRoute, distance 등 나머지 메서드는 거의 동일) 
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

        TripResponse current = unvisited.remove(0);
        route.add(current);

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

    @Transactional
    private List<TripResponse> getFestivalsByArea(String areaCode) {
        try {
            if (areaCode == null || areaCode.isEmpty()) {
                return Collections.emptyList();
            }

            JsonNode festivalItems = tourApiClient.searchFestivals(areaCode, 10);
            List<TripResponse> festivals = new ArrayList<>();

            if (festivalItems.isArray() && festivalItems.size() > 0) {
                for (JsonNode festivalNode : festivalItems) {
                    if (isFestivalValid(festivalNode)) {
                        String contentId = festivalNode.path("contentid").asText();
                        Optional<Destination> existingOpt = destinationRepository.findByContentId(contentId);

                        Destination finalDestination = existingOpt.map(dest -> {
                            // 이미 존재할 경우, festivalPeriod가 비어있으면 업데이트
                            if (dest.getFestivalPeriod() == null || dest.getFestivalPeriod().isEmpty()) {
                                String eventStartDate = festivalNode.path("eventstartdate").asText("");
                                String eventEndDate = festivalNode.path("eventenddate").asText("");
                                dest.setFestivalPeriod(formatFestivalPeriod(eventStartDate, eventEndDate));
                                return destinationRepository.save(dest);
                            }
                            return dest;
                        }).orElseGet(() -> {
                            // 존재하지 않으면 새로 생성
                            try {
                                JsonNode detailItem = tourApiClient.fetchTourDetail(contentId, "15");
                                String description = (detailItem.isArray() && detailItem.size() > 0) ?
                                        detailItem.get(0).path("overview").asText("").replaceAll("<[^>]*>", "") : "";
                                String imageUrl = festivalNode.path("firstimage").asText("");
                                if (imageUrl.isEmpty()) imageUrl = festivalNode.path("firstimage2").asText("");

                                Destination newDest = destinationMapper.toDestination(festivalNode, description, imageUrl);

                                String eventStartDate = festivalNode.path("eventstartdate").asText("");
                                String eventEndDate = festivalNode.path("eventenddate").asText("");
                                newDest.setFestivalPeriod(formatFestivalPeriod(eventStartDate, eventEndDate));

                                return destinationRepository.save(newDest);
                            } catch (Exception e) {
                                System.err.println("축제 상세정보 조회 또는 저장 실패: " + e.getMessage());
                                return null;
                            }
                        });

                        if (finalDestination != null) {
                            TripResponse festival = destinationMapper.toTripResponse(finalDestination);
                            festival = correctFestivalCoordinates(festival);
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

    public List<TripResponse> getFestivalsByAreaCode(String areaCode) {
        try {
            return getFestivalsByArea(areaCode);
        } catch (Exception e) {
            System.err.println("축제 정보 조회 중 오류 발생: " + e.getMessage());
            return Collections.singletonList(new TripResponse(
                    "축제 정보 조회 실패", "", "", "오류: " + e.getMessage(), "", "", "", ""
            ));
        }
    }

    private TripResponse correctFestivalCoordinates(TripResponse festival) {
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

}
