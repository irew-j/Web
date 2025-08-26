import React, { useState, useRef, useEffect } from 'react';
import { useLocationAuth } from '../hooks/useLocationAuth';
import { createFootprint, getSasUrl, uploadImageToBlob } from '../api/footprints';
import confetti from 'canvas-confetti';

const FootprintAuthModal = ({
  isOpen,
  onClose,
  destination,
  itineraryId,
  onSuccess
}) => {
  const [step, setStep] = useState('location'); // location, photo, memo, success
  const [photo, setPhoto] = useState(null);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authResult, setAuthResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const {
    currentLocation,
    isLocationEnabled,
    locationError,
    isAuthenticating,
    attemptLocationAuth,
    getCurrentLocation
  } = useLocationAuth();

  // 카메라 스트림 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('카메라 접근 실패:', error);
    }
  };

  // 카메라 스트림 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 사진 촬영
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        setPhoto(blob);
        stopCamera();
        setStep('memo');
      }, 'image/jpeg', 0.8);
    }
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
      setStep('memo');
    }
  };

  // 위치 인증 시도
  const handleLocationAuth = async () => {
    const lat = destination?.latitude || destination?.mapy;
    const lon = destination?.longitude || destination?.mapx;

    if (!lat || !lon) {
      alert('목적지 위치 정보가 없습니다.');
      return;
    }

    try {
      const result = await attemptLocationAuth(
        lat,
        lon,
        100 // 100m 반경
      );

      if (result.success) {
        setAuthResult(result);
        setStep('photo');
        startCamera();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('위치 인증 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 발자국 생성 및 제출
  const handleSubmit = async () => {
    if (!authResult?.success) {
      alert('위치 인증이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 이미지 업로드 처리
      let photoUrl = null;
      if (photo) {
        try {
          // Base64로 이미지 변환
          const reader = new FileReader();
          photoUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(photo);
          });
        } catch (uploadError) {
          console.error('이미지 변환 실패:', uploadError);
          // 이미지 변환 실패 시에도 발자국은 생성
        }
      }

      const footprintData = {
        itineraryId,
        destinationId: destination.id,
        destinationTitle: destination.name || destination.title,
        memo: memo || `${destination.name || destination.title} 방문 완료!`,
        photoUrl, // imageUrl 대신 photoUrl 사용
        latitude: authResult.location.latitude,
        longitude: authResult.location.longitude,
        visitedAt: new Date().toISOString()
      };

      const newFootprint = await createFootprint(footprintData);

      // 성공 애니메이션
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setStep('success');
      onSuccess?.(newFootprint);

      // 3초 후 자동으로 닫기
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      alert('발자국 생성에 실패했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 시 정리
  const handleClose = () => {
    stopCamera();
    setStep('location');
    setPhoto(null);
    setMemo('');
    setAuthResult(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen && step === 'photo') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {destination?.name} 발자국 남기기
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 위치 인증 단계 */}
        {step === 'location' && (
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">위치 인증</h3>
              <p className="text-gray-600 mb-4">
                {destination?.name}에 실제로 방문하셨나요?<br />
                GPS로 위치를 확인해드립니다.
              </p>
            </div>

            {locationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {locationError}
              </div>
            )}

            <button
              onClick={handleLocationAuth}
              disabled={isAuthenticating}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {isAuthenticating ? '위치 확인 중...' : '위치 인증하기'}
            </button>

            {!isLocationEnabled && (
              <p className="text-sm text-gray-500 text-center mt-4">
                위치 서비스 권한이 필요합니다.
              </p>
            )}
          </div>
        )}

        {/* 사진 촬영/업로드 단계 */}
        {step === 'photo' && (
          <div className="p-4 text-center">
            <h3 className="text-lg font-semibold mb-2">사진 촬영 또는 업로드</h3>
            <p className="text-gray-600 mb-4">방문 인증을 위한 사진을 촬영하거나 업로드해주세요.</p>
            <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              {photo && (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={takePhoto}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>사진 촬영</span>
              </button>
              <label htmlFor="file-upload"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>사진 업로드</span>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={handleClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 메모 단계 */}
        {step === 'memo' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-center">메모 남기기</h3>
            <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
              {photo && (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <textarea
              className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="이곳에서의 경험을 기록해주세요..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            ></textarea>
            <div className="flex space-x-2">
              <button
                onClick={() => setStep('photo')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '발자국 남기기'}
              </button>
            </div>
          </div>
        )}

        {/* 성공 단계 */}
        {step === 'success' && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">발자국이 성공적으로 기록되었습니다!</h3>
            <p className="text-gray-600 mb-4">잠시 후 모달이 자동으로 닫힙니다.</p>
            <button
              onClick={handleClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootprintAuthModal;
