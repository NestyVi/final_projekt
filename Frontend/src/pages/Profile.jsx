import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Profile.css";
import Footer from "../components/Footer"; 

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // КРИТИЧЕСКИЙ СТЕМП: Локальный флаг ошибки загрузки картинки
  const [avatarError, setAvatarError] = useState(false);

  const isMyProfile = !userId;

  // --- БЛОК ИЗВЛЕЧЕНИЯ ДАННЫХ ---
  const userStorage = JSON.parse(localStorage.getItem("user"));
  const token = userStorage?.token || userStorage?.user?.token;

  const currentUserId =
    userStorage?._id ||
    userStorage?.user?._id ||
    userStorage?.id ||
    userStorage?.user?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setAvatarError(false); // Сбрасываем ошибку при перезагрузке страницы
        if (!token) {
          navigate("/login");
          return;
        }

        const userUrl = isMyProfile
          ? "http://localhost:5000/api/users/me"
          : `http://localhost:5000/api/users/${userId}`;

        const userRes = await axios.get(userUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = userRes.data;
        setUser(userData);

        // Проверка подписки
        if (!isMyProfile && userData.followers && currentUserId) {
          const amIFollowing = userData.followers.some(
            (followerId) => String(followerId) === String(currentUserId),
          );
          setIsFollowing(amIFollowing);
        }

        // Загрузка постов
        const targetUserId = isMyProfile ? userData._id : userId;
        const postsRes = await axios.get(
          `http://localhost:5000/api/posts/user/${targetUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setPosts(postsRes.data);
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, isMyProfile, navigate, token, currentUserId]);

  const handleFollowToggle = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/follow/${user._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 200) {
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);

        setUser((prev) => ({
          ...prev,
          followers: newFollowingState
            ? [...prev.followers, currentUserId]
            : prev.followers.filter(
                (id) => String(id) !== String(currentUserId),
              ),
        }));

        const savedData = JSON.parse(localStorage.getItem("user"));
        const userData = savedData.user ? savedData.user : savedData;

        if (newFollowingState) {
          userData.following = [...(userData.following || []), user._id];
        } else {
          userData.following = (userData.following || []).filter(
            (id) => String(id) !== String(user._id),
          );
        }

        localStorage.setItem("user", JSON.stringify(savedData));
        window.dispatchEvent(new Event("syncFollowStatus"));
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  if (loading)
    return (
      <div
        className="loader-container"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <div className="loader">Loading...</div>
      </div>
    );

  if (!user) return <div className="error">User not found</div>;

  // Улучшенная функция фильтрации битых ссылок
  const getFullUrl = (path) => {
    if (!path || path === "undefined" || path === "null" || path.trim() === "") {
      return null;
    }
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const avatarUrl = getFullUrl(user.avatar);
  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <div className="profile-page-container">
      <div className="profile-wrapper">
        <header className="profile-header">
          <div className="avatar-section">
            <div className="avatar-container">
              {/* Если ссылка существует и картинка не упала с ошибкой 404 */}
              {avatarUrl && !avatarError ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  onError={() => {
                    console.log("Картинка не загрузилась, включаем букву");
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="profile-avatar-initial-box">
                  <span>{userInitial}</span>
                </div>
              )}
            </div>
          </div>

          <section className="profile-info">
            <div className="info-top">
              <h2 className="username-text">{user.username}</h2>
              <div className="profile-actions">
                {isMyProfile ? (
                  <button
                    className="edit-btn"
                    onClick={() => navigate("/profile/edit")}
                  >
                    Edit profile
                  </button>
                ) : (
                  <div className="other-user-buttons">
                    <button
                      className={isFollowing ? "following-btn" : "follow-btn"}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button
                      className="message-btn"
                      onClick={() => navigate(`/messages/${user._id}`)}
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="stats">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{user.followers?.length || 0}</strong> followers
              </span>
              <span>
                <strong>{user.following?.length || 0}</strong> following
              </span>
            </div>

            <div className="bio">
              <p className="full-name">{user.fullName || user.username}</p>
              <p className="description">{user.bio || "No bio yet"}</p>
              {user.website && (
                <a
                  href={
                    user.website.startsWith("http")
                      ? user.website
                      : `https://${user.website}`
                  }
                  className="profile-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </section>
        </header>

        <div className="posts-grid">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post._id}
                to={`/post/${post._id}`}
                state={{ background: location }}
                className="post-item"
              >
                <img
                  src={getFullUrl(post.image) || "https://placehold.co/600x600?text=No+Image"}
                  alt="post"
                  className="post-image"
                />
                <div className="post-item-overlay">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-feed">
              <h3>No posts yet</h3>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;