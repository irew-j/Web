package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import kr.ac.hs.RandomTrip.trip.domain.Itinerary;
import lombok.Getter;

@Getter
public class ItineraryResponseDto {
    private final Long id;
    private final String name;

    public ItineraryResponseDto(Itinerary itinerary) {
        this.id = itinerary.getId();
        this.name = itinerary.getName();
    }
}
