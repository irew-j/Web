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
    public ResponseEntity<TripResponse> getRandomDestination() {
        TripResponse response = tripService.getRandomDestination();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recommend-walk")
    public ResponseEntity<List<List<TripResponse>>> recommendTripWalk(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "도보"));
    }

    @PostMapping("/recommend-car")
    public ResponseEntity<List<List<TripResponse>>> recommendTripCar(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "차량"));
    }

    @PostMapping("/recommend-transit")
    public ResponseEntity<List<List<TripResponse>>> recommendTripTransit(@RequestBody TripRecommendRequest request) {
        return ResponseEntity.ok(tripService.recommendTrip(request, "대중교통"));
    }

//    카카오 길찾기 기능(자동차)
    @GetMapping("/directions")
    public Mono<String> getDirections(@RequestParam double originLat,
                                      @RequestParam double originLng,
                                      @RequestParam double destLat,
                                      @RequestParam double destLng) {
        return directionService.getDirections(originLat, originLng, destLat, destLng);
    }


}