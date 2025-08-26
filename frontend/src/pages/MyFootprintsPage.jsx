import React, { useEffect, useState, useRef } from 'react';
import { getFootprints, updateFootprint, deleteFootprint, getImageSasUrl } from '../api/footprints';
import { getAllItineraries, getItineraryDetails } from '../api/itinerary';
import { useAuth } from '../context/AuthContext';
import GoogleMapReact from 'google-map-react';
import FootprintStats from '../components/FootprintStats';

// 발자국 이미지 컴포넌트
const FootprintImage = ({ photoUrl, destinationTitle }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const loadImage = async () => {
            if (!photoUrl) {
                setIsLoading(false);
                setImageError(true);
                return;
            }

            console.log('FootprintImage - photoUrl:', photoUrl);

            // Base64 이미지인 경우 직접 사용
            if (photoUrl.startsWith('data:image/')) {
                console.log('Base64 이미지 감지됨');
                setImageSrc(photoUrl);
                setIsLoading(false);
                return;
            }

            // 잘못된 URL 패턴 체크 및 수정
            let cleanPhotoUrl = photoUrl;
            if (photoUrl.includes('undefined/')) {
                // undefined/ 제거하고 실제 파일명만 추출
                cleanPhotoUrl = photoUrl.replace('undefined/', '');
                console.log('undefined/ 제거 후:', cleanPhotoUrl);
            } else if (photoUrl.includes('undefined%2F')) {
                // URL 인코딩된 undefined/ 제거
                cleanPhotoUrl = photoUrl.replace('undefined%2F', '');
                console.log('undefined%2F 제거 후:', cleanPhotoUrl);
            }

            // wqerwq 같은 잘못된 값 체크
            if (cleanPhotoUrl === 'wqerwq' || cleanPhotoUrl.length < 10) {
                console.log('유효하지 않은 photoUrl:', cleanPhotoUrl);
                setIsLoading(false);
                setImageError(true);
                return;
            }

            try {
                // photoUrl에서 파일명 추출
                let fileName = cleanPhotoUrl.split('/').pop();
                console.log('추출된 파일명:', fileName);

                // 이미 SAS 토큰이 포함된 URL인지 확인
                if (fileName && fileName.includes('?sv=')) {
                    console.log('이미 SAS 토큰이 포함된 URL 감지됨');
                    // SAS 토큰 부분 제거
                    fileName = fileName.split('?')[0];
                    console.log('SAS 토큰 제거 후 파일명:', fileName);
                }

                if (!fileName || fileName === 'undefined' || fileName.length < 5) {
                    console.log('유효하지 않은 파일명:', fileName);
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // 이미 완전한 URL인 경우 직접 사용
                if (cleanPhotoUrl.startsWith('https://') && cleanPhotoUrl.includes('?sv=')) {
                    console.log('완전한 SAS URL 감지됨, 직접 사용');
                    setImageSrc(cleanPhotoUrl);
                    setIsLoading(false);
                    return;
                }

                // SAS URL 가져오기
                const sasUrlResponse = await getImageSasUrl(fileName);
                console.log('SAS URL 응답:', sasUrlResponse);

                // SAS URL 에러 체크
                if (sasUrlResponse.error) {
                    console.log('SAS URL 에러:', sasUrlResponse.error);
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // sasUrl을 우선적으로 사용 (공개 접근이 불가능한 경우를 대비)
                const imageUrl = sasUrlResponse.sasUrl || sasUrlResponse.permanentUrl;

                if (!imageUrl) {
                    console.log('SAS URL이 없음');
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // 이미지 로드 테스트
                const img = new Image();
                img.onload = () => {
                    setImageSrc(imageUrl);
                    setIsLoading(false);
                    setRetryCount(0); // 성공 시 재시도 카운트 리셋
                };
                img.onerror = () => {
                    console.log(`이미지 로드 실패 (403 또는 기타 오류) - 재시도 ${retryCount + 1}/3`);

                    // 403 권한 오류인 경우 상세 정보 출력
                    if (retryCount === 0) {
                        console.error('=== Azure Blob Storage 권한 문제 ===');
                        console.error('문제: SAS 토큰에 읽기 권한이 없습니다.');
                        console.error('현재 권한: sp=cw (Create, Write)');
                        console.error('필요 권한: sp=r (Read) 또는 sp=rw (Read, Write)');
                        console.error('해결 방법: 백엔드에서 SAS 토큰 생성 시 읽기 권한 추가');
                        console.error('백엔드 코드 예시:');
                        console.error('const sasToken = generateBlobSASQueryParameters({');
                        console.error('  containerName,');
                        console.error('  blobName,');
                        console.error('  permissions: BlobSASPermissions.parse("r"), // 읽기 권한 추가');
                        console.error('  startsOn: new Date(),');
                        console.error('  expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1시간');
                        console.error('}, accountKey);');
                        console.error('=====================================');
                    }

                    // 3번까지 재시도
                    if (retryCount < 2) {
                        setRetryCount(prev => prev + 1);
                        // 1초 후 재시도
                        setTimeout(() => {
                            loadImage();
                        }, 1000);
                    } else {
                        console.log('최대 재시도 횟수 초과');
                        setIsLoading(false);
                        setImageError(true);
                    }
                };
                img.src = imageUrl;

            } catch (error) {
                console.error('이미지 로드 실패:', error);
                setIsLoading(false);
                setImageError(true);
            }
        };

        loadImage();
    }, [photoUrl, retryCount]);

    // 로딩 중
    if (isLoading) {
        return (
            <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                    {retryCount > 0 && (
                        <span className="text-xs text-blue-600">재시도 중... ({retryCount}/3)</span>
                    )}
                </div>
            </div>
        );
    }

    // 잘못된 photoUrl인 경우 바로 에러 상태로
    if (!photoUrl || photoUrl === 'wqerwq' || photoUrl.length < 10) {
        return (
            <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-xs text-gray-500">이미지 없음</span>
            </div>
        );
    }

    if (imageError || !imageSrc) {
        return (
            <div className="w-full h-24 bg-gradient-to-br from-orange-50 to-red-100 rounded-md flex flex-col items-center justify-center border border-orange-200 relative group">
                <svg className="w-8 h-8 text-orange-400 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-xs text-orange-600 font-medium">{destinationTitle}</span>
                <span className="text-xs text-orange-500">이미지 로드 실패</span>

                {/* 툴팁 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                        <div className="font-medium mb-1">Azure Blob Storage 권한 문제</div>
                        <div className="text-gray-300 mb-1">SAS 토큰에 읽기 권한 필요</div>
                        <div className="text-gray-400 text-xs">백엔드 설정 확인 필요</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${destinationTitle} 방문 사진`}
            className="w-full h-24 object-cover rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
            onError={() => setImageError(true)}
        />
    );
};

// 발자국 상세 이미지 컴포넌트
const FootprintDetailImage = ({ photoUrl, destinationTitle }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const loadImage = async () => {
            if (!photoUrl) {
                setIsLoading(false);
                setImageError(true);
                return;
            }

            // Base64 이미지인 경우 직접 사용
            if (photoUrl.startsWith('data:image/')) {
                setImageSrc(photoUrl);
                setIsLoading(false);
                return;
            }

            // 잘못된 URL 패턴 체크 및 수정
            let cleanPhotoUrl = photoUrl;
            if (photoUrl.includes('undefined/')) {
                // undefined/ 제거하고 실제 파일명만 추출
                cleanPhotoUrl = photoUrl.replace('undefined/', '');
                console.log('undefined/ 제거 후:', cleanPhotoUrl);
            } else if (photoUrl.includes('undefined%2F')) {
                // URL 인코딩된 undefined/ 제거
                cleanPhotoUrl = photoUrl.replace('undefined%2F', '');
                console.log('undefined%2F 제거 후:', cleanPhotoUrl);
            }

            // wqerwq 같은 잘못된 값 체크
            if (cleanPhotoUrl === 'wqerwq' || cleanPhotoUrl.length < 10) {
                console.log('유효하지 않은 photoUrl:', cleanPhotoUrl);
                setIsLoading(false);
                setImageError(true);
                return;
            }

            try {
                // photoUrl에서 파일명 추출
                let fileName = cleanPhotoUrl.split('/').pop();

                // 이미 SAS 토큰이 포함된 URL인지 확인
                if (fileName && fileName.includes('?sv=')) {
                    console.log('이미 SAS 토큰이 포함된 URL 감지됨 (상세)');
                    // SAS 토큰 부분 제거
                    fileName = fileName.split('?')[0];
                    console.log('SAS 토큰 제거 후 파일명 (상세):', fileName);
                }

                if (!fileName || fileName === 'undefined' || fileName.length < 5) {
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // 이미 완전한 URL인 경우 직접 사용
                if (cleanPhotoUrl.startsWith('https://') && cleanPhotoUrl.includes('?sv=')) {
                    console.log('완전한 SAS URL 감지됨, 직접 사용 (상세)');
                    setImageSrc(cleanPhotoUrl);
                    setIsLoading(false);
                    return;
                }

                // SAS URL 가져오기
                const sasUrlResponse = await getImageSasUrl(fileName);

                // SAS URL 에러 체크
                if (sasUrlResponse.error) {
                    console.log('SAS URL 에러:', sasUrlResponse.error);
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // sasUrl을 우선적으로 사용
                const imageUrl = sasUrlResponse.sasUrl || sasUrlResponse.permanentUrl;

                if (!imageUrl) {
                    setIsLoading(false);
                    setImageError(true);
                    return;
                }

                // 이미지 로드 테스트
                const img = new Image();
                img.onload = () => {
                    setImageSrc(imageUrl);
                    setIsLoading(false);
                    setRetryCount(0); // 성공 시 재시도 카운트 리셋
                };
                img.onerror = () => {
                    console.log(`상세 이미지 로드 실패 (403 또는 기타 오류) - 재시도 ${retryCount + 1}/3`);

                    // 403 권한 오류인 경우 상세 정보 출력
                    if (retryCount === 0) {
                        console.error('=== Azure Blob Storage 권한 문제 (상세 이미지) ===');
                        console.error('문제: SAS 토큰에 읽기 권한이 없습니다.');
                        console.error('현재 권한: sp=cw (Create, Write)');
                        console.error('필요 권한: sp=r (Read) 또는 sp=rw (Read, Write)');
                        console.error('해결 방법: 백엔드에서 SAS 토큰 생성 시 읽기 권한 추가');
                        console.error('=====================================');
                    }

                    // 3번까지 재시도
                    if (retryCount < 2) {
                        setRetryCount(prev => prev + 1);
                        // 1초 후 재시도
                        setTimeout(() => {
                            loadImage();
                        }, 1000);
                    } else {
                        console.log('최대 재시도 횟수 초과');
                        setIsLoading(false);
                        setImageError(true);
                    }
                };
                img.src = imageUrl;

            } catch (error) {
                console.error('이미지 로드 실패:', error);
                setIsLoading(false);
                setImageError(true);
            }
        };

        loadImage();
    }, [photoUrl, retryCount]);

    // 로딩 중
    if (isLoading) {
        return (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    {retryCount > 0 && (
                        <span className="text-sm text-blue-600">재시도 중... ({retryCount}/3)</span>
                    )}
                </div>
            </div>
        );
    }

    // 잘못된 photoUrl인 경우 바로 에러 상태로
    if (!photoUrl || photoUrl === 'wqerwq' || photoUrl.length < 10) {
        return (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-sm text-gray-500">이미지 없음</span>
            </div>
        );
    }

    if (imageError || !imageSrc) {
        return (
            <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-red-100 rounded-lg border border-orange-200 flex flex-col items-center justify-center relative group">
                <svg className="w-12 h-12 text-orange-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-sm text-orange-600 font-medium">{destinationTitle}</span>
                <span className="text-sm text-orange-500">이미지 로드 실패</span>

                {/* 툴팁 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                        <div className="font-medium mb-1">Azure Blob Storage 권한 문제</div>
                        <div className="text-gray-300 mb-1">SAS 토큰에 읽기 권한 필요</div>
                        <div className="text-gray-400 text-xs">백엔드 설정 확인 필요</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${destinationTitle} 방문 사진`}
            className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            onError={() => setImageError(true)}
        />
    );
};

// 이미지 마커 컴포넌트
const ImageMarker = ({ footprint, onClick, isSelected }) => {
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        const loadMarkerImage = async () => {
            if (!footprint.photoUrl) return;

            // Base64 이미지인 경우 직접 사용
            if (footprint.photoUrl.startsWith('data:image/')) {
                setImageSrc(footprint.photoUrl);
                return;
            }

            // 잘못된 URL 패턴 체크 및 수정
            let cleanPhotoUrl = footprint.photoUrl;
            if (footprint.photoUrl.includes('undefined/')) {
                // undefined/ 제거하고 실제 파일명만 추출
                cleanPhotoUrl = footprint.photoUrl.replace('undefined/', '');
                console.log('마커 - undefined/ 제거 후:', cleanPhotoUrl);
            }

            // wqerwq 같은 잘못된 값 체크
            if (cleanPhotoUrl === 'wqerwq' || cleanPhotoUrl.length < 10) {
                console.log('마커 - 유효하지 않은 photoUrl:', cleanPhotoUrl);
                setImageError(true);
                return;
            }

            try {
                // photoUrl에서 파일명 추출
                const fileName = cleanPhotoUrl.split('/').pop();
                if (!fileName || fileName === 'undefined' || fileName.length < 5) {
                    setImageError(true);
                    return;
                }

                // SAS URL 가져오기
                const sasUrlResponse = await getImageSasUrl(fileName);

                // sasUrl을 우선적으로 사용
                const imageUrl = sasUrlResponse.sasUrl || sasUrlResponse.permanentUrl;

                if (!imageUrl) {
                    setImageError(true);
                    return;
                }

                setImageSrc(imageUrl);
            } catch (error) {
                console.error('마커 이미지 로드 실패:', error);
                setImageError(true);
            }
        };

        loadMarkerImage();
    }, [footprint.photoUrl]);

    return (
        <div
            className={`relative cursor-pointer transform transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'
                }`}
            onClick={() => onClick(footprint)}
        >
            <div className="relative">
                {imageSrc && !imageError ? (
                    <img
                        src={imageSrc}
                        alt={footprint.destinationTitle}
                        className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-lg"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-3 border-white shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                    </div>
                )}
                {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-40">
                <div className="font-semibold">{footprint.destinationTitle}</div>
                <div className="text-gray-300">{new Date(footprint.createdAt).toLocaleDateString()}</div>
            </div>
        </div>
    );
};

const MyFootprintsPage = () => {
    const [footprints, setFootprints] = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFootprint, setSelectedFootprint] = useState(null);
    const [selectedItinerary, setSelectedItinerary] = useState(null);
    const { token } = useAuth();
    const mapRef = useRef(null);
    const mapsRef = useRef(null);
    const polylineRef = useRef(null);

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const fetchData = async () => {
        if (!token) {
            setLoading(false);
            setError({ message: '로그인이 필요합니다.' });
            return;
        }

        try {
            const [footprintsData, itinerariesData] = await Promise.all([
                getFootprints(),
                getAllItineraries()
            ]);

            console.log('발자국 데이터 상세:', footprintsData.map(fp => ({
                id: fp.id,
                destinationTitle: fp.destinationTitle,
                photoUrl: fp.photoUrl,
                memo: fp.memo
            })));

            const sortedFootprints = footprintsData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setFootprints(sortedFootprints);
            setItineraries(itinerariesData);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    useEffect(() => {
        if (mapRef.current && mapsRef.current && footprints.length > 0) {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }

            const pathCoordinates = footprints
                .filter(fp => typeof fp.latitude === 'number' && !isNaN(fp.latitude) && typeof fp.longitude === 'number' && !isNaN(fp.longitude))
                .map(fp => ({ lat: fp.latitude, lng: fp.longitude }));

            if (pathCoordinates.length > 1) {
                const newPolyline = new mapsRef.current.Polyline({
                    path: pathCoordinates,
                    geodesic: true,
                    strokeColor: '#10B981',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                });
                newPolyline.setMap(mapRef.current);
                polylineRef.current = newPolyline;
            }
        }
    }, [footprints, mapRef.current, mapsRef.current]);

    const handleEditFootprint = async (id, currentData) => {
        const newMemo = prompt('새로운 메모를 입력하세요:', currentData.memo);
        if (newMemo === null) {
            return;
        }

        try {
            await updateFootprint(id, {
                ...currentData,
                memo: newMemo,
                title: currentData.title,
                description: currentData.description,
                imageUrl: currentData.imageUrl
            });
            alert('발자국이 수정되었습니다.');
            fetchData();
        } catch (err) {
            alert('발자국 수정에 실패했습니다: ' + (err.message || err));
        }
    };

    const handleDeleteFootprint = async (id) => {
        if (window.confirm('정말로 이 발자국을 삭제하시겠습니까?')) {
            try {
                await deleteFootprint(id);
                alert('발자국이 삭제되었습니다.');
                fetchData();
            } catch (err) {
                alert('발자국 삭제에 실패했습니다: ' + (err.message || err));
            }
        }
    };

    const handleFootprintClick = (footprint) => {
        setSelectedFootprint(footprint);
        setSelectedItinerary(null);
    };

    const handleItineraryClick = async (itinerary) => {
        try {
            const details = await getItineraryDetails(itinerary.id);
            setSelectedItinerary(details);
            setSelectedFootprint(null);
        } catch (err) {
            console.error('일정 상세 정보 불러오기 실패:', err);
        }
    };

    if (loading) {
        return <div className="text-center py-10">발자국을 불러오는 중입니다...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">발자국을 불러오는데 실패했습니다: {error.message}</div>;
    }

    const getMapCenter = () => {
        const validFootprints = footprints.filter(
            (fp) => typeof fp.latitude === 'number' && !isNaN(fp.latitude) &&
                typeof fp.longitude === 'number' && !isNaN(fp.longitude)
        );

        if (validFootprints.length === 0) {
            return { lat: 37.5665, lng: 126.9780 };
        }
        const totalLat = validFootprints.reduce((sum, fp) => sum + fp.latitude, 0);
        const totalLng = validFootprints.reduce((sum, fp) => sum + fp.longitude, 0);
        return {
            lat: totalLat / validFootprints.length,
            lng: totalLng / validFootprints.length,
        };
    };

    const handleApiLoaded = ({ map, maps }) => {
        mapRef.current = map;
        mapsRef.current = maps;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center">나의 발자국</h1>

            {footprints.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 남긴 발자국이 없습니다</h3>
                    <p className="text-gray-500 mb-6">여행을 떠나 발자국을 남겨보세요!</p>
                    <button
                        onClick={() => window.location.href = '/custom'}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                    >
                        여행 계획 세우기
                    </button>
                </div>
            ) : (
                <>
                    {/* 통계 대시보드 */}
                    <div className="mb-8">
                        <FootprintStats footprints={footprints} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 지도 영역 */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">지도에서 보기</h2>
                            <div style={{ height: '500px', width: '100%' }}>
                                <GoogleMapReact
                                    bootstrapURLKeys={{ key: googleMapsApiKey }}
                                    defaultCenter={getMapCenter()}
                                    defaultZoom={10}
                                    yesIWantToUseGoogleMapApiInternals
                                    onGoogleApiLoaded={handleApiLoaded}
                                >
                                    {footprints.map((fp) => {
                                        if (typeof fp.latitude !== 'number' || isNaN(fp.latitude) ||
                                            typeof fp.longitude !== 'number' || isNaN(fp.longitude)) {
                                            return null;
                                        }
                                        return (
                                            <ImageMarker
                                                key={fp.id}
                                                lat={fp.latitude}
                                                lng={fp.longitude}
                                                footprint={fp}
                                                onClick={handleFootprintClick}
                                                isSelected={selectedFootprint?.id === fp.id}
                                            />
                                        );
                                    })}
                                </GoogleMapReact>
                            </div>
                        </div>

                        {/* 발자국 목록 */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">발자국 타임라인</h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {footprints.map((fp) => (
                                    <div
                                        key={fp.id}
                                        className={`p-4 border rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${selectedFootprint?.id === fp.id
                                            ? 'border-green-500 bg-green-50'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        onClick={() => handleFootprintClick(fp)}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800">{fp.destinationTitle}</h3>
                                        <p className="text-gray-700 text-sm mb-2">{fp.memo}</p>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {new Date(fp.createdAt).toLocaleDateString()}
                                        </p>
                                        {fp.photoUrl && (
                                            <div className="mt-2">
                                                <FootprintImage
                                                    photoUrl={fp.photoUrl}
                                                    destinationTitle={fp.destinationTitle}
                                                />
                                            </div>
                                        )}
                                        <div className="flex space-x-2 mt-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditFootprint(fp.id, fp);
                                                }}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFootprint(fp.id);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 선택된 발자국 상세 정보 */}
                    {selectedFootprint && (
                        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800">{selectedFootprint.destinationTitle}</h3>
                                <button
                                    onClick={() => setSelectedFootprint(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-semibold">방문일:</span> {new Date(selectedFootprint.createdAt).toLocaleDateString()}
                                    </p>
                                    {selectedFootprint.memo && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-2">메모</h4>
                                            <p className="text-gray-700">{selectedFootprint.memo}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedFootprint.photoUrl && (
                                    <div>
                                        <FootprintDetailImage
                                            photoUrl={selectedFootprint.photoUrl}
                                            destinationTitle={selectedFootprint.destinationTitle}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyFootprintsPage;