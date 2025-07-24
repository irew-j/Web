package kr.ac.hs.RandomTrip.trip.domain;

import jakarta.persistence.*;
import kr.ac.hs.RandomTrip.auth.domain.Member;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Visit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "destination_id")
    private Destination destination;

    private LocalDateTime visitedAt;

    public Visit(Member member, Destination destination) {
        this.member = member;
        this.destination = destination;
        this.visitedAt = LocalDateTime.now();
    }
}
