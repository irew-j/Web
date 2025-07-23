package kr.ac.hs.RandomTrip.trip.domain;

import jakarta.persistence.*;
import kr.ac.hs.RandomTrip.auth.domain.Member;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Itinerary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("itemOrder ASC")
    private List<ItineraryItem> items = new ArrayList<>();

    @Builder
    public Itinerary(String name, Member member) {
        this.name = name;
        this.member = member;
    }
}
