package kr.ac.hs.RandomTrip.trip.dto;

public class TripRecommendRequestDto {
    private String query; // 예: '조용하고 힐링할 수 있는 바닷가 여행'

    public TripRecommendRequestDto() {}

    public TripRecommendRequestDto(String query) {
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
} 