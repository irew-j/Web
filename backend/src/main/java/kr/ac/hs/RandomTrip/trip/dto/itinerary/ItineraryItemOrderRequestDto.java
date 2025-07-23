package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ItineraryItemOrderRequestDto {
    private List<Long> itemIds;
}
