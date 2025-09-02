package kr.ac.hs.RandomTrip.itinerary.domain;

import jakarta.persistence.*;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class ItineraryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id")
    private Itinerary itinerary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    private int itemOrder;

    private boolean visited = false;

    @Builder
    public ItineraryItem(Itinerary itinerary, Destination destination, int itemOrder) {
        this.itinerary = itinerary;
        this.destination = destination;
        this.itemOrder = itemOrder;
    }
}
