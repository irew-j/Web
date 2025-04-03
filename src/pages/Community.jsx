import { useState } from "react";

const Community = () => {
    const [posts, setPosts] = useState([
        { id: 1, author: "사용자1", content: "1인 가구에게 좋은 정부 지원 있나요?" },
        { id: 2, author: "사용자2", content: "서울에서 공공 임대주택 신청하려면 어떻게 해야 하나요?" },
    ]);
    const [newPost, setNewPost] = useState("");

    const handlePostSubmit = () => {
        if (newPost.trim() !== "") {
            setPosts([{ id: posts.length + 1, author: "나", content: newPost }, ...posts]);
            setNewPost("");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold">🗣️ 1인 가구 커뮤니티</h2>
            <div className="mt-4 space-y-4">
                <input
                    type="text"
                    placeholder="게시글 작성..."
                    className="border p-2 w-full"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handlePostSubmit}>
                    게시하기
                </button>
            </div>
            <ul className="mt-6">
                {posts.map((post) => (
                    <li key={post.id} className="mt-2 p-2 bg-gray-200 rounded">
                        <strong>{post.author}</strong>: {post.content}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Community;
