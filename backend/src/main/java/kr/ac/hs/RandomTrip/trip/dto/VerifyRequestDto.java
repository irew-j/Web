package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;

@Getter
public class VerifyRequestDto {
    private Long destinationId;
    private double lat;
    private double lon;
}
