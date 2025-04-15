// src/components/Header.js
import React, { useState } from 'react';

function Header({ isLoggedIn, onLogout, onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-blue-500 text-white p-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold cursor-pointer" onClick={() => onNavigate('home')}>
                    🎲 랜덤 트립 제너레이터
                </h1>

                <div className="hidden md:flex gap-6 text-sm items-center">
                    <button onClick={() => onNavigate('home')} className="hover:text-yellow-300">홈</button>
                    <button onClick={() => onNavigate('history')} className="hover:text-yellow-300">여행 기록</button>
                    <button onClick={() => onNavigate('storybook')} className="hover:text-yellow-300">여행 스토리북</button>
                    {!isLoggedIn ? (
                        <>
                            <button onClick={() => onNavigate('login')} className="hover:text-yellow-300">로그인</button>
                            <button onClick={() => onNavigate('signup')} className="hover:text-yellow-300">회원가입</button>
                        </>
                    ) : (
                        <button onClick={onLogout} className="hover:text-yellow-300">로그아웃</button>
                    )}
                </div>

                <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>☰</button>
            </div>

            {isOpen && (
                <div className="md:hidden mt-2 space-y-2 text-sm">
                    <button onClick={() => onNavigate('home')} className="block text-white hover:text-yellow-300">홈</button>
                    <button onClick={() => onNavigate('history')} className="block text-white hover:text-yellow-300">여행 기록</button>
                    <button onClick={() => onNavigate('storybook')} className="block text-white hover:text-yellow-300">여행 스토리북</button>
                    {!isLoggedIn ? (
                        <>
                            <button onClick={() => onNavigate('login')} className="block text-white hover:text-yellow-300">로그인</button>
                            <button onClick={() => onNavigate('signup')} className="block text-white hover:text-yellow-300">회원가입</button>
                        </>
                    ) : (
                        <button onClick={onLogout} className="block text-white hover:text-yellow-300">로그아웃</button>
                    )}
                </div>
            )}
        </header>
    );
}

export default Header;
