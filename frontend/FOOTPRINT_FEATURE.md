# 🗺️ 여행 발자국 남기기 기능

## 📖 기능 개요

'여행 발자국 남기기'는 사용자가 앱으로 계획한 여행지를 실제로 방문했을 때, 위치 인증을 통해 디지털 스탬프(발자국)를 찍어 기록하는 기능입니다. 이 기록들은 '나의 여행 지도'에 시각적으로 축적되어, 단순한 목록을 넘어선 나만의 아름다운 여행 역사를 만들어 줍니다.

## 🎯 주요 기능

### 1. 위치 기반 자동 인증
- **GPS 위치 감지**: 사용자의 현재 위치를 실시간으로 모니터링
- **지오펜스**: 목적지 반경 100m 내 진입 시 자동 알림
- **자동 발자국 버튼**: 위치 인증이 가능할 때 플로팅 버튼으로 표시

### 2. 다단계 인증 프로세스
1. **위치 인증**: GPS로 현재 위치 확인
2. **사진 촬영**: 방문한 장소의 사진 촬영 (선택사항)
3. **메모 작성**: 방문 소감이나 특별한 기억 기록
4. **인증 완료**: 성공 애니메이션과 함께 발자국 기록

### 3. 통계 대시보드
- **요약 통계**: 총 발자국, 방문한 도시, 월 평균 등
- **레벨 시스템**: 초보 여행자부터 전설의 여행가까지
- **차트 시각화**: 도시별/월별 방문 현황
- **진행률 표시**: 다음 레벨까지 필요한 발자국 수

## 🚀 사용자 경험 흐름

### 계획 단계
1. 사용자가 여행 계획을 세우고 일정에 장소 추가
2. 각 장소는 '방문 예정' 상태로 표시

### 방문 및 인증
1. 사용자가 목적지에 도착
2. 앱이 GPS로 위치를 감지하고 지오펜스 진입 확인
3. "발자국 남기기" 플로팅 버튼 자동 표시
4. 사용자가 버튼을 탭하여 인증 프로세스 시작

### 인증 완료
1. 위치 인증 성공
2. 사진 촬영 및 메모 작성
3. 발자국 생성 및 서버 저장
4. 성공 애니메이션 (confetti 효과)
5. 일정표에서 해당 장소 '방문 완료' 상태로 변경

### 시각화
1. '나의 발자국' 페이지에서 지도와 타임라인으로 확인
2. 통계 대시보드에서 여행 기록 분석
3. 레벨 업 및 성취감 제공

## 🛠️ 기술적 구현

### 핵심 컴포넌트

#### 1. `useLocationAuth` 훅
```javascript
const {
  currentLocation,
  isLocationEnabled,
  attemptLocationAuth,
  startLocationMonitoring,
  stopLocationMonitoring
} = useLocationAuth();
```

**주요 기능:**
- GPS 위치 가져오기
- 지오펜스 검증 (Haversine 공식 사용)
- 위치 모니터링 및 자동 감지
- 에러 처리 및 권한 관리

#### 2. `FootprintAuthModal` 컴포넌트
```javascript
<FootprintAuthModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  destination={currentDestination}
  itineraryId={itineraryId}
  onSuccess={handleFootprintCreated}
/>
```

**주요 기능:**
- 단계별 인증 프로세스 관리
- 카메라 접근 및 사진 촬영
- 메모 작성 및 데이터 제출
- 성공 애니메이션

#### 3. `FootprintFloatingButton` 컴포넌트
```javascript
<FootprintFloatingButton
  destinations={destinations}
  itineraryId={itineraryId}
  onFootprintCreated={handleFootprintCreated}
/>
```

**주요 기능:**
- 지오펜스 모니터링
- 자동 알림 및 버튼 표시
- 위치 기반 인증 유도

#### 4. `FootprintStats` 컴포넌트
```javascript
<FootprintStats footprints={footprints} />
```

