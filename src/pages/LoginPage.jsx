import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth"; // Import the login function
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setToken } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await login({ // Use the imported login function
                username,
                password,
            });
            setToken(response.token); // localStorage 대신 setToken 사용
            window.dispatchEvent(new Event('authChange'));
            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message || "로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-white to-blue-200">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
            >
                <h2 className="text-3xl font-bold text-center text-teal-700 mb-8">로그인</h2>
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">아이디</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                        required
                        autoFocus
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                        required
                    />
                </div>
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors text-lg"
                    disabled={loading}
                >
                    {loading ? "로그인 중..." : "로그인"}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;