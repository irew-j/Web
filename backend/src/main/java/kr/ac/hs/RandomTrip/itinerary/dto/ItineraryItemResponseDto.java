package kr.ac.hs.RandomTrip.itinerary.dto;

import kr.ac.hs.RandomTrip.itinerary.domain.ItineraryItem;
import kr.ac.hs.RandomTrip.trip.dto.TripResponseDto;
import lombok.Getter;

@Getter
public class ItineraryItemResponseDto {
    private final Long id;
    private final int itemOrder;
    private final boolean visited;
    private final TripResponseDto destination;

    public ItineraryItemResponseDto(ItineraryItem itineraryItem) {
        this.id = itineraryItem.getId();
        this.itemOrder = itineraryItem.getItemOrder();
        this.visited = itineraryItem.isVisited();
        this.destination = new TripResponseDto(itineraryItem.getDestination());
    }
}
