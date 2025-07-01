package kr.ac.hs.RandomTrip.trip.service;

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
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService1/areaBasedList1");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=").append(pageNo);
        urlBuilder.append("&MobileOS=ETC&MobileApp=RandomTrip&_type=json&listYN=Y&arrange=R");

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    public JsonNode searchByKeyword(String keyword, String areaCode, int numOfRows, String[] contentTypeIds) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService1/searchKeyword1");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&numOfRows=").append(numOfRows);
        urlBuilder.append("&pageNo=1&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&keyword=").append(URLEncoder.encode(keyword, StandardCharsets.UTF_8.toString()));
        if (areaCode != null) urlBuilder.append("&areaCode=").append(areaCode);
        if (contentTypeIds != null && contentTypeIds.length > 0) {
            urlBuilder.append("&contentTypeId=").append(contentTypeIds[0]);
        }
        urlBuilder.append("&arrange=random");

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }

    public JsonNode fetchTourDetail(String contentId, String contentTypeId) throws Exception {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService1/detailCommon1");
        urlBuilder.append("?serviceKey=").append(URLEncoder.encode(tourApiKey, StandardCharsets.UTF_8.toString()));
        urlBuilder.append("&MobileOS=ETC&MobileApp=RandomTrip&_type=json");
        urlBuilder.append("&contentId=").append(contentId);
        urlBuilder.append("&contentTypeId=").append(contentTypeId);
        urlBuilder.append("&defaultYN=Y&firstImageYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y");

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
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B551011/KorService1/locationBasedList1");
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
        urlBuilder.append("&listYN=Y&arrange=R");

        return executeGetRequest(urlBuilder.toString()).path("response").path("body").path("items").path("item");
    }
}