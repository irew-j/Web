package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import kr.ac.hs.RandomTrip.trip.domain.Itinerary;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class ItineraryDetailResponseDto {
    private final Long id;
    private final String name;
    private final List<ItineraryItemResponseDto> items;

    public ItineraryDetailResponseDto(Itinerary itinerary) {
        this.id = itinerary.getId();
        this.name = itinerary.getName();
        this.items = itinerary.getItems().stream()
                .map(ItineraryItemResponseDto::new)
                .collect(Collectors.toList());
    }
}
