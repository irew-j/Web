package kr.ac.hs.RandomTrip.trip.domain;

import jakarta.persistence.*;
import kr.ac.hs.RandomTrip.auth.domain.Member;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Footprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "footprint_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id", nullable = false)
    private Destination destination;

    @Column(length = 500)
    private String memo;

    @Column(length = 2048)
    private String photoUrl;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Footprint(Member member, Destination destination, String memo, String photoUrl) {
        this.member = member;
        this.destination = destination;
        this.memo = memo;
        this.photoUrl = photoUrl;
    }

    public void update(String memo, String photoUrl) {
        this.memo = memo;
        this.photoUrl = photoUrl;
    }
}
