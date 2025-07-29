"use client"

import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = ({ query, setQuery, onSearch, className = "" }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch();
    };

    const clearQuery = () => {
        setQuery("");
    };

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <div
                    className={`relative flex items-center transition-all duration-300 ${isFocused
                        ? "shadow-2xl scale-[1.03] border-blue-400"
                        : "shadow-lg hover:shadow-2xl border-gray-200"
                        } border-2 bg-white rounded-full`}
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="여행지와 키워드를 입력하세요 (예: 제주도 카페투어)"
                        className="w-full px-7 py-5 text-xl rounded-full bg-transparent border-none focus:ring-0 focus:outline-none transition-all duration-300 pr-16 placeholder-gray-400"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearQuery}
                            className="absolute right-20 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <FaTimes className="h-6 w-6" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="absolute right-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white p-4 rounded-full hover:opacity-90 transition-all duration-200 shadow-md hover:scale-105"
                    >
                        <FaSearch className="h-6 w-6" />
                    </button>
                </div>
            </form>
            <div className="mt-5 text-center text-base text-gray-400 font-medium">

                <p>예시: 제주도 카페투어, 부산 맛집투어, 강원도 스키장</p>
            </div>
        </div>
    );
};

export default SearchBar;
