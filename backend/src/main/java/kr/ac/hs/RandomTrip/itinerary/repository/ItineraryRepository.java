package kr.ac.hs.RandomTrip.itinerary.repository;

import kr.ac.hs.RandomTrip.itinerary.domain.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    List<Itinerary> findByMember_Username(String username);
    Optional<Itinerary> findByIdAndMember_Username(Long id, String username);
}
