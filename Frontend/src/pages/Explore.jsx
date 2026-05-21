import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { IoHeartSharp, IoChatbubbleSharp } from "react-icons/io5";
import Footer from '../components/Footer'; 
import noImage from "../assets/noimage.jpg";
import '../styles/Explore.css';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем текущего пользователя для отображения состояния лайка
  const userStorage = localStorage.getItem("user");
  const userData = userStorage ? JSON.parse(userStorage) : null;
  const currentUserId = userData?.user?._id || userData?._id;

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const response = await api.get('/posts/explore');
        setPosts(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, []);

  const getFileUrl = (path) => {
    if (!path || path === "undefined" || path === "" || typeof path !== "string") return noImage;
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // ЛАЙК: ставим лайк прямо из сетки
  const handleLike = async (e, postId) => {
    e.stopPropagation(); // Важно: чтобы не сработал переход в модалку
    try {
      const response = await api.put(`/posts/like/${postId}`);
      // Обновляем список постов, чтобы иконка сердца и счетчик изменились сразу
      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: response.data.likes } : p
      ));
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // ПЕРЕХОД: открываем модальное окно поста
  const openPostModal = (postId) => {
    navigate(`/post/${postId}`, { state: { background: location } });
  };

  if (loading) return <div className="explore-loader">Loading...</div>;

  return (
    <div className="explore-page-wrapper">
      <div className="explore-main-content">
        <div className="explore-container">
          <div className="explore-grid">
            {posts.map((post, index) => {
              // Шахматный порядок (высокие блоки)
              const isTall = index % 10 === 2 || index % 10 === 5;
              const isLiked = post.likes?.includes(currentUserId);

              return (
                <div 
                  key={post._id} 
                  className={`explore-item ${isTall ? 'tall' : ''}`}
                  onClick={() => openPostModal(post._id)}
                >
                  <img src={getFileUrl(post.image)} alt="explore post" />
                  
                  {/* Оверлей, который появляется при hover в CSS */}
                  <div className="explore-overlay">
                    <div className="overlay-stats-wrapper">
                      
                      {/* Секция лайка */}
                      <div 
                        className={`overlay-stat heart-icon ${isLiked ? 'active' : ''}`}
                        onClick={(e) => handleLike(e, post._id)}
                      >
                        <IoHeartSharp />
                        <span>{post.likes?.length || 0}</span>
                      </div>

                      {/* Секция комментариев */}
                      <div className="overlay-stat" onClick={() => openPostModal(post._id)}>
                        <IoChatbubbleSharp />
                        <span>{post.comments?.length || 0}</span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Explore;