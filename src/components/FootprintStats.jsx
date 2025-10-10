import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const FootprintStats = ({ footprints }) => {
  // 통계 데이터 계산
  const stats = useMemo(() => {
    if (!footprints || footprints.length === 0) {
      return {
        totalFootprints: 0,
        totalCities: 0,
        totalCountries: 0,
        averagePerMonth: 0,
        mostVisitedCity: null,
        mostVisitedMonth: null,
        level: '초보 여행자',
        levelProgress: 0,
        cityStats: [],
        monthlyStats: []
      };
    }

    // 도시별 방문 횟수
    const cityCounts = {};
    const monthCounts = {};
    
    footprints.forEach(fp => {
      // 도시명 추출 (destinationTitle에서)
      const cityName = fp.destinationTitle?.split(',')[0]?.trim() || '알 수 없는 도시';
      cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
      
      // 월별 방문 횟수
      const visitDate = new Date(fp.visitedAt || fp.createdAt);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // 가장 많이 방문한 도시
    const mostVisitedCity = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // 가장 많이 방문한 월
    const mostVisitedMonth = Object.entries(monthCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // 레벨 계산
    const totalFootprints = footprints.length;
    let level = '초보 여행자';
    let levelProgress = 0;
    
    if (totalFootprints >= 50) {
      level = '전설의 여행가';
      levelProgress = 100;
    } else if (totalFootprints >= 30) {
      level = '마스터 여행가';
      levelProgress = (totalFootprints - 30) / 20 * 100;
    } else if (totalFootprints >= 20) {
      level = '숙련된 여행가';
      levelProgress = (totalFootprints - 20) / 10 * 100;
    } else if (totalFootprints >= 10) {
      level = '경험 있는 여행가';
      levelProgress = (totalFootprints - 10) / 10 * 100;
    } else if (totalFootprints >= 5) {
      level = '여행 애호가';
      levelProgress = (totalFootprints - 5) / 5 * 100;
    } else {
      level = '초보 여행자';
      levelProgress = totalFootprints / 5 * 100;
    }

    // 도시별 통계 (상위 5개)
    const cityStats = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    // 월별 통계 (최근 12개월)
    const monthlyStats = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    return {
      totalFootprints,
      totalCities: Object.keys(cityCounts).length,
      totalCountries: 1, // 현재는 한국만 지원
      averagePerMonth: totalFootprints / Math.max(1, Object.keys(monthCounts).length),
      mostVisitedCity: mostVisitedCity ? { name: mostVisitedCity[0], count: mostVisitedCity[1] } : null,
      mostVisitedMonth: mostVisitedMonth ? { month: mostVisitedMonth[0], count: mostVisitedMonth[1] } : null,
      level,
      levelProgress: Math.min(100, levelProgress),
      cityStats,
      monthlyStats
    };
  }, [footprints]);

  // 도넛 차트 데이터
  const cityChartData = {
    labels: stats.cityStats.map(item => item.city),
    datasets: [{
      data: stats.cityStats.map(item => item.count),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // 바 차트 데이터
  const monthlyChartData = {
    labels: stats.monthlyStats.map(item => {
      const [year, month] = item.month.split('-');
      return `${year}년 ${month}월`;
    }),
    datasets: [{
      label: '방문 횟수',
      data: stats.monthlyStats.map(item => item.count),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  if (!footprints || footprints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">아직 발자국이 없습니다</h3>
        <p className="text-gray-500">여행을 떠나 발자국을 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">총 발자국</p>
              <p className="text-2xl font-bold">{stats.totalFootprints}</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">방문한 도시</p>
              <p className="text-2xl font-bold">{stats.totalCities}</p>
            </div>
            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">월 평균</p>
              <p className="text-2xl font-bold">{stats.averagePerMonth.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">레벨</p>
              <p className="text-lg font-bold">{stats.level}</p>
            </div>
            <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 레벨 진행률 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">여행자 레벨</h3>
        <div className="mb-2">
          <span className="text-sm text-gray-600">{stats.level}</span>
          <span className="float-right text-sm text-gray-600">{Math.round(stats.levelProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.levelProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          다음 레벨까지 {Math.max(0, 5 - (stats.totalFootprints % 5))}개의 발자국이 더 필요합니다
        </p>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 도시별 방문 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">도시별 방문 현황</h3>
          {stats.cityStats.length > 0 ? (
            <div className="h-64">
              <Doughnut 
                data={cityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
          )}
        </div>

        {/* 월별 방문 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">월별 방문 현황</h3>
          {stats.monthlyStats.length > 0 ? (
            <div className="h-64">
              <Bar 
                data={monthlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
          )}
        </div>
      </div>

      {/* 주요 통계 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">주요 통계</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.mostVisitedCity && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">가장 많이 방문한 도시</h4>
              <p className="text-2xl font-bold text-blue-600">{stats.mostVisitedCity.name}</p>
              <p className="text-sm text-blue-600">{stats.mostVisitedCity.count}회 방문</p>
            </div>
          )}
          
          {stats.mostVisitedMonth && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">가장 활발한 달</h4>
              <p className="text-2xl font-bold text-green-600">
                {stats.mostVisitedMonth.month.split('-')[1]}월
              </p>
              <p className="text-sm text-green-600">{stats.mostVisitedMonth.count}회 방문</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FootprintStats;
