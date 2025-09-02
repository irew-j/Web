package kr.ac.hs.RandomTrip.itinerary.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ItineraryItemOrderRequestDto {
    private List<Long> itemIds;
}
