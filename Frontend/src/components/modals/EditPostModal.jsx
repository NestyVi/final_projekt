import React, { useState } from 'react';
import api from '../../api/axios';
import { IoCloseOutline } from "react-icons/io5";
import '../../styles/EditPostModal.css';

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [caption, setCaption] = useState(post?.caption || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put(`/posts/${post._id}`, { caption });
      onPostUpdated(res.data);
      onClose();
    } catch (err) {
      alert("Error updating post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          {/* Класс заменен на edit-modal-close-btn для соответствия CSS */}
          <button className="edit-modal-close-btn" onClick={onClose}>
            <IoCloseOutline />
          </button>
          
          <h2>Edit info</h2>
          
          <button className="done-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Done"}
          </button>
        </div>
        
        <div className="edit-modal-body">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;