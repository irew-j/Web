import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const GuideChat = ({ destinationName, username }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);
    const messagesEndRef = useRef(null); // Add this line

    useEffect(() => {
        // 1. WebSocket 연결 설정
        const connect = () => {
            const stompClient = new Client({
                webSocketFactory: () => new SockJS('https://randomtripapp-byd3gsg8bhh2f6cx.koreacentral-01.azurewebsites.net/ws-guide'),
                reconnectDelay: 5000,
                debug: (str) => { console.log(new Date(), str); },
                onConnect: () => {
                    setIsConnected(true);
                    // 3. 특정 목적지의 토픽 구독
                    stompClient.subscribe(`/topic/public/${destinationName}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        // 백엔드에서 오는 메시지의 sender를 '여행 가이드'로 변경
                        if (receivedMessage.sender === 'Gemini Guide') {
                            receivedMessage.sender = '여행 가이드';
                        }
                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    });
                    // 4. 채팅방 입장 메시지 전송 (초기 가이드 요청)
                    stompClient.publish({
                        destination: '/app/guide.addUser',
                        body: JSON.stringify({
                            type: 'ENTER',
                            sender: username,
                            destinationName: destinationName,
                        }),
                    });
                    const onConnected = () => {
                        setStompClient(client);
                        client.subscribe('/user/' + username + '/queue/messages', onMessageReceived);
                        client.subscribe('/topic/public', onMessageReceived);
                        client.send('/app/chat.addUser', {}, JSON.stringify({ sender: username, type: 'JOIN' }));

                        // Simplified welcome message
                        setMessages([
                            {
                                sender: '여행 가이드',
                                content: '안녕하세요! 여행 계획을 도와드릴게요. 무엇이든 질문해주세요!',
                                type: 'TALK',
                                timestamp: new Date().toISOString()
                            }
                        ]);
                    };
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
        // 6. 컴포넌트 언마운트 시 연결 해제
        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate();
            }
        };
    }, [destinationName, username]);

    // Add this useEffect hook for auto-scrolling
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5. 메시지 전송 함수
    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && clientRef.current && isConnected) {
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

            // 사용자 메시지를 즉시 화면에 추가
            setMessages((prevMessages) => [...prevMessages, messageToSend]);
            setNewMessage('');
        }
    };

    return (
        <div className="guide-chat-container" style={{ maxWidth: 400, margin: '0 auto', border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fff' }}>
            <h3 style={{ marginBottom: 12 }}>여행 계획 실시간 가이드</h3>
            <div className="message-list" style={{ height: 240, overflowY: 'auto', background: '#f9f9f9', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.sender === '여행 가이드' ? 'guide-response' : 'user-request'}`}
                        style={{
                            marginBottom: 12, // Increased margin for better separation
                            textAlign: msg.sender === username ? 'right' : 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === username ? 'flex-end' : 'flex-start'
                        }}>
                        <strong style={{ color: msg.sender === '여행 가이드' ? '#0ea5e9' : '#333', marginBottom: 4 }}>{msg.sender === username ? '나' : msg.sender}:</strong>
                        <p style={{
                            display: 'inline-block',
                            margin: 0,
                            background: msg.sender === '여행 가이드' ? '#e0f2fe' : (msg.sender === username ? '#dcf8c6' : '#e5e7eb'),
                            borderRadius: 8,
                            padding: '10px 14px', // Increased padding
                            maxWidth: '80%',
                            wordBreak: 'break-word',
                            fontSize: '15px', // Slightly increased font size
                            lineHeight: '1.6' // Increased line height
                        }}>{msg.message}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* Add this line */}
            </div>
            <form onSubmit={sendMessage} className="message-form" style={{ display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? '가이드에게 질문해보세요...' : '연결 중입니다...'}
                    disabled={!isConnected}
                    style={{ flex: 1, border: '1px solid #ccc', borderRadius: 4, padding: 8 }}
                />
                <button type="submit" disabled={!isConnected || !newMessage.trim()} style={{ padding: '8px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 4, cursor: isConnected ? 'pointer' : 'not-allowed' }}>전송</button>
            </form>
        </div>
    );
};

export default GuideChat;
