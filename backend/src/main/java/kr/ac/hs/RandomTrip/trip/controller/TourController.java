package kr.ac.hs.RandomTrip.trip.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.ac.hs.RandomTrip.guidechat.dto.GuideResponseDto;
import kr.ac.hs.RandomTrip.trip.dto.VerifyRequest;
import kr.ac.hs.RandomTrip.trip.service.TourService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tour")
@Tag(name = "Tour", description = "Tour API")
public class TourController {

    private final TourService tourService;

    public TourController(TourService tourService) {
        this.tourService = tourService;
    }

    @GetMapping("/guide")
    @Operation(summary = "현 위치 기반 가이드 조회", description = "현재 위치에서 가장 가까운 목적지의 가이드 정보를 반환합니다.")
    public ResponseEntity<GuideResponseDto> getGuideForCurrentLocation(@RequestParam double lat, @RequestParam double lon) {
        return tourService.getGuideForCurrentLocation(lat, lon)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/verify")
    @Operation(summary = "위치 방문 인증", description = "목적지 방문을 인증합니다.")
    public ResponseEntity<Map<String, Object>> verifyVisit(@RequestBody VerifyRequest request) {
        boolean success = tourService.verifyVisit(request.getDestinationId(), request.getLat(), request.getLon());
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "방문이 인증되었습니다."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "위치가 너무 멉니다."));
        }
    }
}
