package kr.ac.hs.RandomTrip.trip.repository;

import kr.ac.hs.RandomTrip.trip.domain.Visit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitRepository extends JpaRepository<Visit, Long> {
}
