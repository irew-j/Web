package kr.ac.hs.RandomTrip.footprint.repository;

import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.footprint.domain.Footprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FootprintRepository extends JpaRepository<Footprint, Long> {
    List<Footprint> findAllByMemberOrderByCreatedAtDesc(Member member);
}
