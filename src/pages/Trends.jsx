import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Trends = () => {
    // 더미 데이터 (1인 가구 증가 트렌드)
    const data = {
        labels: ["2015", "2017", "2019", "2021", "2023"],
        datasets: [
            {
                label: "1인 가구 수 (천 명)",
                data: [5200, 5500, 5800, 6200, 6700],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
        ],
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold">📊 1인 가구 트렌드</h2>
            <p className="text-gray-700 mt-2">최근 몇 년간 1인 가구 수 증가 현황</p>
            <div className="mt-6">
                <Bar data={data} />
            </div>
        </div>
    );
}

export default Trends;
