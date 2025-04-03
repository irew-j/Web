import { useState } from "react";

const MyPage = () => {
    const [userInfo, setUserInfo] = useState({
        age: "",
        income: "",
        region: "",
    });
    const [savedBenefits, setSavedBenefits] = useState(["청년 월세 지원", "1인 가구 긴급지원금"]);

    const handleChange = (e) => {
        setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold">👤 마이페이지</h2>
            <div className="mt-4">
                <h3 className="text-lg font-semibold">내 정보</h3>
                <input type="number" name="age" placeholder="나이" className="border p-2 w-full mt-2" value={userInfo.age} onChange={handleChange} />
                <input type="number" name="income" placeholder="연 소득 (만원)" className="border p-2 w-full mt-2" value={userInfo.income} onChange={handleChange} />
                <input type="text" name="region" placeholder="지역" className="border p-2 w-full mt-2" value={userInfo.region} onChange={handleChange} />
            </div>
            <div className="mt-6">
                <h3 className="text-lg font-semibold">📌 관심 있는 복지 혜택</h3>
                <ul>
                    {savedBenefits.map((benefit, index) => (
                        <li key={index} className="mt-2 p-2 bg-gray-200 rounded">{benefit}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MyPage;
