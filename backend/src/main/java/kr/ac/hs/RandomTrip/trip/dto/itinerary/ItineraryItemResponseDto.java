package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import kr.ac.hs.RandomTrip.trip.domain.ItineraryItem;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import lombok.Getter;

@Getter
public class ItineraryItemResponseDto {
    private final Long id;
    private final int itemOrder;
    private final boolean visited;
    private final TripResponse destination;

    public ItineraryItemResponseDto(ItineraryItem itineraryItem) {
        this.id = itineraryItem.getId();
        this.itemOrder = itineraryItem.getItemOrder();
        this.visited = itineraryItem.isVisited();
        this.destination = new TripResponse(itineraryItem.getDestination());
    }
}
