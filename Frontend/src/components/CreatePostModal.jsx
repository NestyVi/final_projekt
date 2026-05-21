import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { IoCloseOutline, IoHappyOutline } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react"; // Импортируем пикер
import noImage from "../assets/noimage.jpg";
import buttonLoad from "../assets/buttonLoad.svg";
import "../styles/CreatePostModal.css";

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Состояние для окна смайлов

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const userStorage = localStorage.getItem("user");
  const currentUserData = userStorage ? JSON.parse(userStorage) : null;
  const userData = currentUserData?.user || currentUserData;

  // Закрытие смайлов при клике вне пикера
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

  if (!isOpen) return null;

  const onEmojiClick = (emojiData) => {
    setCaption((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    try {
      setLoading(true);
      await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setPreview(null);
      setCaption("");
      if (onPostCreated) onPostCreated();
      else window.location.reload();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <button className="global-close-btn" onClick={onClose}>
        <IoCloseOutline />
      </button>

      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {preview ? (
            /* Если фото выбрано — кнопка возврата назад к выбору фото */
            <button
              className="back-btn"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              <svg
                aria-label="Back"
                color="rgb(38, 38, 38)"
                fill="rgb(38, 38, 38)"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <line
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  x1="2.909"
                  x2="22.001"
                  y1="12.004"
                  y2="12.004"
                ></line>
                <polyline
                  fill="none"
                  points="9.276 4.726 2.001 12.004 9.276 19.274"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></polyline>
              </svg>
            </button>
          ) : (
            /* Новая кнопка: Если фото НЕ выбрано — на мобилках показываем крестик для закрытия всей модалки */
            <button className="mobile-close-btn" onClick={onClose}>
              <IoCloseOutline />
            </button>
          )}

          <span className="header-title">Create new post</span>

          <button
            className="share-action-btn"
            onClick={handleSubmit}
            disabled={loading || !file}
          >
            {loading ? "..." : "Share"}
          </button>
        </div>

        <div className="modal-body-container">
          <div className="post-creation-layout">
            <div
              className="image-section"
              onClick={() => !preview && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileChange}
                accept="image/*"
              />
              {preview ? (
                <img src={preview} alt="Preview" className="main-preview-img" />
              ) : (
                <div className="upload-trigger-area">
                  <img
                    src={buttonLoad}
                    alt="Upload"
                    className="custom-upload-icon"
                  />
                </div>
              )}
            </div>

            <div className="settings-section">
              <div className="user-info-row">
                <img
                  src={
                    userData?.avatar
                      ? `http://localhost:5000${userData.avatar}`
                      : noImage
                  }
                  alt=""
                  className="avatar-micro"
                />
                <span className="username-bold">
                  {userData?.username || "user"}
                </span>
              </div>

              <div className="caption-container">
                <textarea
                  className="caption-textarea"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />

                <div className="caption-footer">
                  <div className="emoji-wrapper" ref={emojiPickerRef}>
                    <button
                      className="emoji-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <IoHappyOutline />
                    </button>
                    {showEmojiPicker && (
                      <div className="emoji-picker-container">
                        <EmojiPicker
                          onEmojiClick={onEmojiClick}
                          width={300}
                          height={400}
                        />
                      </div>
                    )}
                  </div>
                  <span className="char-count">{caption.length}/2,200</span>
                </div>
              </div>
              {/* Все dummy-row удалены */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
