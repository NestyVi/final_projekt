import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/PostOptionsModal.css';

const PostOptionsModal = ({ isOpen, onClose, onDelete, onEdit, isOwner, postId }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${postId}`; 
    navigator.clipboard.writeText(postUrl);
    onClose();
  };

  const handleGoToPost = () => {
    onClose();
    navigate(`/post/${postId}`);
  };

  return (
    <div className="options-modal-overlay" onClick={onClose}>
      <div className="options-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {isOwner && (
          <>
            {/* Кнопка удаления */}
            <button className="option-btn red-btn" onClick={onDelete}>
              Delete
            </button>
            <button className="option-btn" onClick={onEdit}>
              Edit
            </button>
          </>
        )}

        {!isOwner && (
            <button className="option-btn red-btn" onClick={onClose}>
                Report
            </button>
        )}

        <button className="option-btn" onClick={handleGoToPost}>
          Go to post
        </button>
        
        <button className="option-btn" onClick={handleCopyLink}>
          Copy link
        </button>
        
        <button className="option-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PostOptionsModal;