package kr.ac.hs.RandomTrip.trip.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.hs.RandomTrip.trip.dto.TripRecommendRequestDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;


@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @DisplayName("도보 여행 코스 추천 API 20회 반복 테스트")
    @RepeatedTest(20)
    void recommendTripWalk_Repeated() throws Exception {
        // given: API에 보낼 요청 데이터를 준비합니다.
        TripRecommendRequestDto requestDto = new TripRecommendRequestDto("인천에서 산책하기 좋은 곳");
        String requestBody = objectMapper.writeValueAsString(requestDto);

        // when & then: API를 호출하고 결과를 검증합니다.
        mockMvc.perform(post("/api/trip/recommend-walk") // 1. POST 요청을 /api/trip/recommend-walk 경로로 보냅니다.
                        .contentType(MediaType.APPLICATION_JSON)      // 2. 요청 본문의 타입은 JSON입니다.
                        .content(requestBody))                        // 3. 위에서 만든 JSON 데이터를 요청 본문에 담습니다.
                .andExpect(status().isOk())                           // 4. 응답 상태 코드가 200 (OK)인지 확인합니다.
                .andExpect(content().contentType(MediaType.APPLICATION_JSON)) // 5. 응답 본문의 타입도 JSON인지 확인합니다.
                .andDo(print());                                      // 6. 요청과 응답의 전체 내용을 콘솔에 출력합니다.
    }

    @DisplayName("차량 여행 코스 추천 API 20회 반복 테스트")
    @RepeatedTest(20)
    void recommendTripCar_Repeated() throws Exception {
        // given
        TripRecommendRequestDto requestDto = new TripRecommendRequestDto("부산에서 바다 보기 좋은 드라이브 코스");
        String requestBody = objectMapper.writeValueAsString(requestDto);

        // when & then
        mockMvc.perform(post("/api/trip/recommend-car")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(print());
    }
}
