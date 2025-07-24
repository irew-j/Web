package kr.ac.hs.RandomTrip.trip.service;

import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.trip.domain.Itinerary;
import kr.ac.hs.RandomTrip.trip.domain.ItineraryItem;
import kr.ac.hs.RandomTrip.trip.dto.itinerary.*;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import kr.ac.hs.RandomTrip.trip.repository.ItineraryItemRepository;
import kr.ac.hs.RandomTrip.trip.repository.ItineraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final MemberRepository memberRepository;
    private final DestinationRepository destinationRepository;

    public ItineraryResponseDto createItinerary(String username, ItineraryRequestDto requestDto) {
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        Itinerary itinerary = Itinerary.builder()
                .name(requestDto.getName())
                .member(member)
                .build();
        Itinerary savedItinerary = itineraryRepository.save(itinerary);
        return new ItineraryResponseDto(savedItinerary);
    }

    @Transactional(readOnly = true)
    public List<ItineraryResponseDto> getAllItineraries(String username) {
        return itineraryRepository.findByMember_Username(username).stream()
                .map(ItineraryResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItineraryDetailResponseDto getItineraryDetails(String username, Long itineraryId) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        return new ItineraryDetailResponseDto(itinerary);
    }

    public ItineraryItemResponseDto addItemToItinerary(String username, Long itineraryId, ItineraryItemRequestDto requestDto) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        Destination destination = destinationRepository.findById(requestDto.getDestinationId())
                .orElseThrow(() -> new IllegalArgumentException("해당 장소를 찾을 수 없습니다."));

        int order = itinerary.getItems().size() + 1;
        ItineraryItem newItem = ItineraryItem.builder()
                .itinerary(itinerary)
                .destination(destination)
                .itemOrder(order)
                .build();

        itinerary.getItems().add(newItem);
        itineraryItemRepository.save(newItem);

        return new ItineraryItemResponseDto(newItem);
    }

    public void removeItemFromItinerary(String username, Long itemId) {
        ItineraryItem item = itineraryItemRepository.findByIdAndItinerary_Member_Username(itemId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 항목을 찾을 수 없습니다."));
        itineraryItemRepository.delete(item);
    }

    public void updateItemOrder(String username, Long itineraryId, ItineraryItemOrderRequestDto requestDto) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));

        List<Long> itemIds = requestDto.getItemIds();
        for (int i = 0; i < itemIds.size(); i++) {
            Long itemId = itemIds.get(i);
            int newOrder = i + 1;

            ItineraryItem item = itinerary.getItems().stream()
                    .filter(it -> it.getId().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("일정에서 해당 항목을 찾을 수 없습니다: " + itemId));

            item.setItemOrder(newOrder);
        }
    }
}
