import React from 'react';

function SearchBar({ location, setLocation, keyword, setKeyword, onSearch }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex flex-col sm:flex-row sm:gap-4">
                <input
                    type="text"
                    placeholder="지역을 입력하세요"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="p-2 border rounded w-full mb-2 sm:mb-0"
                />
                <input
                    type="text"
                    placeholder="키워드 (힐링, 혼자 등)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="p-2 border rounded w-full"
                />
            </div>
            <button
                onClick={onSearch}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-6 py-2 rounded"
            >
                오늘의 랜덤 여행 추천
            </button>
        </div>
    );
}

export default SearchBar;
