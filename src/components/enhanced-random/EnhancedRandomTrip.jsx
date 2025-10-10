import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useEnhancedRandomTrip } from '../../context/EnhancedRandomTripContext';
import { fetchRandomTrip } from '../../api/trip'; // API 함수 임포트

const travelConcepts = [
    { id: 'theme-food', name: '맛집 탐방', emoji: '🍔' },
    { id: 'theme-cafe', name: '감성 카페', emoji: '☕' },
    { id: 'theme-photo', name: '인생샷 명소', emoji: '📸' },
    { id: 'theme-night', name: '나만 아는 야경', emoji: '🌃' },
    { id: 'theme-activity', name: '액티비티 체험', emoji: '🤸' },
];

// 현실적인 미션으로 수정
const missions = [
    { text: '가장 인상 깊은 장소에서 파노라마 사진 찍기', instruction: '멋진 파노라마 사진을 찍어 인증해주세요.' },
    { text: '현지 음식점에서 식사하고 음식 사진 남기기', instruction: '맛있는 음식 사진을 찍어 인증해주세요.' },
    { text: '여행지의 풍경을 배경으로 셀카 찍기', instruction: '여행의 추억이 담긴 셀카를 찍어 인증해주세요.' },
    { text: '방문한 장소의 이름이 나오게 사진 찍기', instruction: '장소의 이름이 보이는 간판이나 입구에서 사진을 찍어 인증해주세요.' },
    { text: '가장 마음에 드는 길거리에서 사진 찍기', instruction: '아름다운 길거리 풍경을 사진으로 남겨주세요.' },
];

const EnhancedRandomTrip = () => {
    const { gameState, updatePreferences, saveRecommendation, addPoints, addBadge } = useEnhancedRandomTrip();
    const cardRef = useRef(null);
    const fileInputRef = useRef(null);

    const [selectedConcept, setSelectedConcept] = useState(null);
    const [mbti, setMbti] = useState('');
    const [result, setResult] = useState(null);
    const [mission, setMission] = useState(null);
    const [proofShotUrl, setProofShotUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    const handleGenerate = async () => {
        if (!selectedConcept) {
            alert('여행 컨셉을 선택해주세요!');
            return;
        }
        setIsLoading(true); // 로딩 시작
        setResult(null);
        setProofShotUrl(null);
        updatePreferences({ favoriteThemes: [selectedConcept], mbti });

        try {
            const destinations = await fetchRandomTrip();
            if (!destinations || destinations.length === 0) {
                throw new Error('추천할 여행지가 없습니다.');
            }

            const randomDestinationData = destinations[Math.floor(Math.random() * destinations.length)];
            const randomMission = missions[Math.floor(Math.random() * missions.length)];

            // API 응답 데이터 구조에 맞게 매핑
            const recommendation = {
                name: randomDestinationData.title,
                description: randomDestinationData.address,
                imageUrl: randomDestinationData.imageUrl,
                mission: randomMission,
            };

            setResult(recommendation);
            setMission(randomMission);
            saveRecommendation(recommendation);
        } catch (error) {
            console.error("Error generating random trip:", error);
            alert("여행지를 불러오는 데 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    const handleProofShotUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setProofShotUrl(e.target.result);
            const points = 100;
            addPoints(points, 'Mission Completion');
            alert(`축하합니다! 미션을 완료하여 ${points} 포인트를 획득했습니다!`);

            if (!gameState.badges.some(b => b.name === '첫 미션 완료')) {
                addBadge({ name: '첫 미션 완료', icon: '🏆', description: '첫 여행 미션을 성공적으로 완료했습니다.' });
                alert('업적 달성: 첫 미션 완료! 🏆');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleShareCard = () => {
        if (!cardRef.current) return;

        html2canvas(cardRef.current, { useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'my-travel-mission.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    };

    return (
        <div className="p-4 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-6">
            <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">🎲 뽑기형 랜덤 여행</h1>
                <p className="text-gray-500">컨셉을 뽑고, 미션을 수행하며 레벨을 올려보세요!</p>
                <div className="mt-2 text-sm font-semibold text-white flex justify-center items-center gap-4">
                    <span className='bg-purple-500 px-3 py-1 rounded-full'>LV. {gameState.level}</span>
                    <span className='bg-yellow-500 px-3 py-1 rounded-full'>XP: {gameState.totalPoints}</span>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">1. 어떤 컨셉의 여행을 원하세요?</h2>
                <div className="flex flex-wrap gap-2 justify-center">
                    {travelConcepts.map((concept) => (
                        <button
                            key={concept.id}
                            onClick={() => setSelectedConcept(concept.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${selectedConcept === concept.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {concept.emoji} {concept.name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">2. MBTI를 알려주세요! (선택)</h2>
                <input
                    type="text"
                    value={mbti}
                    onChange={(e) => setMbti(e.target.value.toUpperCase())}
                    placeholder="예: INFP"
                    maxLength="4"
                    className="w-full px-4 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading} // 로딩 중 비활성화
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isLoading ? '여행지 찾는 중...' : '랜덤 여행지 뽑기!'}
            </button>

            {isLoading && (
                <div className="text-center p-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">두근두근... 당신을 위한 여행지를 찾고 있어요!</p>
                </div>
            )}

            {result && !isLoading && (
                <div className="mt-6 animate-fade-in-up">
                    <div ref={cardRef} className="bg-gray-50 rounded-xl shadow-inner overflow-hidden p-6">
                        <h3 className="text-xl font-bold text-center text-purple-600">🎉 당신을 위한 여행지! 🎉</h3>
                        <img src={result.imageUrl || '/placeholder.svg'} alt={result.name} className="w-full h-48 object-cover rounded-lg my-4" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.svg'; }} />
                        <div className="text-center mb-6">
                            <p className="text-3xl font-bold">{result.name}</p>
                            <p className="text-md text-gray-600 mt-1">{result.description}</p>
                        </div>
                        <div className="pt-4 border-t-2 border-dashed">
                            <h4 className="font-semibold text-lg text-center">오늘의 미션!</h4>
                            <p className="text-center text-xl font-medium text-gray-800 mt-2 p-3 bg-yellow-100 rounded-lg">{mission.text}</p>
                            <p className="text-center text-sm text-gray-500 mt-1">{mission.instruction}</p>
                        </div>
                        {proofShotUrl && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-lg text-center text-green-600">미션 인증 완료!</h4>
                                <img src={proofShotUrl} alt="Mission Proof Shot" className="w-full h-auto object-cover rounded-lg mt-2" />
                            </div>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleProofShotUpload} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={!!proofShotUrl}
                            className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200">
                            {proofShotUrl ? '인증 완료 🎉' : '미션 인증샷 올리기'}
                        </button>
                        <button
                            onClick={handleShareCard}
                            className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200">
                            여행 카드 공유하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedRandomTrip;

