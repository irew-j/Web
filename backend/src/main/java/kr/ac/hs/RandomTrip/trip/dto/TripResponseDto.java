package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripResponseDto {
    private Long id; // 데이터베이스 ID
    private String title;
    private String address;
    private String imageUrl;
    private String description;
    private String reason; //llm기반 추천 이유 필드
    private String areaCode;
    private String contentTypeId;
    private String mapy;
    private String mapx;
    private String festivalPeriod; // 축제 기간

    public TripResponseDto() {
    }

    // 전체 필드 생성자
    public TripResponseDto(Long id, String title, String address, String imageUrl, String description,
                           String areaCode, String contentTypeId, String mapy, String mapx, String festivalPeriod) {
        this.id = id;
        this.title = title;
        this.address = address;
        this.imageUrl = imageUrl;
        this.description = description;
        this.areaCode = areaCode;
        this.contentTypeId = contentTypeId;
        this.mapy = mapy;
        this.mapx = mapx;
        this.festivalPeriod = festivalPeriod;
    }

    // 기존 생성자 호환성을 위해 남겨둠 (id가 없는 경우)
    public TripResponseDto(String title, String address, String imageUrl, String description,
                           String areaCode, String contentTypeId, String mapy, String mapx) {
        this(null, title, address, imageUrl, description, areaCode, contentTypeId, mapy, mapx, null);
    }

    // Destination 엔티티를 TripResponse DTO로 변환하는 생성자
    public TripResponseDto(kr.ac.hs.RandomTrip.trip.domain.Destination destination) {
        this.id = destination.getId();
        this.title = destination.getTitle();
        this.address = destination.getAddress();
        this.imageUrl = destination.getImageUrl();
        this.description = destination.getDescription();
        this.areaCode = destination.getAreaCode();
        this.contentTypeId = destination.getContentTypeId();
        this.mapy = destination.getMapy();
        this.mapx = destination.getMapx();
        this.festivalPeriod = destination.getFestivalPeriod();
    }
}
