import { useState } from "react";

const Benefits = () => {
    const [age, setAge] = useState("");
    const [income, setIncome] = useState("");
    const [region, setRegion] = useState("");
    const [recommendations, setRecommendations] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const dummyBenefits = [
            { id: 1, title: "청년 월세 지원", ageRange: "20-30", incomeLimit: "3000만원 이하" },
            { id: 2, title: "1인가구 긴급지원금", ageRange: "전 연령", incomeLimit: "4000만원 이하" },
        ];
        const filtered = dummyBenefits.filter(
            (benefit) =>
                (benefit.ageRange.includes(age) || benefit.ageRange === "전 연령") &&
                parseInt(income) < 4000
        );
        setRecommendations(filtered);
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold">🎯 맞춤 복지 혜택 추천</h2>
            <form className="mt-4 space-y-2" onSubmit={handleSubmit}>
                <input type="number" placeholder="나이 입력" className="border p-2 w-full" value={age} onChange={(e) => setAge(e.target.value)} />
                <input type="number" placeholder="연 소득 입력 (만원)" className="border p-2 w-full" value={income} onChange={(e) => setIncome(e.target.value)} />
                <button className="bg-blue-500 text-white px-4 py-2 rounded">추천받기</button>
            </form>
            <h3 className="mt-6 text-xl font-semibold">📋 추천 복지 혜택</h3>
            <ul>
                {recommendations.map((item) => (
                    <li key={item.id} className="mt-2 p-2 bg-gray-200 rounded">{item.title}</li>
                ))}
            </ul>
        </div>
    );
}

export default Benefits;
