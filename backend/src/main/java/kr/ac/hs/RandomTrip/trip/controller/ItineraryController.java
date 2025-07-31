package kr.ac.hs.RandomTrip.trip.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import kr.ac.hs.RandomTrip.trip.dto.itinerary.*;
import kr.ac.hs.RandomTrip.trip.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/itineraries")
@RequiredArgsConstructor
@Tag(name = "Itinerary", description = "일정 관리 API")
public class ItineraryController {

    private final ItineraryService itineraryService;

    @PostMapping
    @Operation(summary = "새 일정 생성")
    public ResponseEntity<ItineraryResponseDto> createItinerary(Authentication authentication, @RequestBody ItineraryRequestDto requestDto) {
        String username = getUsername(authentication);
        ItineraryResponseDto responseDto = itineraryService.createItinerary(username, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @GetMapping
    @Operation(summary = "내 모든 일정 조회")
    public ResponseEntity<List<ItineraryResponseDto>> getAllItineraries(Authentication authentication) {
        String username = getUsername(authentication);
        List<ItineraryResponseDto> itineraries = itineraryService.getAllItineraries(username);
        return ResponseEntity.ok(itineraries);
    }

    @GetMapping("/{itineraryId}")
    @Operation(summary = "특정 일정 상세 조회")
    public ResponseEntity<ItineraryDetailResponseDto> getItineraryDetails(Authentication authentication, @PathVariable Long itineraryId) {
        String username = getUsername(authentication);
        ItineraryDetailResponseDto itineraryDetails = itineraryService.getItineraryDetails(username, itineraryId);
        return ResponseEntity.ok(itineraryDetails);
    }

    @PostMapping("/{itineraryId}/items")
    @Operation(summary = "일정에 장소 추가")
    public ResponseEntity<ItineraryItemResponseDto> addItemToItinerary(Authentication authentication, @PathVariable Long itineraryId, @RequestBody ItineraryItemRequestDto requestDto) {
        String username = getUsername(authentication);
        ItineraryItemResponseDto responseDto = itineraryService.addItemToItinerary(username, itineraryId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "일정에서 장소 삭제")
    public ResponseEntity<Void> removeItemFromItinerary(Authentication authentication, @PathVariable Long itemId) {
        String username = getUsername(authentication);
        itineraryService.removeItemFromItinerary(username, itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{itineraryId}")
    @Operation(summary = "일정 삭제")
    public ResponseEntity<Void> deleteItinerary(Authentication authentication, @PathVariable Long itineraryId) {
        String username = getUsername(authentication);
        itineraryService.deleteItinerary(username, itineraryId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{itineraryId}")
    @Operation(summary = "일정 이름 변경")
    public ResponseEntity<ItineraryResponseDto> updateItinerary(Authentication authentication, @PathVariable Long itineraryId, @RequestBody ItineraryRequestDto requestDto) {
        String username = getUsername(authentication);
        ItineraryResponseDto responseDto = itineraryService.updateItinerary(username, itineraryId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @PutMapping("/{itineraryId}/items/order")
    @Operation(summary = "일정 내 장소 순서 변경")
    public ResponseEntity<Void> updateItemOrder(Authentication authentication, @PathVariable Long itineraryId, @RequestBody ItineraryItemOrderRequestDto requestDto) {
        String username = getUsername(authentication);
        itineraryService.updateItemOrder(username, itineraryId, requestDto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{itineraryId}/clone")
    @Operation(summary = "일정 복제")
    public ResponseEntity<ItineraryResponseDto> cloneItinerary(Authentication authentication, @PathVariable Long itineraryId) {
        String username = getUsername(authentication);
        ItineraryResponseDto responseDto = itineraryService.cloneItinerary(username, itineraryId);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    private String getUsername(Authentication authentication) {
        CustomUser user = (CustomUser) authentication.getPrincipal();
        return user.getUsername();
    }
}
