package kr.ac.hs.RandomTrip.trip.dto;

import lombok.Getter;

@Getter
public class VerifyRequest {
    private Long destinationId;
    private double lat;
    private double lon;
}
