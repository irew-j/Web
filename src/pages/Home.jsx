import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold">🏠 LifeOn - 1인 가구 맞춤 서비스</h2>
            <p className="mt-2 text-gray-700">맞춤형 복지 혜택을 확인하세요.</p>
            <Link to="/benefits">
                <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                    맞춤 혜택 확인하기
                </button>
            </Link>
        </div>
    );
}

export default Home;
