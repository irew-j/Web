"use client"

import { useState } from "react"
import { FaBars, FaTimes, FaDice, FaSearch, FaRandom } from "react-icons/fa"
import { Link } from "react-router-dom";

const Header = ({ className = "" }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

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
