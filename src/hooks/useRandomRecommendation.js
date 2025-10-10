import { useState, useCallback } from 'react';
import { useEnhancedRandomTrip } from '../context/EnhancedRandomTripContext';
import { fetchRandomTrip, fetchItinerary } from '../api/trip';
import { useWeather } from './useWeather'; // useWeather 훅 추가

export const useRandomRecommendation = () => {
    const {
        selectedMode,
        userPreferences,
        setIsLoading,
        handleError,
        saveRecommendation,
        addPoints,
        updateStreak,
        RANDOM_MODES
    } = useEnhancedRandomTrip();

    const [recommendations, setRecommendations] = useState([]);

    // 완전 랜덤 추천
    const getCompleteRandom = useCallback(async () => {
        try {
            const data = await fetchRandomTrip();
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            throw new Error('완전 랜덤 추천을 가져오는데 실패했습니다.');
        }
    }, []);

    // 테마 기반 랜덤 추천
    const getThemeRandom = useCallback(async (theme) => {
        console.log('테마 추천 시작:', theme);

        try {
            const themeQueries = {
                cafe: '카페',
                nature: '자연',
                history: '박물관',
                activity: '체험',
                food: '맛집'
            };

            const query = themeQueries[theme] || '관광지';
            console.log('검색 쿼리:', query);

            // 먼저 기본 랜덤 추천을 가져와서 테마 라벨을 붙여서 반환
            const data = await fetchRandomTrip();
            console.log('기본 랜덤 데이터:', data);

            const result = Array.isArray(data) ? data : [data];

            // 테마 정보를 추가
            if (result[0]) {
                result[0] = {
                    ...result[0],
                    themeLabel: themeQueries[theme] || '관광지',
                    selectedTheme: theme
                };
            }

            console.log('테마 추천 결과:', result);
            return result;

        } catch (error) {
            console.error('테마 기반 추천 오류:', error);
            throw new Error(`테마 기반 추천을 가져오는데 실패했습니다: ${error.message}`);
        }
    }, []);

    // 거리 기반 랜덤 추천
    const getDistanceRandom = useCallback(async (maxDistance) => {
        try {
            // 현재는 기본 랜덤 추천 사용
            const data = await fetchRandomTrip();
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            throw new Error('거리 기반 추천을 가져오는데 실패했습니다.');
        }
    }, []);

    // 날씨 기반 랜덤 추천
    const getWeatherRandom = useCallback(async (weatherType) => {
        try {
            // 현재는 기본 랜덤 추천 사용
            const data = await fetchRandomTrip();
            const result = Array.isArray(data) ? data : [data];

            // 날씨 정보를 추가
            if (result[0]) {
                result[0] = {
                    ...result[0],
                    weatherLabel: weatherType === 'sunny' ? '맑음' : weatherType === 'cloudy' ? '흐림' : '비',
                    selectedWeather: weatherType
                };
            }

            return result;
        } catch (error) {
            throw new Error('날씨 기반 추천을 가져오는데 실패했습니다.');
        }
    }, []);

    // 메인 추천 실행 함수
    const executeRecommendation = useCallback(async (options = {}) => {
        console.log('추천 실행 시작:', { selectedMode, options });
        setIsLoading(true);

        try {
            let result = [];

            switch (selectedMode) {
                case RANDOM_MODES.COMPLETE:
                    console.log('완전 랜덤 모드 실행');
                    result = await getCompleteRandom();
                    break;
                case RANDOM_MODES.THEME:
                    console.log('테마 랜덤 모드 실행:', options.theme);
                    result = await getThemeRandom(options.theme || 'cafe');
                    break;
                case RANDOM_MODES.DISTANCE:
                    console.log('거리 기반 모드 실행');
                    result = await getDistanceRandom(options.maxDistance || userPreferences.preferredDistance);
                    break;
                case RANDOM_MODES.WEATHER: // WEATHER 모드 추가
                    console.log('날씨 기반 모드 실행:', options.weather);
                    result = await getWeatherRandom(options.weather || 'sunny');
                    break;
                default:
                    console.log('기본 모드 실행');
                    result = await getCompleteRandom();
            }

            console.log('추천 결과:', result);

            // 결과 처리
            if (result && result.length > 0 && result[0]) {
                setRecommendations(result);

                // 첫 번째 추천을 저장
                saveRecommendation(result[0]);

                // 포인트 및 스트릭 업데이트
                addPoints(10, 'random_recommendation');
                updateStreak();

                return result;
            } else {
                throw new Error('추천 결과가 없습니다.');
            }
        } catch (error) {
            console.error('추천 실행 오류:', error);
            handleError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [
        selectedMode,
        userPreferences,
        setIsLoading,
        handleError,
        saveRecommendation,
        addPoints,
        updateStreak,
        getCompleteRandom,
        getThemeRandom,
        getDistanceRandom,
        getWeatherRandom, // getWeatherRandom 추가
        RANDOM_MODES
    ]);

    return {
        recommendations,
        executeRecommendation,
        setRecommendations
    };
};