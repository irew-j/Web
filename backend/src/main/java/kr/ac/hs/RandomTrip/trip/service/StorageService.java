package kr.ac.hs.RandomTrip.trip.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final BlobServiceClient blobServiceClient;

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    public String generateSasUploadUrl(String containerName, String blobName) {
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // 5분 동안 유효한 쓰기 전용 SAS 토큰 생성
        OffsetDateTime expiryTime = OffsetDateTime.now().plusMinutes(5);
        BlobSasPermission permission = new BlobSasPermission()
                .setWritePermission(true)
                .setCreatePermission(true);
        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(expiryTime, permission);

        // SAS 토큰이 포함된 전체 URL 반환
        return String.format("%s?%s", blobClient.getBlobUrl(), blobClient.generateSas(values));
    }
    
    public String getPermanentUrl(String containerName, String blobName) {
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
        return String.format("https://%s.blob.core.windows.net/%s/%s", 
            blobServiceClient.getAccountName(),
            containerName, 
            blobName);
    }

    public void deleteBlob(String containerName, String blobName) {
        if (!StringUtils.hasText(blobName)) {
            return; // blob 이름이 없으면 아무것도 하지 않음
        }
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        blobClient.deleteIfExists(); // 파일이 존재할 경우에만 삭제
    }

    public String generateSasReadUrl(String containerName, String blobNameOrUrl) {
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        String blobName;
        // blobNameOrUrl이 전체 URL이면 blob 이름만 추출
        if (blobNameOrUrl.toLowerCase().startsWith("http")) {
            try {
                // URI 객체를 사용하여 URL을 안전하게 파싱
                URI uri = new URI(blobNameOrUrl);
                String path = uri.getPath(); // 예: /mycontainer/images/profile.jpg

                // 경로에서 컨테이너 이름 부분을 찾아 그 뒤의 문자열을 모두 blobName으로 사용
                String prefix = "/" + containerName + "/";
                int containerIndex = path.indexOf(prefix);

                if (containerIndex != -1) {
                    blobName = path.substring(containerIndex + prefix.length());
                } else {
                    throw new IllegalArgumentException("컨테이너 이름이 URL 경로에 존재하지 않습니다.");
                }
            } catch (URISyntaxException e) {
                throw new IllegalArgumentException("잘못된 형식의 Blob URL입니다.", e);
            }
        } else {
            blobName = blobNameOrUrl;
        }

        // --- 이하 로직은 동일 ---
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // Blob이 실제로 존재하는지 확인 (선택 사항이지만 디버깅에 유용)
        if (!blobClient.exists()) {
            // 여기서 로그를 남기거나 예외를 발생시켜 문제를 빠르게 파악할 수 있습니다.
            System.err.printf("Blob이 존재하지 않습니다: 컨테이너=%s, Blob이름=%s%n", containerName, blobName);
            // throw new RuntimeException("Blob not found");
        }

        OffsetDateTime expiryTime = OffsetDateTime.now().plusHours(1);
        BlobSasPermission permission = new BlobSasPermission().setReadPermission(true);
        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(expiryTime, permission);

        return String.format("%s?%s", blobClient.getBlobUrl(), blobClient.generateSas(values));
    }
}
