package kr.ac.hs.RandomTrip.trip.service;

import kr.ac.hs.RandomTrip.trip.dto.TripResponseDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class TripOptimizationService {
    public List<TripResponseDto> optimizeRoute(List<TripResponseDto> points) {
        if (points.size() <= 2) return points;

        List<TripResponseDto> route = new ArrayList<>();
        List<TripResponseDto> unvisited = new ArrayList<>(points);

        TripResponseDto current = unvisited.remove(0);
        route.add(current);

        while (!unvisited.isEmpty()) {
            TripResponseDto finalCurrent = current;
            TripResponseDto next = unvisited.stream()
                    .min(Comparator.comparingDouble(p -> distance(finalCurrent, p)))
                    .orElse(unvisited.get(0));

            route.add(next);
            unvisited.remove(next);
            current = next;
        }

        return route;
    }

    private double distance(TripResponseDto a, TripResponseDto b) {
        try {
            double lat1 = Double.parseDouble(a.getMapy());
            double lon1 = Double.parseDouble(a.getMapx());
            double lat2 = Double.parseDouble(b.getMapy());
            double lon2 = Double.parseDouble(b.getMapx());
            double dLat = Math.toRadians(lat2 - lat1);
            double dLon = Math.toRadians(lon2 - lon1);
            double r = 6371;
            double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return 2 * r * Math.asin(Math.sqrt(h));
        } catch (Exception e) {
            return Double.MAX_VALUE;
        }
    }
}
