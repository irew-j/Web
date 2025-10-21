package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LocationBasedTripRequestDto {
    private double latitude;  // 위도
    private double longitude; // 경도
    private int radius;       // 거리 (미터 단위)
}
