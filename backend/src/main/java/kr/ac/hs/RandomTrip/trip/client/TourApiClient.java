package kr.ac.hs.RandomTrip.trip.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class TourApiClient {

    @Value("${tourapi.key}")
    private String tourApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonNode fetchAreaBasedList(int pageNo, int numOfRows) throws Exception {
        return fetchAreaBasedList(pageNo, numOfRows, null, null, null, null);
    }

    public JsonNode fetchAreaBasedList(int pageNo, int numOfRows, String contentTypeId, String cat1, String cat2, String cat3) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService2/areaBasedList2");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=").append(pageNo);
        urlBuilder.append("&MobileOS=ETC&MobileApp=RandomTrip&_type=json&arrange=R");

        if (contentTypeId != null && !contentTypeId.isEmpty()) {
            urlBuilder.append("&contentTypeId=").append(contentTypeId);
        }
        if (cat1 != null && !cat1.isEmpty()) {
            urlBuilder.append("&cat1=").append(cat1);
        }
        if (cat2 != null && !cat2.isEmpty()) {
            urlBuilder.append("&cat2=").append(cat2);
        }
        if (cat3 != null && !cat3.isEmpty()) {
            urlBuilder.append("&cat3=").append(cat3);
        }

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    public JsonNode searchByKeyword(String keyword, String areaCode, int numOfRows, String[] contentTypeIds) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService2/searchKeyword2");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=1&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&keyword=").append(URLEncoder.encode(keyword, StandardCharsets.UTF_8.toString()));
        if (areaCode != null) urlBuilder.append("&areaCode=").append(areaCode);
        if (contentTypeIds != null && contentTypeIds.length > 0) {
            urlBuilder.append("&contentTypeId=").append(contentTypeIds[0]);
        }
        urlBuilder.append("&arrange=R");

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    public JsonNode fetchTourDetail(String contentId, String contentTypeId) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService2/detailCommon2");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&contentId=").append(contentId);

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    private JsonNode executeGetRequest(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-type", "application/json");

        // 타임아웃 단축
        conn.setConnectTimeout(2000); // 5초 -> 2초
        conn.setReadTimeout(3000);    // 기본값 -> 3초

        BufferedReader rd = new BufferedReader(new InputStreamReader(
                conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300 ?
                        conn.getInputStream() : conn.getErrorStream(), "UTF-8"));

        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) sb.append(line);
        rd.close();
        conn.disconnect();

        return objectMapper.readTree(sb.toString());
    }

    public JsonNode fetchLocationBasedList(double mapX, double mapY, int radius, int numOfRows, String contentTypeId) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService2/locationBasedList2");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=1");
        urlBuilder.append("&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&mapX=").append(mapX);
        urlBuilder.append("&mapY=").append(mapY);
        urlBuilder.append("&radius=").append(radius);
        if (contentTypeId != null) {
            urlBuilder.append("&contentTypeId=").append(contentTypeId);
        }
        urlBuilder.append("&arrange=R");

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    // 축제, 행사 정보를 검색하는 메서드 (contentTypeId: 15)
    public JsonNode searchFestivals(String areaCode, int numOfRows) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService2/searchFestival2");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=1&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&arrange=R");

        if (areaCode != null && !areaCode.isEmpty()) {
            urlBuilder.append("&areaCode=").append(areaCode);
        }

        // 현재 날짜 이후의 축제만 검색하기 위한 날짜 설정
        java.time.LocalDate today = java.time.LocalDate.now();
        String eventStartDate = today.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        urlBuilder.append("&eventStartDate=").append(eventStartDate);

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }
}