import { useState, useEffect } from 'react';

export function useWeather(location) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!location) return;

        setLoading(true);

        // TODO: 실제 OpenWeather API로 변경 예정
        setTimeout(() => {
            setWeather({
                description: '맑음',
                temp: 22,
            });
            setLoading(false);
        }, 1000);
    }, [location]);

    return { weather, loading };
}
