import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const EnhancedRandomTripContext = createContext();

// 랜덤 모드 타입 정의
export const RANDOM_MODES = {
    COMPLETE: 'complete',
    THEME: 'theme',
    DISTANCE: 'distance',
    BUDGET: 'budget',
    WEATHER: 'weather', // WEATHER 모드 추가
    INSTANT: 'instant'
};

// 게임 타입 정의
export const GAME_TYPES = {
    ROULETTE: 'roulette',
    SLOT: 'slot',
    CARD: 'card',
    BATTLE: 'battle'
};

// 초기 사용자 선호도 상태
const initialPreferences = {
    travelStyle: [],
    companionType: 'solo',
    budgetRange: { min: 0, max: 100000 },
    preferredDistance: 50,
    favoriteThemes: [],
    dislikedPlaces: [],
    timePreferences: {
        morning: true,
        afternoon: true,
        evening: true
    },
    weatherPreferences: [] // weatherPreferences 추가
};

// 초기 게임 상태
const initialGameState = {
    totalPoints: 0,
    level: 1,
    badges: [],
    streakCount: 0,
    lastPlayDate: null,
    achievements: [],
    unlockedFeatures: ['basic_random']
};

export const EnhancedRandomTripProvider = ({ children }) => {
    const { token, username } = useAuth();

    // 상태 관리
    const [selectedMode, setSelectedMode] = useState(RANDOM_MODES.COMPLETE);
    const [gameType, setGameType] = useState(GAME_TYPES.ROULETTE);
    const [userPreferences, setUserPreferences] = useState(initialPreferences);
    const [gameState, setGameState] = useState(initialGameState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentRecommendations, setCurrentRecommendations] = useState([]);
    const [recommendationHistory, setRecommendationHistory] = useState([]);

    // 로컬 스토리지에서 사용자 데이터 로드
    useEffect(() => {
        if (username) {
            const savedPreferences = localStorage.getItem(`preferences_${username}`);
            const savedGameState = localStorage.getItem(`gameState_${username}`);
            const savedHistory = localStorage.getItem(`history_${username}`);

            if (savedPreferences) {
                try {
                    setUserPreferences(JSON.parse(savedPreferences));
                } catch (error) {
                    console.error('선호도 데이터 로드 실패:', error);
                }
            }

            if (savedGameState) {
                try {
                    setGameState(JSON.parse(savedGameState));
                } catch (error) {
                    console.error('게임 상태 데이터 로드 실패:', error);
                }
            }

            if (savedHistory) {
                try {
                    setRecommendationHistory(JSON.parse(savedHistory));
                } catch (error) {
                    console.error('추천 히스토리 로드 실패:', error);
                }
            }
        }
    }, [username]);

    // 사용자 데이터 저장
    const saveUserData = () => {
        if (username) {
            localStorage.setItem(`preferences_${username}`, JSON.stringify(userPreferences));
            localStorage.setItem(`gameState_${username}`, JSON.stringify(gameState));
            localStorage.setItem(`history_${username}`, JSON.stringify(recommendationHistory));
        }
    };

    // 선호도 업데이트
    const updatePreferences = (newPreferences) => {
        setUserPreferences(prev => ({
            ...prev,
            ...newPreferences
        }));
    };

    // 게임 상태 업데이트
    const updateGameState = (updates) => {
        setGameState(prev => ({
            ...prev,
            ...updates,
            lastPlayDate: new Date().toISOString()
        }));
    };

    // 포인트 추가
    const addPoints = (points, reason = '') => {
        setGameState(prev => {
            const newPoints = prev.totalPoints + points;
            const newLevel = Math.floor(newPoints / 1000) + 1;

            return {
                ...prev,
                totalPoints: newPoints,
                level: newLevel > prev.level ? newLevel : prev.level
            };
        });
    };

    // 배지 추가
    const addBadge = (badge) => {
        setGameState(prev => ({
            ...prev,
            badges: [...prev.badges, {
                ...badge,
                earnedAt: new Date().toISOString()
            }]
        }));
    };

    // 연속 사용 업데이트
    const updateStreak = () => {
        const today = new Date().toDateString();
        const lastPlay = gameState.lastPlayDate ? new Date(gameState.lastPlayDate).toDateString() : null;

        if (lastPlay === today) {
            // 오늘 이미 플레이함
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastPlay === yesterdayStr) {
            // 연속 사용
            setGameState(prev => ({
                ...prev,
                streakCount: prev.streakCount + 1
            }));
        } else {
            // 연속 끊김
            setGameState(prev => ({
                ...prev,
                streakCount: 1
            }));
        }
    };

    // 추천 결과 저장
    const saveRecommendation = (recommendation) => {
        const newRecommendation = {
            ...recommendation,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            mode: selectedMode,
            gameType: gameType
        };

        setRecommendationHistory(prev => [newRecommendation, ...prev.slice(0, 49)]); // 최대 50개 저장
        setCurrentRecommendations([newRecommendation]);
    };

    // 에러 처리
    const handleError = (error, fallbackAction = null) => {
        console.error('Enhanced Random Trip Error:', error);
        setError(error.message || '알 수 없는 오류가 발생했습니다.');
        setIsLoading(false);

        if (fallbackAction) {
            fallbackAction();
        }
    };

    // 에러 클리어
    const clearError = () => {
        setError(null);
    };

    // 데이터 저장 (상태 변경 시)
    useEffect(() => {
        saveUserData();
    }, [userPreferences, gameState, recommendationHistory]);

    const contextValue = {
        // 상태
        selectedMode,
        gameType,
        userPreferences,
        gameState,
        isLoading,
        error,
        currentRecommendations,
        recommendationHistory,

        // 상태 업데이트 함수
        setSelectedMode,
        setGameType,
        updatePreferences,
        updateGameState,
        setIsLoading,

        // 게임 관련 함수
        addPoints,
        addBadge,
        updateStreak,

        // 추천 관련 함수
        saveRecommendation,

        // 유틸리티 함수
        handleError,
        clearError,

        // 상수
        RANDOM_MODES,
        GAME_TYPES
    };

    return (
        <EnhancedRandomTripContext.Provider value={contextValue}>
            {children}
        </EnhancedRandomTripContext.Provider>
    );
};

export const useEnhancedRandomTrip = () => {
    const context = useContext(EnhancedRandomTripContext);
    if (!context) {
        throw new Error('useEnhancedRandomTrip must be used within EnhancedRandomTripProvider');
    }
    return context;
};