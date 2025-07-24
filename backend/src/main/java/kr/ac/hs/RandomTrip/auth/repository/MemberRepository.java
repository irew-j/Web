package kr.ac.hs.RandomTrip.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.ac.hs.RandomTrip.auth.domain.Member;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member,Long> {
    Optional<Member> findByUsername(String username);
}
