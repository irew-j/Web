package kr.ac.hs.RandomTrip.trip.dto.footprint;

import kr.ac.hs.RandomTrip.trip.domain.Footprint;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class FootprintResponseDto {

    private final Long id;
    private final String memo;
    private final String photoUrl;
    private final LocalDateTime createdAt;
    private final Long destinationId;
    private final String destinationTitle;
    private final String latitude; // from Destination.mapy
    private final String longitude; // from Destination.mapx

    public FootprintResponseDto(Footprint footprint) {
        this.id = footprint.getId();
        this.memo = footprint.getMemo();
        this.photoUrl = footprint.getPhotoUrl();
        this.createdAt = footprint.getCreatedAt();
        this.destinationId = footprint.getDestination().getId();
        this.destinationTitle = footprint.getDestination().getTitle();
        this.latitude = footprint.getDestination().getMapy();
        this.longitude = footprint.getDestination().getMapx();
    }

    public FootprintResponseDto(Footprint footprint, String fullPhotoUrl) {
        this.id = footprint.getId();
        this.memo = footprint.getMemo();
        this.photoUrl = fullPhotoUrl;
        this.createdAt = footprint.getCreatedAt();
        this.destinationId = footprint.getDestination().getId();
        this.destinationTitle = footprint.getDestination().getTitle();
        this.latitude = footprint.getDestination().getMapy();
        this.longitude = footprint.getDestination().getMapx();
    }
}
