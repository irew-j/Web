package kr.ac.hs.RandomTrip.trip.service;

import jakarta.persistence.EntityNotFoundException;
import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.domain.Footprint;
import kr.ac.hs.RandomTrip.trip.dto.footprint.FootprintRequestDto;
import kr.ac.hs.RandomTrip.trip.dto.footprint.FootprintResponseDto;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import kr.ac.hs.RandomTrip.trip.repository.FootprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class FootprintService {

    private final FootprintRepository footprintRepository;
    private final MemberRepository memberRepository;
    private final DestinationRepository destinationRepository;
    private final StorageService storageService; // StorageService 주입

    // 내 모든 발자국 조회
    public List<FootprintResponseDto> getMyFootprints(String username) {
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. ID: " + username));

        return footprintRepository.findAllByMemberOrderByCreatedAtDesc(member).stream()
                .map(footprint -> {
                    String sasUrl = null;
                    String storedPath = footprint.getPhotoUrl();

                    // photoUrl에 값이 있을 경우에만 SAS URL 생성
                    if (StringUtils.hasText(storedPath)) {
                        sasUrl = storageService.generateSasReadUrl("footprint-images", storedPath);
                    }
                    return new FootprintResponseDto(footprint, sasUrl);
                })
                .collect(Collectors.toList());
    }

    // 발자국 생성
    @Transactional
    public Long createFootprint(FootprintRequestDto requestDto, String username) {
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. ID: " + username));

        Destination destination = destinationRepository.findById(requestDto.getDestinationId())
                .orElseThrow(() -> new EntityNotFoundException("장소를 찾을 수 없습니다. ID: " + requestDto.getDestinationId()));

        Footprint footprint = Footprint.builder()
                .member(member)
                .destination(destination)
                .memo(requestDto.getMemo())
                .photoUrl(requestDto.getPhotoUrl())
                .build();

        Footprint savedFootprint = footprintRepository.save(footprint);
        return savedFootprint.getId();
    }

    // 발자국 수정
    @Transactional
    public Long updateFootprint(Long footprintId, FootprintRequestDto requestDto, String username) {
        Footprint footprint = footprintRepository.findById(footprintId)
                .orElseThrow(() -> new EntityNotFoundException("발자국을 찾을 수 없습니다. ID: " + footprintId));

        // 권한 확인
        if (!footprint.getMember().getUsername().equals(username)) {
            throw new IllegalStateException("이 발자국을 수정할 권한이 없습니다.");
        }

        footprint.update(requestDto.getMemo(), requestDto.getPhotoUrl());
        return footprint.getId();
    }

    // 발자국 삭제
    @Transactional
    public void deleteFootprint(Long footprintId, String username) {
        Footprint footprint = footprintRepository.findById(footprintId)
                .orElseThrow(() -> new EntityNotFoundException("발자국을 찾을 수 없습니다. ID: " + footprintId));

        if (!footprint.getMember().getUsername().equals(username)) {
            throw new IllegalStateException("이 발자국을 삭제할 권한이 없습니다.");
        }

        // 1. Azure Storage에서 파일 삭제
        String blobName = footprint.getPhotoUrl();
        storageService.deleteBlob("footprint-images", blobName);

        // 2. DB에서 레코드 삭제
        footprintRepository.delete(footprint);
    }
}
