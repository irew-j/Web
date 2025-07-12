package kr.ac.hs.RandomTrip.trip.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Destination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String address;
    
    @Column(length = 2048)
    private String imageUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String areaCode;
    private String contentTypeId;

    @Column(columnDefinition = "TEXT")
    private String guide;

    private String mapx;
    private String mapy;

    @Column(unique = true) // TourAPI contentId, 중복 저장 방지
    private String contentId;

    // 전체 필드 생성자
    public Destination(String title, String address, String imageUrl, String description, String areaCode, String contentTypeId, String mapy, String mapx, String contentId) {
        this.title = title;
        this.address = address;
        this.imageUrl = imageUrl;
        this.description = description;
        this.areaCode = areaCode;
        this.contentTypeId = contentTypeId;
        this.mapy = mapy;
        this.mapx = mapx;
        this.contentId = contentId;
    }
}
