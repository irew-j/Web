// src/pages/TripHistoryPage.js

import React from 'react';

const mockTrips = [
    {
        id: 1,
        location: '춘천',
        date: '2025-03-24',
        keywords: ['감성', '호수', '힐링'],
        memo: '춘천 남이섬에서 봄바람 맞으며 힐링한 하루 🌸',
        imageUrl: 'https://source.unsplash.com/400x250/?lake,spring',
    },
    {
        id: 2,
        location: '전주',
        date: '2025-02-17',
        keywords: ['전통', '한옥', '먹방'],
        memo: '전주 한옥마을의 감성과 전주비빔밥이 최고였어!',
        imageUrl: 'https://source.unsplash.com/400x250/?hanok,korea',
    },
];

function TripHistoryPage() {
    return (
        <div className="max-w-5xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">📖 나의 여행 기록</h2>

            <div className="grid md:grid-cols-2 gap-6">
                {mockTrips.map((trip) => (
                    <div key={trip.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                        <img src={trip.imageUrl} alt="trip preview" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span>{trip.date}</span>
                                <span>{trip.location}</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{trip.keywords.join(', ')}</h3>
                            <p className="text-gray-700 text-sm">{trip.memo}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TripHistoryPage;
