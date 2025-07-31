package kr.ac.hs.RandomTrip.trip.dto.itinerary;

import com.fasterxml.jackson.annotation.JsonFormat;
import kr.ac.hs.RandomTrip.trip.domain.Itinerary;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class ItineraryDetailResponseDto {
    private final Long id;
    private final String name;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime createdAt;
    private final int itemCount;
    private final List<ItineraryItemResponseDto> items;

    private ItineraryDetailResponseDto(Itinerary itinerary) {
        this.id = itinerary.getId();
        this.name = itinerary.getName();
        this.createdAt = itinerary.getCreatedAt();
        this.itemCount = itinerary.getItems().size();
        this.items = itinerary.getItems().stream()
                .map(ItineraryItemResponseDto::new)
                .collect(Collectors.toList());
    }

    public static ItineraryDetailResponseDto from(Itinerary itinerary) {
        return new ItineraryDetailResponseDto(itinerary);
    }
}
