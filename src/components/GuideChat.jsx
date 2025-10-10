import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getGuideByLocation } from '../api/tour'; // getGuideByLocation 함수 임포트
import { useWeather } from '../hooks/useWeather'; // useWeather 훅 임포트
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiShowers, WiSleet, WiSprinkle, WiRainMix, WiSnowWind, WiDayCloudy } from 'react-icons/wi';

const iconMap = {
    WiDaySunny,
    WiCloudy,
    WiRain,
    WiSnow,
    WiShowers,
    WiSleet,
    WiSprinkle,
    WiRainMix,
    WiSnowWind,
    WiDayCloudy
};

const GuideChat = ({ destinationName, username, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null); // 사용자 위치 상태 추가
    const [locationError, setLocationError] = useState(null); // 위치 에러 상태 추가

    // useWeather 훅 사용
    const { weather, loading: weatherLoading, error: weatherError } = useWeather(userLocation);

    useEffect(() => {


        const connect = () => {
            const stompClient = new Client({
                webSocketFactory: () => new SockJS('https://randomtripapp-byd3gsg8bhh2f6cx.koreacentral-01.azurewebsites.net/ws-guide'),
                reconnectDelay: 5000,
                debug: (str) => { console.log(new Date(), str); },
                onConnect: () => {
                    setIsConnected(true);
                    stompClient.subscribe(`/topic/public/${destinationName}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);

                        if (receivedMessage.sender === 'Gemini Guide') {
                            receivedMessage.sender = '여행 가이드';
                        }

                        // Standardize message property
                        if (receivedMessage.content && !receivedMessage.message) {
                            receivedMessage.message = receivedMessage.content;
                        }

                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });

                    stompClient.publish({
                        destination: '/app/guide.addUser',
                        body: JSON.stringify({
                            type: 'ENTER',
                            sender: username,
                            destinationName: destinationName,
                        }),
                    });
                },
                onDisconnect: () => {
                    setIsConnected(false);
                },
                onStompError: (frame) => {
                    console.error('STOMP Error:', frame);
                },
            });
            stompClient.activate();
            clientRef.current = stompClient;
        };

        connect();

        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate();
            }
        };
    }, [destinationName, username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // 사용자 위치 가져오는 함수
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                    setLocationError(null);
                },
                (error) => {
                    console.error("위치 정보를 가져오는 데 실패했습니다:", error);
                    setLocationError("위치 정보를 가져올 수 없습니다. 위치 권한을 허용해주세요.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLocationError("이 브라우저에서는 위치 정보가 지원되지 않습니다.");
        }
    };

    // 컴포넌트 마운트 시 위치 정보 요청
    useEffect(() => {
        getUserLocation();
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && clientRef.current && isConnected) {
            // '날씨 알려줘' 메시지 감지
            if (newMessage.trim() === '날씨 알려줘') {
                requestWeatherInfo(); // 날씨 정보 요청 함수 호출
                setNewMessage(''); // 메시지 입력창 비우기
                return; // 일반 메시지 전송 로직 건너뛰기
            }

            const messageToSend = {
                type: 'TALK',
                sender: username,
                destinationName: destinationName,
                message: newMessage,
            };

            clientRef.current.publish({
                destination: '/app/guide.sendMessage',
                body: JSON.stringify(messageToSend),
            });

            setMessages((prevMessages) => [...prevMessages, messageToSend]);
            setNewMessage('');
        }
    };

    // 현재 위치 기반 가이드 요청 함수
    const requestLocationGuide = async () => {
        if (!userLocation) {
            setLocationError("위치 정보를 먼저 가져와야 합니다.");
            return;
        }

        try {
            const guideResponse = await getGuideByLocation(userLocation);
            console.log("가이드 응답:", guideResponse); // 이 부분은 확인용으로 그대로 두셔도 됩니다.

            const guideMessage = {
                sender: '여행 가이드', // 또는 'Gemini Guide'
                message: guideResponse.guide || "현재 위치 기반 가이드 정보를 받았습니다.", // 이 부분을 수정합니다.
                type: 'TALK',
            };
            setMessages((prevMessages) => [...prevMessages, guideMessage]);
        } catch (error) {
            console.error("위치 기반 가이드 요청 실패:", error);
            const errorMessage = {
                sender: '시스템',
                message: "위치 기반 가이드 정보를 가져오는 데 실패했습니다.",
                type: 'ERROR',
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
    };

    // 날씨 정보 요청 함수 추가
    const requestWeatherInfo = () => {
        if (!userLocation) {
            setLocationError("위치 정보를 먼저 가져와야 날씨 정보를 요청할 수 있습니다.");
            return;
        }
        if (weatherLoading) {
            const loadingMessage = {
                sender: '시스템',
                message: "날씨 정보를 불러오는 중입니다...",
                type: 'INFO',
            };
            setMessages((prevMessages) => [...prevMessages, loadingMessage]);
            return;
        }
        if (weatherError) {
            const errorMessage = {
                sender: '시스템',
                message: `날씨 정보를 가져오는 데 실패했습니다: ${weatherError}`,
                type: 'ERROR',
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
            return;
        }
        if (weather) {
            const weatherMessage = {
                sender: '날씨 정보',
                type: 'WEATHER_INFO',
                temp: weather.temp,
                description: weather.description,
                humidity: weather.humidity,
                wind: weather.wind,
                precipitation: weather.precipitation,
                icon: weather.icon,
            };
            setMessages((prevMessages) => [...prevMessages, weatherMessage]);
        } else {
            const noWeatherMessage = {
                sender: '시스템',
                message: "현재 날씨 정보를 사용할 수 없습니다.",
                type: 'INFO',
            };
            setMessages((prevMessages) => [...prevMessages, noWeatherMessage]);
        }
    };


    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto bg-white shadow-lg rounded-lg">
            <div className="bg-blue-500 text-white p-4 rounded-t-lg flex-shrink-0">
                <h3 className="text-lg font-semibold text-center">여행 계획 실시간 가이드</h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end my-3 ${msg.sender === username ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender !== username && msg.sender !== '시스템' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 4 0 00-7 7h14a7 4 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                        <div className={`p-3 rounded-lg max-w-xs lg:max-w-md shadow-sm ${msg.sender === username ? 'bg-blue-500 text-white' : msg.sender === '시스템' ? 'bg-red-100 text-red-800' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-sm font-semibold mb-1 ${msg.sender === username ? 'text-right text-blue-100' : msg.sender === '시스템' ? 'text-red-600' : 'text-gray-600'}`}>{msg.sender === username ? '나' : msg.sender}</p>
                            {msg.type === 'WEATHER_INFO' ? (
                                <div className="flex items-center bg-blue-100 p-3 rounded-lg">
                                    {msg.icon && React.createElement(iconMap[msg.icon], { className: "w-16 h-16 mr-4" })}
                                    <div>
                                        <p className="text-xl font-bold text-blue-800">{msg.temp}°C</p>
                                        <p className="text-md text-gray-700">{msg.description}</p>
                                        <div className="text-sm text-gray-600 mt-2">
                                            <p>습도: {msg.humidity}%</p>
                                            <p>바람: {msg.wind} m/s</p>
                                            <p>강수량: {msg.precipitation} mm</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-md whitespace-pre-wrap leading-relaxed break-words">
                                    {msg.message || msg.content}
                                </p>
                            )}
                        </div>
                        {msg.sender === username && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ml-3">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 4 0 00-7 7h14a7 4 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
                {locationError && (
                    <div className="text-center text-red-500 text-sm my-2">
                        {locationError}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg flex-shrink-0">
                <form onSubmit={sendMessage} className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? '가이드에게 질문해보세요...' : '연결 중입니다...'}
                        disabled={!isConnected}
                        className="flex-grow p-3 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim()}
                        className="px-6 py-3 bg-blue-500 text-white rounded-r-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                    >
                        전송
                    </button>
                </form>
                <button
                    onClick={requestLocationGuide}
                    disabled={!isConnected || !userLocation}
                    className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-green-300 transition-colors"
                >
                    현재 위치 기반 가이드 요청
                </button>
                {/* 날씨 정보 요청 버튼은 이제 필요 없으므로 제거하거나 주석 처리 */}
                {/* <button
                    onClick={requestWeatherInfo}
                    disabled={!isConnected || !userLocation || weatherLoading}
                    className="mt-2 w-full px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 disabled:bg-yellow-300 transition-colors"
                >
                    날씨 정보 요청
                </button> */}
            </div>
        </div>
    );
};

export default GuideChat;

