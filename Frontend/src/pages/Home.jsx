import React, { useEffect, useState } from 'react';
import api from '../api/axios'; 
import PostCard from '../components/PostCard';
import Footer from '../components/Footer'; 
import '../styles/Home.css';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/posts'); 
            setPosts(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке ленты:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    /**
     * handleFollowUpdate
     * @param {string} authorId - ID пользователя, на которого подписались/отписались
     * @param {Array} newFollowingList - Обновленный массив following из ответа бэкенда
     */
    const handleFollowUpdate = (authorId, newFollowingList) => {
        // 1. Получаем актуальный объект из хранилища
        const userStorage = JSON.parse(localStorage.getItem("user"));
        if (!userStorage) return;

        // 2. Обновляем список подписок в объекте (учитываем возможную вложенность .user)
        if (userStorage.user) {
            userStorage.user.following = newFollowingList;
        } else {
            userStorage.following = newFollowingList;
        }

        // 3. Сохраняем обновленные данные в localStorage
        localStorage.setItem("user", JSON.stringify(userStorage));

        // 4. Генерируем новый массив постов, чтобы React понял, что нужно перерисовать всё
        // Это заставит каждый PostCard пересчитать переменную isFollowing
        setPosts(prevPosts => [...prevPosts]);
    };

    if (loading) return <div className="loader">Загрузка...</div>;

    return (
        <div className="home-page">
            <div className="feed-container">
                {posts.length > 0 ? (
                    <>
                        {posts.map(post => (
                            <PostCard 
                                key={post._id} 
                                post={post} 
                                onFollowChange={handleFollowUpdate} 
                            />
                        ))}
                        
                        <div className="feed-end-wrapper">
                            <div className="feed-end-section">
                                <div className="check-icon-wrapper">
                                    <div className="check-circle">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#FF3040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                                <h3>You've seen all the updates</h3>
                                <p>You have viewed all new publications</p>
                            </div>
                            <Footer />
                        </div>
                    </>
                ) : (
                    <div className="feed-empty">
                        <p>Постов пока нет.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;