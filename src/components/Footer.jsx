const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-6 mt-10">
            <div className="container mx-auto text-center">
                <p className="text-sm">&copy; 2024 LifeOn. All Rights Reserved.</p>
                <nav className="mt-2">
                    <a href="/" className="text-gray-400 hover:text-white mx-2">홈</a>|
                    <a href="/benefits" className="text-gray-400 hover:text-white mx-2">복지 혜택</a>|
                    <a href="/trends" className="text-gray-400 hover:text-white mx-2">트렌드</a>|
                    <a href="/community" className="text-gray-400 hover:text-white mx-2">커뮤니티</a>|
                    <a href="/mypage" className="text-gray-400 hover:text-white mx-2">마이페이지</a>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
