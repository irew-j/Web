import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <App />
  // </StrictMode>
)

window.addEventListener('unhandledrejection', function (event) {
  console.error('Unhandled Promise Rejection:', event.reason);
  // 사용자에게 안내 메시지 표시(예: 토스트)
  // 아래는 예시, 실제 토스트 라이브러리 사용 시 커스텀 가능
  // alert('알 수 없는 네트워크 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.');
});
