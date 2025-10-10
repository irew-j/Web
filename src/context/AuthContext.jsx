import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            // 토큰이 만료되었는지 확인
            const decoded = jwtDecode(storedToken);
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('authToken');
                return null;
            }
            // 토큰이 유효하면 반환
            return storedToken;
        }
        return null;
    });

    const [username, setUsername] = useState(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub); // 'sub' 필드에 사용자 이름이 있다고 가정합니다.
            } catch (error) {
                console.error('토큰 디코딩 오류:', error);
                setUsername(null);
            }
        } else {
            setUsername(null);
        }
    }, [token]);

    // 토큰 만료 체크를 위한 인터벌 설정
    useEffect(() => {
        if (!token) return;

        const checkTokenExpiration = () => {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    setToken(null); // 토큰 만료 시 로그아웃 처리
                }
            } catch (error) {
                console.error('토큰 검증 오류:', error);
                setToken(null);
            }
        };

        // 1분마다 토큰 만료 확인
        const interval = setInterval(checkTokenExpiration, 60000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('authToken', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, setToken, username }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);