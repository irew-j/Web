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

    // Levenshtein Distance 계산을 위한 StringUtils (Apache Commons Text)
    private final org.apache.commons.text.similarity.LevenshteinDistance levenshteinDistance = new org.apache.commons.text.similarity.LevenshteinDistance();

    public TripService(TourApiClient tourApiClient, KakaoApiClient kakaoApiClient,
                       LlmTravelCourseExtractor llmTravelCourseExtractor, DestinationMapper destinationMapper,
                       DestinationRepository destinationRepository) {
        this.tourApiClient = tourApiClient;
        this.kakaoApiClient = kakaoApiClient;
        this.llmTravelCourseExtractor = llmTravelCourseExtractor;
        this.destinationMapper = destinationMapper;
        this.destinationRepository = destinationRepository;
    }

    // 장소 이름으로 Destination 검색
    @Transactional
    public List<TripResponse> searchPlace(String keyword) {
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

    private void performSearch(String query, List<Destination> combinedList, Set<String> processedTitles) {
        CompletableFuture<JsonNode> tourFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return tourApiClient.searchByKeyword(query, "", 1, new String[]{"12", "14", "25", "28"});
            } catch (Exception e) {
                System.err.println("TourAPI 검색 실패: " + e.getMessage());
                return null;
            }
        }, executorService);

        CompletableFuture<JsonNode> kakaoFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return kakaoApiClient.searchPlaces(query, "");
            } catch (Exception e) {
                System.err.println("KakaoAPI 검색 실패: " + e.getMessage());
                return null;
            }
        }, executorService);

        CompletableFuture.allOf(tourFuture, kakaoFuture).join();

        try {
            // TourAPI 결과 처리
            JsonNode tourResults = tourFuture.get();
            if (tourResults != null && tourResults.isArray()) {
                for (JsonNode item : tourResults) {
                    String title = item.path("title").asText();
                    if (processedTitles.add(title)) { // 중복이 아니면 추가
                        Destination dest = findOrCreateDestinationFromTour(item);
                        if (dest != null) {
                            combinedList.add(dest);
                        }
                    }
                }
            }

            // KakaoAPI 결과 처리 (TourAPI 결과와 중복되지 않는 것만 추가)
            JsonNode kakaoResults = kakaoFuture.get();
            if (kakaoResults != null && kakaoResults.isArray()) {
                for (JsonNode item : kakaoResults) {
                    String title = item.path("place_name").asText();
                    if (processedTitles.add(title)) { // 중복이 아니면 추가
                        Destination dest = findOrCreateDestinationFromKakao(item);
                        if (dest != null) {
                            combinedList.add(dest);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("API 결과 처리 중 오류 발생: " + e.getMessage());
            Thread.currentThread().interrupt();
        }
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
    
    // 여행 추천 메서드
    @Transactional
    public List<List<TripResponse>> recommendTrip(TripRecommendRequest request, String transport) {
        try {
            // "도보"일 경우 새로운 로직 실행
            if ("도보".equals(transport)) {
                return recommendWalkCourse(request);
            }

            // 기존 차량, 대중교통 로직
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
    
    // 도보 여행 추천 메서드
    @Transactional
    private List<List<TripResponse>> recommendWalkCourse(TripRecommendRequest request) throws Exception {
        final String originalQuery = request.getQuery();
        String extractedRegion = getRegionNameFromQuery(originalQuery);

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
        List<CompletableFuture<List<TripResponse>>> courseFutures = startPointNames.stream()
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
                        if (address.contains(regionKeyword)) { // final 변수인 regionKeyword 사용
                            validStartPoint = place;
                            break;
                        }
                    }

                    if (validStartPoint == null) {
                        System.err.println("경고: 추천된 시작점이 요청 지역과 일치하는 검색 결과를 찾지 못함 - " + startPointName);
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

    private List<TripResponse> createSingleWalkCourse(JsonNode startPlace, String regionName, String regionKeyword) throws Exception {
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

        Map<String, TripResponse> nearbyPlaces = new LinkedHashMap<>();
        Destination startDest = findOrCreateDestinationFromKakao(startPlace);
        if (startDest != null) {
            nearbyPlaces.put(startDest.getTitle(), destinationMapper.toTripResponse(startDest));
        }

        String mainKeyword = startPointName.split(" ")[0];

        addPlacesToMap(nearbyPlaces, attractionsFuture.get(), mainKeyword, regionKeyword);
        addPlacesToMap(nearbyPlaces, cultureFuture.get(), mainKeyword, regionKeyword);

        List<TripResponse> finalCourse = new ArrayList<>(nearbyPlaces.values());
        if (finalCourse.size() > 1) {
            finalCourse = optimizeRoute(finalCourse);
        }

        return finalCourse.stream().limit(4).collect(Collectors.toList());
    }

    private void addPlacesToMap(Map<String, TripResponse> placeMap, JsonNode placesNode, String startPointKeyword, String regionKeyword) {
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

                Destination dest = findOrCreateDestinationFromKakao(place);
                if (dest != null) {
                    placeMap.putIfAbsent(dest.getTitle(), destinationMapper.toTripResponse(dest));
                }
            }
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
        // 광역시/도
        regionMap.put("서울", "서울"); // 서울특별시 대신 서울로 수정
        regionMap.put("부산", "부산"); // 부산광역시 대신 부산으로 수정
        regionMap.put("대구", "대구"); // 대구광역시 대신 대구로 수정
        regionMap.put("인천", "인천"); // 인천광역시 대신 인천으로 수정
        regionMap.put("광주", "광주"); // 광주광역시 대신 광주로 수정
        regionMap.put("대전", "대전"); // 대전광역시 대신 대전으로 수정
        regionMap.put("울산", "울산"); // 울산광역시 대신 울산으로 수정
        regionMap.put("세종", "세종"); // 세종특별자치시 대신 세종으로 수정

        // 도
        regionMap.put("경기", "경기"); // 경기도 대신 경기
        regionMap.put("강원", "강원"); // 강원특별자치도 대신 강원
        regionMap.put("충북", "충북"); // 충청북도 대신 충북
        regionMap.put("충남", "충남"); // 충청남도 대신 충남
        regionMap.put("전북", "전북"); // 전북특별자치도 대신 전북
        regionMap.put("전남", "전남");
        regionMap.put("경북", "경북");
        regionMap.put("경남", "경남"); // 경상남도 대신 경남
        regionMap.put("제주", "제주"); // 제주특별자치도 대신 제주

        // 경기도 주요 시
        regionMap.put("수원", "경기 수원시");
        regionMap.put("성남", "경기 성남시");
        regionMap.put("고양", "경기 고양시");
        regionMap.put("용인", "경기 용인시");
        regionMap.put("부천", "경기 부천시");
        regionMap.put("안산", "경기 안산시");
        regionMap.put("안양", "경기 안양시");
        regionMap.put("평택", "경기 평택시");
        regionMap.put("화성", "경기 화성시");
        regionMap.put("시흥", "경기 시흥시");
        regionMap.put("의정부", "경기 의정부시");
        regionMap.put("남양주", "경기 남양주시");
        regionMap.put("하남", "경기 하남시");
        regionMap.put("군포", "경기 군포시");
        regionMap.put("이천", "경기 이천시");
        regionMap.put("파주", "경기 파주시");
        regionMap.put("구리", "경기 구리시");
        regionMap.put("광명", "경기 광명시");
        regionMap.put("김포", "경기 김포시");
        regionMap.put("오산", "경기 오산시");
        regionMap.put("안성", "경기 안성시");
        regionMap.put("양주", "경기 양주시");
        regionMap.put("포천", "경기 포천시");
        regionMap.put("여주", "경기 여주시");

        // 강원특별자치도 주요 시
        regionMap.put("춘천", "강원 춘천시");
        regionMap.put("원주", "강원 원주시");
        regionMap.put("강릉", "강원 강릉시");
        regionMap.put("동해", "강원 동해시");
        regionMap.put("태백", "강원 태백시");
        regionMap.put("속초", "강원 속초시");
        regionMap.put("삼척", "강원 삼척시");

        // 충청북도 주요 시
        regionMap.put("청주", "충북 청주시");
        regionMap.put("충주", "충북 충주시");
        regionMap.put("제천", "충북 제천시");

        // 충청남도 주요 시
        regionMap.put("천안", "충남 천안시");
        regionMap.put("아산", "충남 아산시");
        regionMap.put("공주", "충남 공주시");
        regionMap.put("서산", "충남 서산시");
        regionMap.put("논산", "충남 논산시");
        regionMap.put("계룡", "충남 계룡시");

        // 전북특별자치도 주요 시
        regionMap.put("전주", "전북 전주시");
        regionMap.put("군산", "전북 군산시");
        regionMap.put("익산", "전북 익산시");
        regionMap.put("정읍", "전북 정읍시");
        regionMap.put("남원", "전북 남원시");

        // 전라남도 주요 시
        regionMap.put("목포", "전남 목포시");
        regionMap.put("여수", "전남 여수시");
        regionMap.put("순천", "전남 순천시");
        regionMap.put("나주", "전남 나주시");

        // 경상북도 주요 시
        regionMap.put("포항", "경북 포항시");
        regionMap.put("경주", "경북 경주시");
        regionMap.put("구미", "경북 구미시");
        regionMap.put("안동", "경북 안동시");
        regionMap.put("영주", "경북 영주시");

        // 경상남도 주요 시
        regionMap.put("창원", "경남 창원시");
        regionMap.put("진주", "경남 진주시");
        regionMap.put("김해", "경남 김해시");
        regionMap.put("통영", "경남 통영시");
        regionMap.put("사천", "경남 사천시");

        // 제주특별자치도
        regionMap.put("제주", "제주 제주시"); // 제주특별자치도는 제주시와 서귀포시로 나뉘며, '제주'는 제주시를 의미하는 경우가 많아 추가합니다.
        regionMap.put("서귀포", "제주 서귀포시");
        
        // 한신대 근처 지역으로 매핑
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
