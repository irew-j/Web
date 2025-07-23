package kr.ac.hs.RandomTrip.trip.repository;

import kr.ac.hs.RandomTrip.trip.domain.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {
    Optional<ItineraryItem> findByIdAndItinerary_Member_Username(Long id, String username);
    List<ItineraryItem> findByDestination_IdAndItinerary_Member_Username(Long destinationId, String username);
}
