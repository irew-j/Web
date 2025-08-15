package kr.ac.hs.RandomTrip.trip.dto.footprint;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FootprintRequestDto {
    private Long destinationId;
    private String memo;
    private String photoUrl;
}
