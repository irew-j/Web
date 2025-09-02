package kr.ac.hs.RandomTrip.footprint.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FootprintRequestDto {
    private Long destinationId;
    private String memo;
    private String photoUrl;
}
