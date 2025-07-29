"use client"

import { useState, useEffect } from "react"
import { FaBars, FaTimes, FaDice, FaSearch, FaRandom } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth"; // Import the logout function
import { useAuth } from "../context/AuthContext";

const Header = ({ className = "" }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { token, setToken } = useAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);

    useEffect(() => {
        const updateLoginStatus = () => setIsLoggedIn(!!token);
        updateLoginStatus();
        window.addEventListener("authChange", updateLoginStatus);
        return () => {
            window.removeEventListener("authChange", updateLoginStatus);
        };
    }, [token]);
    const navigate = useNavigate();

    useEffect(() => {
        const updateLoginStatus = () => setIsLoggedIn(!!localStorage.getItem("authToken"));
        updateLoginStatus(); // 초기 상태 설정
        window.addEventListener("storage", updateLoginStatus);
        window.addEventListener("authChange", updateLoginStatus); // 추가: 커스텀 이벤트 감지
        return () => {
            window.removeEventListener("storage", updateLoginStatus);
            window.removeEventListener("authChange", updateLoginStatus);
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const handleLogout = async () => {
        try {
            await logout(token); // auth.js와 연동
            setToken(null);
            window.dispatchEvent(new Event('authChange'));
            setIsLoggedIn(false);
            alert("로그아웃 되었습니다.");
            navigate("/");
        } catch (err) {
            alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    return (
        <header className={`backdrop-blur-md bg-white/80 shadow-lg border-b border-gray-100 ${className} transition-all duration-300`}>
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* 로고 */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/"
                            className="flex items-center text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity gap-2 tracking-tight drop-shadow"
                        >
                            <FaDice className="text-teal-500 text-3xl" />
                            TripLovers
                        </Link>
                    </div>

                    {/* 데스크톱 메뉴 */}
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex space-x-10">
                            <Link
                                to="/"
                                className="flex items-center text-gray-700 hover:text-teal-600 font-semibold text-lg transition-colors duration-200 gap-2 px-3 py-2 rounded-full hover:bg-teal-50"
                            >
                                <FaSearch className="text-base" />
                                여행 검색
                            </Link>
                            <Link
                                to="/custom"
                                className="flex items-center text-gray-700 hover:text-teal-600 font-semibold text-lg transition-colors duration-200 gap-2 px-3 py-2 rounded-full hover:bg-teal-50"
                            >
                                <FaDice className="text-base" />
                                여행 일정
                            </Link>
                            <Link
                                to="/random"
                                className="flex items-center text-gray-700 hover:text-teal-600 font-semibold text-lg transition-colors duration-200 gap-2 px-3 py-2 rounded-full hover:bg-teal-50"
                            >
                                <FaRandom className="text-base" />
                                랜덤 여행
                            </Link>
                        </nav>
                        {/* 로그인/로그아웃 버튼 */}
                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-5 py-2 rounded-full bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition-colors"
                            >
                                로그아웃
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/login")}
                                className="ml-4 px-5 py-2 rounded-full bg-white text-teal-600 border border-teal-400 font-semibold shadow hover:bg-teal-50 transition-colors"
                            >
                                로그인
                            </button>
                        )}
                    </div>

                    {/* 모바일 메뉴 버튼 */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-700 hover:text-teal-600 focus:outline-none p-2 rounded-full border border-gray-200 bg-white shadow-sm"
                        >
                            {isMenuOpen ? (
                                <FaTimes className="h-7 w-7" />
                            ) : (
                                <FaBars className="h-7 w-7" />
                            )}
                        </button>
                    </div>
                </div>

                {/* 모바일 메뉴 */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-4 pt-4 pb-6 space-y-2 bg-white rounded-2xl shadow-2xl mt-3 border border-gray-100 animate-fade-in">
                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-semibold text-lg gap-2 transition-colors duration-200"
                            >
                                <FaSearch className="text-base" />
                                여행 검색
                            </Link>
                            <Link
                                to="/custom"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-semibold text-lg gap-2 transition-colors duration-200"
                            >
                                <FaDice className="text-base" />
                                여행 일정
                            </Link>
                            <Link
                                to="/random"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-semibold text-lg gap-2 transition-colors duration-200"
                            >
                                <FaRandom className="text-base" />
                                랜덤 여행
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
