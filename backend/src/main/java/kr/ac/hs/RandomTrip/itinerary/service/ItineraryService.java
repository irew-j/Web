package kr.ac.hs.RandomTrip.itinerary.service;

import kr.ac.hs.RandomTrip.auth.domain.Member;
import kr.ac.hs.RandomTrip.auth.repository.MemberRepository;
import kr.ac.hs.RandomTrip.itinerary.dto.*;
import kr.ac.hs.RandomTrip.trip.domain.Destination;
import kr.ac.hs.RandomTrip.itinerary.domain.Itinerary;
import kr.ac.hs.RandomTrip.itinerary.domain.ItineraryItem;
import kr.ac.hs.RandomTrip.trip.repository.DestinationRepository;
import kr.ac.hs.RandomTrip.itinerary.repository.ItineraryItemRepository;
import kr.ac.hs.RandomTrip.itinerary.repository.ItineraryRepository;
import kr.ac.hs.RandomTrip.trip.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final MemberRepository memberRepository;
    private final DestinationRepository destinationRepository;
    private final TripService tripService; // TripService 주입

    public ItineraryResponseDto createItinerary(String username, ItineraryRequestDto requestDto) {
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        Itinerary itinerary = Itinerary.builder()
                .name(requestDto.getName())
                .member(member)
                .build();
        Itinerary savedItinerary = itineraryRepository.save(itinerary);
        return ItineraryResponseDto.from(savedItinerary);
    }

    @Transactional(readOnly = true)
    public List<ItineraryResponseDto> getAllItineraries(String username) {
        return itineraryRepository.findByMember_Username(username).stream()
                .map(ItineraryResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItineraryDetailResponseDto getItineraryDetails(String username, Long itineraryId) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        return ItineraryDetailResponseDto.from(itinerary);
    }

    public ItineraryItemResponseDto addItemToItinerary(String username, Long itineraryId, ItineraryItemRequestDto requestDto) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        Destination destination = destinationRepository.findById(requestDto.getDestinationId())
                .orElseThrow(() -> new IllegalArgumentException("해당 장소를 찾을 수 없습니다."));

        if (itineraryItemRepository.existsByItineraryAndDestination(itinerary, destination)) {
            throw new IllegalArgumentException("이미 일정에 추가된 장소입니다.");
        }

        int order = itineraryItemRepository.findTopByItineraryIdOrderByItemOrderDesc(itineraryId)
                .map(item -> item.getItemOrder() + 1)
                .orElse(1);

        ItineraryItem newItem = ItineraryItem.builder()
                .itinerary(itinerary)
                .destination(destination)
                .itemOrder(order)
                .build();

        itinerary.getItems().add(newItem);
        itineraryItemRepository.save(newItem);

        return new ItineraryItemResponseDto(newItem);
    }

    // TripService의 하이브리드 검색 메소드를 사용하도록 수정한 메소드
    public ItineraryItemResponseDto addItemByPlaceName(String username, Long itineraryId, String placeName) {
        Destination destination = tripService.findTopDestinationByHybridSearch(placeName)
                .orElseThrow(() -> new IllegalArgumentException("'" + placeName + "'에 대한 장소를 찾을 수 없습니다."));

        ItineraryItemRequestDto requestDto = new ItineraryItemRequestDto();
        requestDto.setDestinationId(destination.getId());
        
        return addItemToItinerary(username, itineraryId, requestDto);
    }

    public void removeItemFromItinerary(String username, Long itemId) {
        ItineraryItem item = itineraryItemRepository.findByIdAndItinerary_Member_Username(itemId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 항목을 찾을 수 없습니다."));
        itineraryItemRepository.delete(item);
    }

    public void deleteItinerary(String username, Long itineraryId) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        itineraryRepository.delete(itinerary);
    }

    public ItineraryResponseDto updateItinerary(String username, Long itineraryId, ItineraryRequestDto requestDto) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));
        itinerary.setName(requestDto.getName());
        Itinerary savedItinerary = itineraryRepository.save(itinerary);
        return ItineraryResponseDto.from(savedItinerary);
    }

    public void updateItemOrder(String username, Long itineraryId, ItineraryItemOrderRequestDto requestDto) {
        Itinerary itinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));

        List<Long> itemIds = requestDto.getItemIds();
        Map<Long, Integer> itemOrderMap = IntStream.range(0, itemIds.size())
                .boxed()
                .collect(Collectors.toMap(itemIds::get, i -> i + 1));

        itinerary.getItems().forEach(item -> {
            Integer newOrder = itemOrderMap.get(item.getId());
            if (newOrder != null) {
                item.setItemOrder(newOrder);
            }
        });
    }

    public ItineraryResponseDto cloneItinerary(String username, Long itineraryId) {
        Itinerary originalItinerary = itineraryRepository.findByIdAndMember_Username(itineraryId, username)
                .orElseThrow(() -> new IllegalArgumentException("해당 일정을 찾을 수 없습니다."));

        Itinerary clonedItinerary = Itinerary.builder()
                .name("복사본 - " + originalItinerary.getName())
                .member(originalItinerary.getMember())
                .build();

        List<ItineraryItem> clonedItems = originalItinerary.getItems().stream()
                .map(item -> ItineraryItem.builder()
                        .itinerary(clonedItinerary)
                        .destination(item.getDestination())
                        .itemOrder(item.getItemOrder())
                        .build())
                .collect(Collectors.toList());

        clonedItinerary.setItems(clonedItems);
        Itinerary savedItinerary = itineraryRepository.save(clonedItinerary);
        return ItineraryResponseDto.from(savedItinerary);
    }
}
