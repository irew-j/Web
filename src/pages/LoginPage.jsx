// import React, { useState } from 'react';

// function LoginPage({ onLogin }) {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');

//     const handleSubmit = () => {
//         console.log('로그인 시도:', email, password);
//         onLogin();
//     };

//     return (
//         <div className="bg-white rounded shadow p-6 max-w-md mx-auto">
//             <h2 className="text-xl font-bold mb-4">로그인</h2>
//             <input
//                 type="email"
//                 placeholder="이메일"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full mb-3 p-2 border rounded"
//             />
//             <input
//                 type="password"
//                 placeholder="비밀번호"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full mb-4 p-2 border rounded"
//             />
//             <button
//                 onClick={handleSubmit}
//                 className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
//             >
//                 로그인
//             </button>
//         </div>
//     );
// }

// export default LoginPage;


// src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/auth/login', {
                username,
                password,
            });
            localStorage.setItem('token', res.data.token); // 토큰 저장
            alert('로그인 성공');
        } catch (err) {
            alert('로그인 실패');
        }
    };

    return (
        <div className="p-4">
            <h2>로그인</h2>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ID" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="PW" />
            <button onClick={handleLogin}>로그인</button>
        </div>
    );
}

export default Login;
