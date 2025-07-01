package kr.ac.hs.RandomTrip.trip.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import kr.ac.hs.RandomTrip.trip.dto.TripResponse;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Destination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String address;
    private String imageUrl;
    private String description;
    private String areaCode;
    private String contentTypeId;

    public Destination(String title, String address, String imageUrl, String description, String areaCode, String contentTypeId) {
        this.title = title;
        this.address = address;
        this.imageUrl = imageUrl;
        this.description = description;
        this.areaCode = areaCode;
        this.contentTypeId = contentTypeId;
    }

    public TripResponse toTripResponse() {
        return new TripResponse(title, address, imageUrl, description, areaCode, contentTypeId, "", "");
    }
}
