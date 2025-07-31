package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import com.fasterxml.jackson.annotation.JsonFormat;
import kr.ac.hs.RandomTrip.trip.domain.Itinerary;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ItineraryResponseDto {
    private final Long id;
    private final String name;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime createdAt;
    private final int itemCount;

    private ItineraryResponseDto(Itinerary itinerary) {
        this.id = itinerary.getId();
        this.name = itinerary.getName();
        this.createdAt = itinerary.getCreatedAt();
        this.itemCount = itinerary.getItems().size();
    }

    public static ItineraryResponseDto from(Itinerary itinerary) {
        return new ItineraryResponseDto(itinerary);
    }
}
