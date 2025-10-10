import { useState, useEffect } from 'react';
import axios from 'axios';

// 위경도 -> 기상청 격자 좌표 변환 함수
const convertToGrid = (lat, lon) => {
    const RE = 6371.00877; // 지구 반경 (km)
    const GRID = 5.0; // 격자 간격 (km)
    const SLAT1 = 30.0; // 표준 위도 1
    const SLAT2 = 60.0; // 표준 위도 2
    const OLON = 126.0; // 기준 경도
    const OLAT = 38.0; // 기준 위도
    const XO = 43; // 원점 X 좌표
    const YO = 136; // 원점 Y 좌표

    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    const rs = {};
    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    rs.nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs.ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return rs;
};

export function useWeather(location) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!location) return;

        const fetchWeather = async () => {
            setLoading(true);
            setError(null);

            const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
            if (!API_KEY) {
                setError("OpenWeather API 키가 설정되지 않았습니다."); // 메시지 수정 필요
                setLoading(false);
                return;
            }

            // 현재 시각을 기준으로 base_date와 base_time 계산
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const base_date = `${year}${month}${day}`;
            let base_time = '';

            // 기상청 API는 매 시각 30분 이후에 발표되므로, 현재 시각에 따라 base_time 조정
            if (parseInt(minutes) >= 30) {
                base_time = `${hours}30`;
            } else {
                // 30분 이전이면 이전 시간의 30분으로 설정 (예: 10:20 -> 09:30)
                const prevHour = parseInt(hours) - 1;
                if (prevHour < 0) { // 자정 이전이면 전날 23시 30분
                    const prevDay = new Date(now);
                    prevDay.setDate(now.getDate() - 1);
                    base_date = `${prevDay.getFullYear()}${String(prevDay.getMonth() + 1).padStart(2, '0')}${String(prevDay.getDate()).padStart(2, '0')}`;
                    base_time = '2330';
                } else {
                    base_time = `${String(prevHour).padStart(2, '0')}30`;
                }
            }

            const { nx, ny } = convertToGrid(location.lat, location.lon);

            try {
                const response = await axios.get(
                    `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`,
                    {
                        params: {
                            serviceKey: decodeURIComponent(API_KEY), // URL 디코딩
                            pageNo: 1,
                            numOfRows: 1000,
                            dataType: 'JSON',
                            base_date: base_date,
                            base_time: base_time,
                            nx: nx,
                            ny: ny,
                        },
                    }
                );

                const items = response.data.response.body.items.item;
                if (items && items.length > 0) {
                    const weatherData = {};
                    items.forEach(item => {
                        weatherData[item.category] = item.obsrValue;
                    });

                    // 기상청 API 응답에서 날씨 정보 추출 (예시)
                    // T1H: 기온, RN1: 1시간 강수량, SKY: 하늘 상태, PTY: 강수 형태
                    let description = '';
                    let icon = '';

                    const sky = weatherData.SKY; // 하늘 상태 (1: 맑음, 3: 구름 많음, 4: 흐림)
                    const pty = weatherData.PTY; // 강수 형태 (0: 없음, 1: 비, 2: 비/눈, 3: 눈, 4: 소나기, 5: 빗방울, 6: 빗방울눈날림, 7: 눈날림)

                    if (pty === '0') {
                        if (sky === '1') description = '맑음';
                        else if (sky === '3') description = '구름 많음';
                        else if (sky === '4') description = '흐림';
                    } else if (pty === '1') description = '비';
                    else if (pty === '2') description = '비/눈';
                    else if (pty === '3') description = '눈';
                    else if (pty === '4') description = '소나기';
                    else if (pty === '5') description = '빗방울';
                    else if (pty === '6') description = '빗방울눈날림';
                    else if (pty === '7') description = '눈날림';

                    // let icon = 'WiDaySunny'; // 기본 아이콘

                    if (description.includes('맑음')) icon = 'WiDaySunny';
                    else if (description.includes('구름 많음')) icon = 'WiDayCloudy';
                    else if (description.includes('흐림')) icon = 'WiCloudy';
                    else if (description.includes('비/눈')) icon = 'WiSleet';
                    else if (description.includes('비')) icon = 'WiRain';
                    else if (description.includes('눈')) icon = 'WiSnow';
                    else if (description.includes('소나기')) icon = 'WiShowers';
                    else if (description.includes('빗방울눈날림')) icon = 'WiRainMix';
                    else if (description.includes('눈날림')) icon = 'WiSnowWind';
                    else if (description.includes('빗방울')) icon = 'WiSprinkle';

                    setWeather({
                        description: description,
                        temp: weatherData.T1H,
                        humidity: weatherData.REH,
                        wind: weatherData.WSD,
                        precipitation: weatherData.RN1,
                        icon: icon,
                    });
                } else {
                    setError("날씨 정보를 찾을 수 없습니다.");
                    setWeather(null);
                }
            } catch (err) {
                console.error("날씨 정보를 가져오는 데 실패했습니다:", err);
                setError("날씨 정보를 가져오는 데 실패했습니다.");
                setWeather(null);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location]);

    return { weather, loading, error };
}
