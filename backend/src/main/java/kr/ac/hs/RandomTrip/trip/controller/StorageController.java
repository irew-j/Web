package kr.ac.hs.RandomTrip.trip.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.ac.hs.RandomTrip.trip.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Storage", description = "파일 스토리지 관련 API")
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @Operation(summary = "업로드용 SAS URL 생성", description = "Azure Blob Storage에 파일을 업로드할 수 있는 임시 URL과 영구 URL을 생성합니다.")
    @PostMapping("/sas-url")
    public ResponseEntity<Map<String, String>> getSasUrl() {
        String containerName = "footprint-images"; // Azure에 생성한 컨테이너 이름
        String blobName = UUID.randomUUID().toString(); // 유니크한 파일 이름 생성

        String sasUrl = storageService.generateSasUploadUrl(containerName, blobName);
        String permanentUrl = storageService.getPermanentUrl(containerName, blobName);

        Map<String, String> response = new HashMap<>();
        response.put("sasUrl", sasUrl); // 업로드에 사용할 임시 URL
        response.put("permanentUrl", permanentUrl); // DB에 저장할 영구 URL

        return ResponseEntity.ok(response);
    }
}
