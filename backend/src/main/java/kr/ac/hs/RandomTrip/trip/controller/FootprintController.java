package kr.ac.hs.RandomTrip.trip.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.ac.hs.RandomTrip.auth.security.CustomUser;
import kr.ac.hs.RandomTrip.trip.dto.footprint.FootprintRequestDto;
import kr.ac.hs.RandomTrip.trip.dto.footprint.FootprintResponseDto;
import kr.ac.hs.RandomTrip.trip.service.FootprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@Tag(name = "Footprint", description = "발자국 관련 API")
@RestController
@RequestMapping("/api/footprints")
@RequiredArgsConstructor
public class FootprintController {

    private final FootprintService footprintService;

    @Operation(summary = "내 발자국 목록 조회", description = "현재 로그인된 사용자의 모든 발자국 목록을 최신순으로 조회합니다.")
    @GetMapping
    public ResponseEntity<List<FootprintResponseDto>> getMyFootprints(
            @AuthenticationPrincipal CustomUser customUser) {
        List<FootprintResponseDto> myFootprints = footprintService.getMyFootprints(customUser.getUsername());
        return ResponseEntity.ok(myFootprints);
    }

    @Operation(summary = "발자국 생성", description = "새로운 발자국을 생성하고, 생성된 리소스의 URI를 반환합니다.")
    @PostMapping
    public ResponseEntity<Void> createFootprint(
            @RequestBody FootprintRequestDto requestDto,
            @AuthenticationPrincipal CustomUser customUser) {
        Long footprintId = footprintService.createFootprint(requestDto, customUser.getUsername());
        return ResponseEntity.created(URI.create("/api/footprints/" + footprintId)).build();
    }

    @Operation(summary = "발자국 수정", description = "기존 발자국의 사진이나 메모를 수정합니다.")
    @PutMapping("/{footprintId}")
    public ResponseEntity<Void> updateFootprint(
            @PathVariable Long footprintId,
            @RequestBody FootprintRequestDto requestDto,
            @AuthenticationPrincipal CustomUser customUser) {
        footprintService.updateFootprint(footprintId, requestDto, customUser.getUsername());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "발자국 삭제", description = "특정 발자국을 삭제합니다.")
    @DeleteMapping("/{footprintId}")
    public ResponseEntity<Void> deleteFootprint(
            @PathVariable Long footprintId,
            @AuthenticationPrincipal CustomUser customUser) {
        footprintService.deleteFootprint(footprintId, customUser.getUsername());
        return ResponseEntity.noContent().build();
    }
}
