"use client"

import { FaGithub, FaTwitter, FaInstagram, FaDice } from "react-icons/fa"

const Footer = () => {
    return (
        <footer className="bg-gradient-to-t from-blue-50 via-white to-white border-t border-gray-200 shadow-inner mt-16">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* 브랜드 섹션 */}
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="flex items-center text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent mb-5 gap-2 tracking-tight drop-shadow">
                            <FaDice className="text-teal-500 text-3xl" />
                            TripLovers
                        </h2>
                        <p className="text-gray-600 mb-6 text-lg font-medium">
                            당신만의 특별한 여행을 찾아보세요. 맞춤형 여행 추천과 일정 관리를 통해 더 나은 여행 경험을 제공합니다.
                        </p>
                        <div className="flex space-x-5 mt-4">
                            <a
                                href="#"
                                className="text-gray-400 hover:text-teal-500 transition-colors duration-200 hover:scale-110"
                            >
                                <FaGithub className="h-7 w-7" />
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-teal-500 transition-colors duration-200 hover:scale-110"
                            >
                                <FaTwitter className="h-7 w-7" />
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-teal-500 transition-colors duration-200 hover:scale-110"
                            >
                                <FaInstagram className="h-7 w-7" />
                            </a>
                        </div>
                    </div>

                    {/* 링크 섹션 */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-5 text-lg">서비스</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    여행 검색
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    여행 일정
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    랜덤 여행
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 연락처 섹션 */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-5 text-lg">문의하기</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:contact@triplovers.com"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    contact@triplovers.com
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    자주 묻는 질문
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-600 hover:text-teal-500 transition-colors duration-200 text-base"
                                >
                                    이용약관
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500 text-base">
                    <p>&copy; 2024 TripLovers. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
