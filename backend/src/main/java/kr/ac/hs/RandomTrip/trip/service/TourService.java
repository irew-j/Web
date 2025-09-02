package kr.ac.hs.RandomTrip.trip.service;

import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.domain.Visit;
import kr.ac.hs.RandomTrip.guidechat.dto.GuideResponse;
import kr.ac.hs.RandomTrip.guidechat.llm.GeminiGuideGenerator;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import kr.ac.hs.RandomTrip.itinerary.domain.ItineraryItem;
import kr.ac.hs.RandomTrip.itinerary.repository.ItineraryItemRepository;
import kr.ac.hs.RandomTrip.trip.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TourService {

    private final DestinationRepository destinationRepository;
    private final VisitRepository visitRepository;
    private final MemberRepository memberRepository;
    private final GeminiGuideGenerator guideGenerator;
    private final ItineraryItemRepository itineraryItemRepository;

    private static final double MAX_DISTANCE_METERS = 500.0; // 500미터

    @Transactional(readOnly = true)
    public Optional<GuideResponse> getGuideForCurrentLocation(double lat, double lon) {
        List<Destination> destinations = destinationRepository.findAll();
        Destination closestDestination = findClosestDestination(lat, lon, destinations);

        if (closestDestination == null) {
            return Optional.empty();
        }

        if (closestDestination.getGuide() == null || closestDestination.getGuide().isBlank()) {
            GeminiGuideGenerator.GuideResponse guideResponse = guideGenerator.generateOneTimeGuide(closestDestination.getTitle());
            String guideText = guideResponse.getReply(); // 응답 객체에서 실제 텍스트를 추출
            closestDestination.setGuide(guideText);
            destinationRepository.save(closestDestination);
        }

        return Optional.of(new GuideResponse(closestDestination.getTitle(), closestDestination.getGuide()));
    }

    @Transactional
    public boolean verifyVisit(Long destinationId, double lat, double lon) {
        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            return false;
        }

        Destination destination = destinationOpt.get();
        double distance = calculateDistance(lat, lon, Double.parseDouble(destination.getMapy()), Double.parseDouble(destination.getMapx()));

        if (distance <= MAX_DISTANCE_METERS) {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Member member = memberRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 기존 Visit 기록 저장
            Visit visit = new Visit(member, destination);
            visitRepository.save(visit);

            // 일정 항목(ItineraryItem)의 방문 상태 업데이트
            List<ItineraryItem> itemsToUpdate = itineraryItemRepository.findByDestination_IdAndItinerary_Member_Username(destinationId, username);
            for (ItineraryItem item : itemsToUpdate) {
                item.setVisited(true);
            }

            return true;
        } else {
            return false;
        }
    }

    private Destination findClosestDestination(double lat, double lon, List<Destination> destinations) {
        Destination closest = null;
        double minDistance = Double.MAX_VALUE;

        for (Destination destination : destinations) {
            try {
                double destLat = Double.parseDouble(destination.getMapy());
                double destLon = Double.parseDouble(destination.getMapx());
                double distance = calculateDistance(lat, lon, destLat, destLon);
                if (distance < minDistance && distance <= MAX_DISTANCE_METERS) {
                    minDistance = distance;
                    closest = destination;
                }
            } catch (NumberFormatException e) {
                // mapx, mapy 파싱 실패 시 해당 목적지는 건너뜀
                continue;
            }
        }
        return closest;
    }

    // Haversine formula to calculate distance between two lat-lon points
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371e3; // metres
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }
}
