package kr.ac.hs.RandomTrip.trip.util;

import java.util.HashMap;
import java.util.Map;

public class RegionUtil {
    // ... (getRegionNameFromQuery, optimizeRoute, distance 등 나머지 메서드는 거의 동일)
    public static String getRegionNameFromQuery(String query) {
        Map<String, String> regionMap = new HashMap<>();
        // 광역시/도
        regionMap.put("서울", "서울"); // 서울특별시 대신 서울로 수정
        regionMap.put("부산", "부산"); // 부산광역시 대신 부산으로 수정
        regionMap.put("대구", "대구"); // 대구광역시 대신 대구로 수정
        regionMap.put("인천", "인천"); // 인천광역시 대신 인천으로 수정
        regionMap.put("광주", "광주"); // 광주광역시 대신 광주로 수정
        regionMap.put("대전", "대전"); // 대전광역시 대신 대전으로 수정
        regionMap.put("울산", "울산"); // 울산광역시 대신 울산으로 수정
        regionMap.put("세종", "세종"); // 세종특별자치시 대신 세종으로 수정

        // 도
        regionMap.put("경기", "경기"); // 경기도 대신 경기
        regionMap.put("강원", "강원"); // 강원특별자치도 대신 강원
        regionMap.put("충북", "충북"); // 충청북도 대신 충북
        regionMap.put("충남", "충남"); // 충청남도 대신 충남
        regionMap.put("전북", "전북"); // 전북특별자치도 대신 전북
        regionMap.put("전남", "전남");
        regionMap.put("경북", "경북");
        regionMap.put("경남", "경남"); // 경상남도 대신 경남
        regionMap.put("제주", "제주"); // 제주특별자치도 대신 제주

        // 경기도 주요 시
        regionMap.put("수원", "경기 수원시");
        regionMap.put("성남", "경기 성남시");
        regionMap.put("고양", "경기 고양시");
        regionMap.put("용인", "경기 용인시");
        regionMap.put("부천", "경기 부천시");
        regionMap.put("안산", "경기 안산시");
        regionMap.put("안양", "경기 안양시");
        regionMap.put("평택", "경기 평택시");
        regionMap.put("화성", "경기 화성시");
        regionMap.put("시흥", "경기 시흥시");
        regionMap.put("의정부", "경기 의정부시");
        regionMap.put("남양주", "경기 남양주시");
        regionMap.put("하남", "경기 하남시");
        regionMap.put("군포", "경기 군포시");
        regionMap.put("이천", "경기 이천시");
        regionMap.put("파주", "경기 파주시");
        regionMap.put("구리", "경기 구리시");
        regionMap.put("광명", "경기 광명시");
        regionMap.put("김포", "경기 김포시");
        regionMap.put("오산", "경기 오산시");
        regionMap.put("안성", "경기 안성시");
        regionMap.put("양주", "경기 양주시");
        regionMap.put("포천", "경기 포천시");
        regionMap.put("여주", "경기 여주시");

        // 강원특별자치도 주요 시
        regionMap.put("춘천", "강원 춘천시");
        regionMap.put("원주", "강원 원주시");
        regionMap.put("강릉", "강원 강릉시");
        regionMap.put("동해", "강원 동해시");
        regionMap.put("태백", "강원 태백시");
        regionMap.put("속초", "강원 속초시");
        regionMap.put("삼척", "강원 삼척시");

        // 충청북도 주요 시
        regionMap.put("청주", "충북 청주시");
        regionMap.put("충주", "충북 충주시");
        regionMap.put("제천", "충북 제천시");

        // 충청남도 주요 시
        regionMap.put("천안", "충남 천안시");
        regionMap.put("아산", "충남 아산시");
        regionMap.put("공주", "충남 공주시");
        regionMap.put("서산", "충남 서산시");
        regionMap.put("논산", "충남 논산시");
        regionMap.put("계룡", "충남 계룡시");

        // 전북특별자치도 주요 시
        regionMap.put("전주", "전북 전주시");
        regionMap.put("군산", "전북 군산시");
        regionMap.put("익산", "전북 익산시");
        regionMap.put("정읍", "전북 정읍시");
        regionMap.put("남원", "전북 남원시");

        // 전라남도 주요 시
        regionMap.put("목포", "전남 목포시");
        regionMap.put("여수", "전남 여수시");
        regionMap.put("순천", "전남 순천시");
        regionMap.put("나주", "전남 나주시");

        // 경상북도 주요 시
        regionMap.put("포항", "경북 포항시");
        regionMap.put("경주", "경북 경주시");
        regionMap.put("구미", "경북 구미시");
        regionMap.put("안동", "경북 안동시");
        regionMap.put("영주", "경북 영주시");

        // 경상남도 주요 시
        regionMap.put("창원", "경남 창원시");
        regionMap.put("진주", "경남 진주시");
        regionMap.put("김해", "경남 김해시");
        regionMap.put("통영", "경남 통영시");
        regionMap.put("사천", "경남 사천시");

        // 제주특별자치도
        regionMap.put("제주", "제주 제주시"); // 제주특별자치도는 제주시와 서귀포시로 나뉘며, '제주'는 제주시를 의미하는 경우가 많아 추가합니다.
        regionMap.put("서귀포", "제주 서귀포시");

        // 한신대 근처 지역으로 매핑
        regionMap.put("한신대", "경기도 오산");


        for (Map.Entry<String, String> entry : regionMap.entrySet()) {
            if (query.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }
}
