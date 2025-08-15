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

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

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
}
