// import React, { useState } from 'react';

// function SignupPage({ onSignup }) {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [nickname, setNickname] = useState('');

//     const handleSubmit = () => {
//         console.log('회원가입 시도:', email, password, nickname);
//         onSignup();
//     };

//     return (
//         <div className="bg-white rounded shadow p-6 max-w-md mx-auto">
//             <h2 className="text-xl font-bold mb-4">회원가입</h2>
//             <input
//                 type="text"
//                 placeholder="닉네임"
//                 value={nickname}
//                 onChange={(e) => setNickname(e.target.value)}
//                 className="w-full mb-3 p-2 border rounded"
//             />
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
//                 className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
//             >
//                 가입하기
//             </button>
//         </div>
//     );
// }

// export default SignupPage;


// src/pages/Signup.jsx
import { useState } from 'react';
import axios from 'axios';

function Signup() {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/auth/signup', form);
            alert('회원가입 완료!');
        } catch (err) {
            alert(err.response?.data || '회원가입 실패');
        }
    };

    return (
        <div className="p-4">
            <h2>회원가입</h2>
            <input name="username" onChange={handleChange} placeholder="아이디" />
            <input name="email" onChange={handleChange} placeholder="이메일" />
            <input name="password" onChange={handleChange} type="password" placeholder="비밀번호" />
            <button onClick={handleSignup}>가입하기</button>
        </div>
    );
}

export default Signup;
