import React, { useEffect, useState, useRef } from 'react';
import { getFootprints, updateFootprint, deleteFootprint, getImageSasUrl } from '../api/footprints';
import { getAllItineraries, getItineraryDetails } from '../api/itinerary';
import { useAuth } from '../context/AuthContext';
import FootprintStats from '../components/FootprintStats';

// ----------------------------------------------------------------
// 개선된 디자인의 새로운 컴포넌트들
// ----------------------------------------------------------------

// 발자국 카드 이미지 컴포넌트
const FootprintCardImage = ({ photoUrl, destinationTitle }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadImage = async () => {
            setImageSrc(null);
            setImageError(false);
            setIsLoading(true);

            if (!photoUrl || photoUrl === 'wqerwq' || photoUrl.length < 5) {
                setIsLoading(false);
                setImageError(true);
                return;
            }

            const attemptLoad = (url) => {
                const img = new Image();
                img.onload = () => {
                    setImageSrc(url);
                    setIsLoading(false);
                    setImageError(false);
                };
                img.onerror = async () => {
                    if (url === photoUrl) {
                        try {
                            const baseUrl = photoUrl.split('?')[0];
                            const fileName = baseUrl.split('/').pop();
                            if (!fileName || fileName === 'undefined' || fileName.length < 5) {
                                setImageError(true);
                                setIsLoading(false);
                                return;
                            }
                            const sasUrlResponse = await getImageSasUrl(fileName, 'r');
                            if (sasUrlResponse.error || !sasUrlResponse.sasUrl) {
                                setImageError(true);
                                setIsLoading(false);
                            } else {
                                attemptLoad(sasUrlResponse.sasUrl);
                            }
                        } catch (e) {
                            setImageError(true);
                            setIsLoading(false);
                        }
                    } else {
                        setImageError(true);
                        setIsLoading(false);
                    }
                };
                img.src = url;
            };

            attemptLoad(photoUrl);
        };

        loadImage();
    }, [photoUrl]);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }

    if (imageError || !imageSrc) {
        return (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-sm">이미지 없음</p>
                </div>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${destinationTitle} 방문 사진`}
            className="w-full h-full object-cover"
        />
    );
};


// 새로운 발자국 카드 컴포넌트
const FootprintCard = ({ footprint, onSelect, isSelected }) => {
    const { id, destinationTitle, createdAt, memo, photoUrl } = footprint;
    const date = new Date(createdAt);

    return (
        <div
            className={`bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 ${isSelected ? 'border-teal-500 shadow-lg' : 'border-transparent hover:shadow-lg'
                }`}
            onClick={() => onSelect(footprint)}
        >
            <div className="md:flex">
                <div className="md:flex-shrink-0">
                    <div className="h-48 w-full md:w-48">
                        <FootprintCardImage photoUrl={photoUrl} destinationTitle={destinationTitle} />
                    </div>
                </div>
                <div className="p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-baseline">
                            <span className="inline-block bg-teal-200 text-teal-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide">
                                {`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`}
                            </span>
                        </div>
                        <h3 className="mt-2 text-2xl font-bold leading-tight text-gray-900 hover:text-teal-600 transition-colors duration-200">
                            {destinationTitle}
                        </h3>
                        <p className="mt-2 text-gray-600 text-sm leading-relaxed line-clamp-3">
                            {memo || '작성된 메모가 없습니다.'}
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span>자세히 보기</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 선택된 발자국 상세 정보 컴포넌트
const SelectedFootprintDetail = ({ footprint, onDeselect, onEdit, onDelete }) => {
    if (!footprint) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onDeselect}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="h-64 w-full">
                    <FootprintCardImage photoUrl={footprint.photoUrl} destinationTitle={footprint.destinationTitle} />
                </div>
                <div className="p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-extrabold text-gray-900">{footprint.destinationTitle}</h2>
                            <p className="text-md text-gray-500 mt-1">
                                {new Date(footprint.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button onClick={onDeselect} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-6 prose prose-lg max-w-none">
                        <p>{footprint.memo || '기록된 메모가 없습니다.'}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                        <button
                            onClick={() => onEdit(footprint.id, footprint)}
                            className="px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-all duration-200 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                            수정
                        </button>
                        <button
                            onClick={() => onDelete(footprint.id)}
                            className="px-6 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------
// 메인 페이지 컴포넌트
// ----------------------------------------------------------------

const MyFootprintsPage = () => {
    const [footprints, setFootprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFootprint, setSelectedFootprint] = useState(null);
    const { token } = useAuth();

    const fetchData = async () => {
        if (!token) {
            setLoading(false);
            setError({ message: '로그인이 필요합니다.' });
            return;
        }

        try {
            const footprintsData = await getFootprints();
            const sortedFootprints = footprintsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setFootprints(sortedFootprints);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleEditFootprint = async (id, currentData) => {
        const newMemo = prompt('새로운 메모를 입력하세요:', currentData.memo);
        if (newMemo === null) return;

        try {
            await updateFootprint(id, { ...currentData, memo: newMemo });
            alert('발자국이 수정되었습니다.');
            fetchData();
            setSelectedFootprint(prev => prev && { ...prev, memo: newMemo });
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
                setSelectedFootprint(null);
            } catch (err) {
                alert('발자국 삭제에 실패했습니다: ' + (err.message || err));
            }
        }
    };

    const handleSelectFootprint = (footprint) => {
        setSelectedFootprint(footprint);
    };

    const handleDeselectFootprint = () => {
        setSelectedFootprint(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-lg text-gray-600">발자국을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                <p>발자국을 불러오는데 실패했습니다.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                {/* 페이지 헤더 */}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">나의 발자국</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
                        여행의 모든 순간들을 되돌아보세요.
                    </p>
                </header>

                {footprints.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
                        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">아직 남긴 발자국이 없습니다</h3>
                        <p className="text-gray-600 mb-8">새로운 여행을 시작하고 소중한 추억을 기록해보세요.</p>
                        <button
                            onClick={() => window.location.href = '/custom'}
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                            여행 계획 세우기
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 통계 */}
                        <div className="mb-12">
                            <FootprintStats footprints={footprints} />
                        </div>

                        {/* 발자국 목록 */}
                        <div className="space-y-8">
                            {footprints.map((fp) => (
                                <FootprintCard
                                    key={fp.id}
                                    footprint={fp}
                                    onSelect={handleSelectFootprint}
                                    isSelected={selectedFootprint?.id === fp.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* 상세 정보 모달 */}
            <SelectedFootprintDetail
                footprint={selectedFootprint}
                onDeselect={handleDeselectFootprint}
                onEdit={handleEditFootprint}
                onDelete={handleDeleteFootprint}
            />
        </div>
    );
};

export default MyFootprintsPage;
