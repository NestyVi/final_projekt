import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoHeartSharp,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import api from "../api/axios";
import axios from "axios";
import noImage from "../assets/noimage.jpg";
import PostOptionsModal from "./modals/PostOptionsModal";
import EditPostModal from "./modals/EditPostModal";
import "../styles/PostModal.css";

const PostModal = ({ onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const commentInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFileUrl = (path) => {
    if (!path || path === "undefined" || path.includes("placeholder"))
      return noImage;
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const formatTimeShort = (date) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), { locale: enUS })
        .replace("about ", "")
        .replace("less than a minute", "now")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d");
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const savedData = localStorage.getItem("user");
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const userData = parsed.user ? parsed.user : parsed;
          setCurrentUser(userData);
        }

        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error("Ошибка загрузки поста:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleClose = () => (onClose ? onClose() : navigate(-1));

  const handleDeletePost = async () => {
    if (!post?._id) return;
    try {
      setIsOptionsOpen(false);
      await api.delete(`/posts/${post._id}`);
      if (onClose) onClose();
      navigate("/profile", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
    }
  };

  const handleUserClick = (e, userObj) => {
    e.preventDefault();
    e.stopPropagation();

    const targetId = userObj?._id || userObj?.id;
    if (!targetId) return;

    const curId = currentUser?._id || currentUser?.id;
    const path = targetId.toString() === curId?.toString()
      ? "/profile"
      : `/profile/${targetId}`;

    navigate(path, { replace: true, state: {} });
  };

  const handleFollowUser = async () => {
    const postUserId = post.user?._id || post.user?.id;
    if (!postUserId) return;

    const savedData = JSON.parse(localStorage.getItem("user"));
    const token = savedData?.token;

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/follow/${postUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCurrentUser((prev) => ({
        ...prev,
        following: res.data.following,
      }));

      const userData = savedData.user ? savedData.user : savedData;
      userData.following = res.data.following;
      localStorage.setItem("user", JSON.stringify(savedData));
    } catch (err) {
      console.error("Ошибка при попытке подписаться:", err);
    }
  };

  const handleLikePost = async () => {
    try {
      const res = await api.put(`/posts/like/${post._id}`);
      setPost(res.data);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await api.put(`/comments/${commentId}/like`);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId ? { ...c, likes: res.data.likes } : c
        ),
      }));
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/comments/${id}`, { text: commentText });
      setPost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data],
      }));
      setCommentText("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error sending comment:", err);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setCommentText((prev) => prev + emojiObject.emoji);
  };

  if (loading)
    return (
      <div className="post-modal-overlay">
        <div className="loader">Loading...</div>
      </div>
    );
  if (!post) return null;

  // 1. Инициализируем переменные ИДЕНТИФИКАТОРОВ
  const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
  const postOwnerId = post.user?._id?.toString() || post.user?.id?.toString();
  const isOwner = postOwnerId && currentUserId && postOwnerId === currentUserId;
  
  // Универсальная глубокая проверка лайка (работает и со строками, и с объектами из бэка)
  const isLiked = post.likes?.some(like => {
    if (!like) return false;
    const likeId = like._id || like.id || like;
    return likeId.toString() === currentUserId;
  });
  
  const isFollowing = currentUser?.following?.some(
    (uid) => uid.toString() === postOwnerId,
  );

  const clickZone = {
    cursor: "pointer",
    pointerEvents: "auto",
    position: "relative",
    zIndex: 10,
  };

  return (
    <div className="post-modal-overlay" onClick={handleClose}>
      <div
        className="post-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-modal-image">
          <img
            src={getFileUrl(post.image)}
            alt="Post"
            onDoubleClick={handleLikePost}
          />
        </div>

        <div className="post-modal-details">
          <div className="modal-user-header">
            <div className="header-info">
              <img
                src={getFileUrl(post.user?.avatar)}
                className="avatar-small clickable"
                style={clickZone}
                onClick={(e) => handleUserClick(e, post.user)}
                alt=""
              />
              <span
                className="username-bold clickable"
                style={clickZone}
                onClick={(e) => handleUserClick(e, post.user)}
              >
                {post.user?.username || "user"}
              </span>
              {!isOwner && (
                <>
                  <span className="separator">•</span>
                  <button
                    className={`follow-btn-link ${isFollowing ? "is-following" : ""}`}
                    onClick={handleFollowUser}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </>
              )}
            </div>
            {isOwner && (
              <button
                className="options-dot-btn"
                onClick={() => setIsOptionsOpen(true)}
              >
                <IoEllipsisHorizontal />
              </button>
            )}
          </div>

          <div className="modal-comments-area">
            {post.caption && post.caption.trim() !== "" && (
              <div className="comment-item">
                <img
                  src={getFileUrl(post.user?.avatar)}
                  alt=""
                  className="avatar-small clickable"
                  style={clickZone}
                  onClick={(e) => handleUserClick(e, post.user)}
                />
                <div className="comment-text-block">
                  <p>
                    <span
                      className="username-bold clickable"
                      style={clickZone}
                      onClick={(e) => handleUserClick(e, post.user)}
                    >
                      {post.user?.username}
                    </span>{" "}
                    {post.caption}
                  </p>
                  <span className="comment-subtext">
                    {formatTimeShort(post.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {(post.comments || []).map((c) => {
              // Универсальная проверка для каждого комментария
              const isCommentLiked = c.likes?.some(like => {
                if (!like) return false;
                const likeId = like._id || like.id || like;
                return likeId.toString() === currentUserId;
              });
              
              return (
                <div key={c._id} className="comment-item comment-row">
                  <div className="comment-main">
                    <img
                      src={getFileUrl(c.user?.avatar)}
                      alt=""
                      className="avatar-small clickable"
                      style={clickZone}
                      onClick={(e) => handleUserClick(e, c.user)}
                    />
                    <div className="comment-text-block">
                      <p>
                        <span
                          className="username-bold clickable"
                          style={clickZone}
                          onClick={(e) => handleUserClick(e, c.user)}
                        >
                          {c.user?.username}
                        </span>{" "}
                        {c.text}
                      </p>
                      <div className="comment-footer-info">
                        <span>{formatTimeShort(c.createdAt)}</span>
                        {c.likes?.length > 0 && (
                          <span className="likes-count-text">
                            Likes: {c.likes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`comment-like-btn ${isCommentLiked ? "liked" : ""}`}
                    onClick={() => handleLikeComment(c._id)}
                  >
                    {isCommentLiked ? (
                      <IoHeartSharp color="#ed4956" size={14} />
                    ) : (
                      <IoHeartOutline size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="modal-footer">
            <div className="footer-top-row">
              <div className="footer-actions">
                <button 
                  onClick={handleLikePost} 
                  className={`action-btn ${isLiked ? "liked" : ""}`}
                >
                  {isLiked ? (
                    <IoHeartSharp color="#ed4956" />
                  ) : (
                    <IoHeartOutline />
                  )}
                </button>
                <button
                  onClick={() => commentInputRef.current?.focus()}
                  className="action-btn"
                >
                  <IoChatbubbleOutline />
                </button>
              </div>
            </div>

            <div className="footer-stats-block">
              <span className="footer-likes-count">
                {post.likes?.length || 0} likes
              </span>
              <span className="footer-date-text">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </div>

            <form className="modal-input-section" onSubmit={handleSendComment}>
              <div className="emoji-container" ref={emojiPickerRef}>
                <button
                  type="button"
                  className="emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <BsEmojiSmile />{" "}
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker-wrapper">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                  </div>
                )}
              </div>
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!commentText.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      <PostOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        isOwner={isOwner}
        postId={post._id}
        onDelete={handleDeletePost}
        onEdit={() => {
          setIsOptionsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditPostModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        post={post}
        onPostUpdated={(updatedData) => setPost(updatedData)}
      />
    </div>
  );
};

export default PostModal;