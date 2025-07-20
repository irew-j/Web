package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripResponse {
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

    public TripResponse() {
    }

    // 전체 필드 생성자
    public TripResponse(Long id, String title, String address, String imageUrl, String description,
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
    public TripResponse(String title, String address, String imageUrl, String description,
                        String areaCode, String contentTypeId, String mapy, String mapx) {
        this(null, title, address, imageUrl, description, areaCode, contentTypeId, mapy, mapx, null);
    }
}
