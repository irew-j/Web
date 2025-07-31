package kr.ac.hs.RandomTrip.trip.repository;

import kr.ac.hs.RandomTrip.trip.domain.Destination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    Optional<Destination> findByContentId(String contentId);
    List<Destination> findByTitle(String title);
    List<Destination> findByTitleContaining(String title);
}