import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IoHeartOutline,
  IoHeartSharp,
  IoChatbubbleOutline,
  IoEllipsisHorizontal,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import api from "../api/axios";
import axios from "axios"; 
import noImage from "../assets/noimage.jpg";
import "../styles/PostCard.css";

const PostCard = ({ post, onFollowChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userStorage = localStorage.getItem("user");
  const currentUserData = userStorage ? JSON.parse(userStorage) : null;
  const userData = currentUserData?.user || currentUserData;
  const currentUserId = userData?._id || userData?.id;
  const token = currentUserData?.token;

  const [likes, setLikes] = useState(post.likes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  
  // 1. Добавляем локальный стейт для подписки, инициализируем его на основе данных из localStorage
  const postUserId = post.user?._id || post.user;
  const [isFollowing, setIsFollowing] = useState(
    userData?.following?.includes(postUserId) || false
  );

  // Синхронизируем стейт подписки, если изменятся глобальные данные пользователя
  useEffect(() => {
    if (userData?.following) {
      setIsFollowing(userData.following.includes(postUserId));
    }
  }, [userData?.following, postUserId]);

  useEffect(() => {
    if (currentUserId && likes) {
      setIsLiked(likes.includes(currentUserId));
    }
  }, [likes, currentUserId]);

  const getFileUrl = (path) => {
    if (
      !path ||
      path === "undefined" ||
      path === "" ||
      typeof path !== "string"
    )
      return noImage;
    if (path.startsWith("http")) return path;
    const fileName = path.replace("/uploads/", "").split(/[\\/]/).pop();
    if (!fileName.includes(".")) return noImage;
    return `http://localhost:5000/uploads/${fileName}`;
  };

  const handleProfileClick = () => {
    if (postUserId === currentUserId) navigate("/profile");
    else navigate(`/profile/${postUserId}`);
  };

  const handleLike = async () => {
    if (!token) return alert("Войдите в аккаунт");
    try {
      const response = await api.put(`/posts/like/${post._id}`);
      setLikes(response.data.likes);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!token) return alert("Please log in");
    const targetUserId = post.user?._id || post.user;
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/follow/${targetUserId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const updatedUserData = {
        ...userData,
        following: response.data.following,
      };
      
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUserData, user: updatedUserData }),
      );
      
      // 2. Обновляем локальный стейт — React мгновенно перерисует кнопку на "Following" или "Follow"
      setIsFollowing(response.data.following.includes(targetUserId));
      
      // 3. Уведомляем родительский компонент (например, Home), чтобы он тоже знал об изменениях
      if (onFollowChange) {
        onFollowChange(targetUserId, response.data.following);
      }
      
      // УБРАЛИ window.location.reload(); — теперь страница не перезагружается!
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const openPostModal = () => {
    navigate(`/post/${post._id}`, { state: { background: location } });
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: false,
        locale: enUS,
      })
        .replace("about ", "")
        .replace("less than a minute", "now")
        .replace(" minute", "m")
        .replace(" minutes", "m")
        .replace(" hour", "h")
        .replace(" hours", "h")
        .replace(" day", "d")
        .replace(" days", "d")
        .replace(" week", "w")
        .replace(" weeks", "w")
    : "";

  const username = post.user?.username || "unknown";
  const isMyPost = currentUserId === postUserId;

  const commentsCount = post.comments?.length || 0;
  const latestComments = post.comments?.slice(-2) || [];

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-header-left">
          <div className="avatar-ring" onClick={handleProfileClick}>
            <img
              src={getFileUrl(post.user?.avatar)}
              className="post-avatar-img"
              alt="avatar"
              onError={(e) => {
                e.target.src = noImage;
              }}
            />
          </div>
          <div className="post-user-meta">
            <span className="post-username" onClick={handleProfileClick}>
              {username}
            </span>
            <span className="post-dot">•</span>
            <span className="post-time">{timeAgo}</span>
            {!isMyPost && (
              <>
                <span className="post-dot">•</span>
                <button
                  className={`post-follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="post-header-right post-header-options">
          <IoEllipsisHorizontal className="post-options-icon" />
        </div>
      </div>

      <div className="post-image-container">
        <img
          src={getFileUrl(post.image)}
          alt="Post"
          className="post-main-image"
          onClick={openPostModal}
          onDoubleClick={handleLike}
          onError={(e) => {
            e.target.src = noImage;
          }}
        />
      </div>

      <div className="post-footer">
        <div className="post-actions">
          <div className="left-actions">
            <div onClick={handleLike} className="action-btn">
              {isLiked ? <IoHeartSharp color="#ed4956" /> : <IoHeartOutline />}
            </div>
            <div className="action-btn" onClick={openPostModal}>
              <IoChatbubbleOutline />
            </div>
          </div>
        </div>

        <div className="post-likes-count">{likes.length} likes</div>

        <div className="post-description">
          <span className="bold-username" onClick={handleProfileClick}>
            {username}
          </span>{" "}
          <span className="caption-text">
            {showFullCaption
              ? post.caption
              : `${post.caption?.substring(0, 100)}`}
            {post.caption?.length > 100 && !showFullCaption && (
              <span
                className="more-btn"
                // Исправлено: предотвращаем всплытие, чтобы не открывалась модалка при клике на "... more"
                onClick={(e) => { e.stopPropagation(); setShowFullCaption(true); }}
              >
                ... more
              </span>
            )}
          </span>
        </div>

        <div className="latest-comments-list">
          {latestComments.map((comment, index) => (
            <div key={index} className="mini-comment">
              <span
                className="bold-username"
                onClick={() =>
                  navigate(`/profile/${comment.user?._id || comment.user}`)
                }
              >
                {comment.user?.username || "user"}
              </span>{" "}
              <span className="comment-text">{comment.text}</span>
            </div>
          ))}
        </div>

        {commentsCount > 0 && (
          <div className="view-comments-link" onClick={openPostModal}>
            View all comments ({commentsCount})
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;