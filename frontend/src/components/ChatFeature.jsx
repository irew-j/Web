import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import GuideChat from './GuideChat';

const ChatFeature = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const location = useLocation();

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    // 로그인 페이지에서는 채팅 버튼을 숨깁니다.
    const showChatButton = location.pathname !== '/login';

    return (
        <>
            {showChatButton && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-5 right-5 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    {isChatOpen ? '채팅 닫기' : '가이드와 채팅하기'}
                </button>
            )}

            {isChatOpen && showChatButton && (
                <div className="fixed bottom-20 right-5 z-50 shadow-xl rounded-lg overflow-hidden w-96">
                    <GuideChat destinationName="TravelGuideChat" username="User" />
                </div>
            )}
        </>
    );
};

export default ChatFeature;