package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Collections;
import java.util.List;

@Getter
@Setter
public class TripResponse {
    private String title;
    private String address;
    private String imageUrl;
    private String description;
    private String reason; //llm기반 추천 이유 필드
    private String areaCode;
    private String contentTypeId;
    private List<String> keywords;
    private String mapy;
    private String mapx;

    public TripResponse() {}

    public TripResponse(String title, String address, String imageUrl, String description,
                        String areaCode, String contentTypeId, String mapy, String mapx) {
        this.title = title;
        this.address = address;
        this.imageUrl = imageUrl;
        this.description = description;
        this.areaCode = areaCode;
        this.contentTypeId = contentTypeId;
        this.mapy = mapy;
        this.mapx = mapx;
    }

    //reason 포함한 생성자
    public TripResponse(String title, String address, String imageUrl, String description, String reason,
                        String areaCode, String contentTypeId, String mapy, String mapx) {
        this.title = title;
        this.address = address;
        this.imageUrl = imageUrl;
        this.description = description;
        this.reason = reason;
        this.areaCode = areaCode;
        this.contentTypeId = contentTypeId;
        this.mapy = mapy;
        this.mapx = mapx;
    }

    private String mapContentTypeName(String contentTypeId) {
        if (contentTypeId == null || contentTypeId.isEmpty()) {
            return "";
        }

        switch (contentTypeId) {
            case "12": return "관광지";
            case "14": return "문화시설";
            case "15": return "축제/행사";
            case "25": return "여행코스";
            case "28": return "레포츠";
            case "32": return "숙박";
            case "38": return "쇼핑";
            case "39": return "음식점";
            default: return "";
        }
    }
}