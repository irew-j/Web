import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdown, setDropdown] = useState(false); // 드롭다운 상태
    const timeoutRef = useRef(null); // 닫기 지연을 관리할 ref

    // 마우스를 올리면 드롭다운을 표시
    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current); // 기존 타이머 제거 (닫히는 것 방지)
        }
        setDropdown(true);
    };

    // 마우스를 벗어나면 약간의 지연 후 닫기
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setDropdown(false);
        }, 200); // 200ms 지연 후 닫기
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center p-4">
                {/* 로고 */}
                <Link to="/" className="text-2xl font-bold text-blue-600">LifeOn</Link>

                {/* 데스크톱 네비게이션 */}
                <div className="hidden md:flex space-x-6">
                    {/* 복지 혜택 (드롭다운) */}
                    <div
                        className="relative group"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link to="/benefits" className="hover:text-blue-500 transition">복지 혜택</Link>

                        {/* 드롭다운 메뉴 */}
                        {dropdown && (
                            <div
                                className="absolute left-0 mt-2 w-48 bg-white text-gray-800 shadow-lg rounded-md"
                                onMouseEnter={handleMouseEnter}  // 내부에서도 유지
                                onMouseLeave={handleMouseLeave} // 벗어나면 닫기
                            >
                                <Link to="/benefits/housing" className="block px-4 py-2 hover:bg-gray-100">🏠 주거 지원</Link>
                                <Link to="/benefits/finance" className="block px-4 py-2 hover:bg-gray-100">💰 금융 지원</Link>
                            </div>
                        )}
                    </div>

                    <Link to="/trends" className="hover:text-blue-500 transition">트렌드</Link>
                    <Link to="/community" className="hover:text-blue-500 transition">커뮤니티</Link>
                    <Link to="/mypage" className="hover:text-blue-500 transition">마이페이지</Link>
                </div>

                {/* 로그인 버튼 */}
                <div className="hidden md:flex space-x-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition">로그인</button>
                    <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition">회원가입</button>
                </div>

                {/* 모바일 메뉴 버튼 */}
                <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* 모바일 메뉴 */}
            {menuOpen && (
                <div className="md:hidden bg-white p-4 shadow-md">
                    <div className="relative">
                        <button
                            onClick={() => setDropdown(!dropdown)}
                            className="block w-full text-left py-2 border-b"
                        >
                            복지 혜택
                        </button>
                        {dropdown && (
                            <div className="bg-white p-2 rounded shadow-md">
                                <Link to="/benefits/housing" className="block px-4 py-2 hover:bg-gray-100">🏠 주거 지원</Link>
                                <Link to="/benefits/finance" className="block px-4 py-2 hover:bg-gray-100">💰 금융 지원</Link>
                            </div>
                        )}
                    </div>
                    <Link to="/trends" className="block py-2 border-b">트렌드</Link>
                    <Link to="/community" className="block py-2 border-b">커뮤니티</Link>
                    <Link to="/mypage" className="block py-2">마이페이지</Link>
                    <div className="mt-4">
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition">로그인</button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
