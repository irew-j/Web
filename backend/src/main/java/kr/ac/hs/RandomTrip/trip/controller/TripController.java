package kr.ac.hs.RandomTrip.trip.controller;

import java.util.List;

import kr.ac.hs.RandomTrip.trip.service.DirectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import kr.ac.hs.RandomTrip.trip.dto.TripRecommendRequest;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import kr.ac.hs.RandomTrip.trip.service.TripService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/trip")
@Tag(name = "Trip", description = "Trip API")
public class TripController {

    private final TripService tripService;
    private final DirectionService directionService;

    public TripController(TripService tripService, DirectionService directionService) {
        this.tripService = tripService;
        this.directionService = directionService;
    }

    @GetMapping("/random")
    @Operation(summary = "랜덤 관광지 조회", description = "완전한 랜덤 관광지를 추천합니다")
    public ResponseEntity<TripResponse> getRandomDestination() {
        TripResponse response = tripService.getRandomDestination();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recommend-walk")
    @Operation(summary = "도보 여행 코스 추천", description = "도보로 이동 가능한 여행 코스를 추천합니다")
    public ResponseEntity<List<List<TripResponse>>> recommendTripWalk(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "도보"));
    }

    @PostMapping("/recommend-car")
    @Operation(summary = "차량 여행 코스 추천", description = "차량으로 이동하는 여행 코스를 추천합니다")
    public ResponseEntity<List<List<TripResponse>>> recommendTripCar(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "차량"));
    }

    @PostMapping("/recommend-transit")
    @Operation(summary = "대중교통 여행 코스 추천", description = "대중교통으로 이동하는 여행 코스를 추천합니다")
    public ResponseEntity<List<List<TripResponse>>> recommendTripTransit(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "대중교통"));
    }

    // 축제 정보 조회 API - GET 방식으로 변경 (areaCode 사용)
    @GetMapping("/festivals")
    @Operation(summary = "지역별 축제 정보 조회", description = "지역코드에 해당하는 축제 정보를 조회합니다")
    public ResponseEntity<List<TripResponse>> getFestivals(
            @Parameter(description = "지역코드 (예: 1-서울, 6-부산, 31-경기도)", example = "1")
            @RequestParam String areaCode) {
        List<TripResponse> festivals = tripService.getFestivalsByAreaCode(areaCode);
        return ResponseEntity.ok(festivals);
    }

    // 카카오 길찾기 기능(자동차)
    @GetMapping("/directions")
    @Operation(summary = "카카오 길찾기 기능(자동차)", description = "출발지와 목적지 좌표를 기반으로 길찾기 정보를 제공합니다")
    public Mono<String> getDirections(
            @Parameter(description = "출발지 위도", example = "37.5665")
            @RequestParam double originLat,
            @Parameter(description = "출발지 경도", example = "126.9780")
            @RequestParam double originLng,
            @Parameter(description = "목적지 위도", example = "37.5651")
            @RequestParam double destLat,
            @Parameter(description = "목적지 경도", example = "126.9895")
            @RequestParam double destLng) {
        return directionService.getDirections(originLat, originLng, destLat, destLng);
    }
}