**주요 기능:**
- 통계 데이터 계산 및 시각화
- Chart.js를 활용한 차트 렌더링
- 레벨 시스템 및 진행률 표시

### API 엔드포인트

#### 발자국 생성
```javascript
POST /api/footprints
{
  "itineraryId": "string",
  "destinationId": "string",
  "destinationTitle": "string",
  "memo": "string",
  "imageUrl": "string",
  "latitude": "number",
  "longitude": "number",
  "visitedAt": "ISO string"
}
```

#### 위치 인증
```javascript
POST /api/footprints/verify-location
{
  "destinationId": "string",
  "currentLat": "number",
  "currentLng": "number",
  "radius": "number"
}
```

#### 통계 조회
```javascript
GET /api/footprints/stats
```

### 데이터 구조

#### Footprint 모델
```javascript
{
  id: "string",
  itineraryId: "string",
  destinationId: "string",
  destinationTitle: "string",
  memo: "string",
  imageUrl: "string",
  latitude: "number",
  longitude: "number",
  visitedAt: "ISO string",
  createdAt: "ISO string",
  updatedAt: "ISO string"
}
```

## 🎨 UI/UX 특징

### 반응형 디자인
- 모바일 우선 설계
- 터치 친화적 인터페이스
- 다양한 화면 크기 지원

### 애니메이션 효과
- 플로팅 버튼 바운스 효과
- 성공 시 confetti 애니메이션
- 부드러운 전환 효과

### 시각적 피드백
- 단계별 진행 상황 표시
- 색상 코딩된 상태 표시
- 직관적인 아이콘 사용

## 🔒 보안 및 개인정보

### 위치 데이터 보호
- 사용자 동의 하에만 위치 접근
- 위치 데이터 암호화 저장
- 개인정보 처리방침 준수

### 권한 관리
- 카메라 접근 권한 요청
- 위치 서비스 권한 관리
- 명시적 사용자 동의

## 🚧 향후 확장 계획

### 기능 확장
- **AR 발자국**: 증강현실을 활용한 발자국 표시
- **소셜 기능**: 친구와 발자국 공유
- **챌린지 시스템**: 특정 장소 방문 미션
- **배지 시스템**: 다양한 성취 배지

### 기술 개선
- **오프라인 지원**: 네트워크 없이도 발자국 기록
- **백그라운드 모니터링**: 앱이 백그라운드에 있어도 위치 감지
- **머신러닝**: 사용자 패턴 기반 추천

### 플랫폼 확장
- **웹 버전**: 데스크톱에서도 발자국 관리
- **API 공개**: 서드파티 앱과의 연동
- **데이터 내보내기**: 여행 기록 백업 및 공유

## 📱 사용법

### 1. 위치 서비스 활성화
- 브라우저에서 위치 접근 권한 허용
- 모바일에서는 GPS 설정 확인

### 2. 여행 계획 세우기
- 일정에 방문할 장소 추가
- 각 장소의 정확한 위치 정보 확인

### 3. 발자국 남기기
- 목적지에 도착하면 자동으로 알림
- "발자국 남기기" 버튼 탭
- 단계별 인증 프로세스 진행

### 4. 기록 확인
- '나의 발자국' 페이지에서 지도와 타임라인 확인
- 통계 대시보드에서 여행 기록 분석

## 🐛 문제 해결

### 위치 인증 실패
- GPS 정확도 확인
- 인터넷 연결 상태 확인
- 브라우저 권한 설정 확인

### 카메라 접근 실패
- 카메라 권한 허용 확인
- HTTPS 환경에서 사용 (보안 정책)
- 다른 브라우저로 시도

### 데이터 동기화 문제
- 네트워크 연결 상태 확인
- 브라우저 새로고침
- 로그아웃 후 재로그인

## 📞 지원 및 문의

기능 사용 중 문제가 발생하거나 개선 제안이 있으시면 개발팀에 문의해 주세요.

---

**버전**: 1.0.0  
**최종 업데이트**: 2025년 1월  
**개발팀**: LifeOn 개발팀
