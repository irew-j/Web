package kr.ac.hs.RandomTrip.trip.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.ac.hs.RandomTrip.trip.domain.Destination;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    
}
