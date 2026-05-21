import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import api from '../api/axios'; 
import '../styles/NotificationsDrawer.css';

const NotificationsDrawer = ({ isOpen, onClose, currentUser, setHasNewNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getFileUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const response = await api.get('/notifications');
          setNotifications(response.data);
          
          // Помечаем визуально, что новых больше нет
          if (setHasNewNotifications) {
            setHasNewNotifications(false);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [isOpen, setHasNewNotifications]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const handleNotifClick = (notif) => {
    if (notif.post?._id) {
      navigate(`/post/${notif.post._id}`, { state: { background: location } });
      if (onClose) onClose();
    } else if (notif.type === 'follow' && notif.sender?._id) {
      navigate(`/profile/${notif.sender._id}`);
      if (onClose) onClose();
    }
  };

  return (
    <div className={`notifications-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2>Notifications</h2>
      </div>

      <div className="drawer-content">
        {loading ? (
          <div className="notif-loader">Loading...</div>
        ) : notifications.length > 0 ? (
          <div className="notif-list">
            <h4 className="section-title">History</h4> 
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`notif-item ${!notif.isRead ? 'unread' : ''}`} 
                onClick={() => handleNotifClick(notif)}
              >
                <div className="notif-avatar">
                  <img src={getFileUrl(notif.sender?.avatar)} alt="avatar" />
                </div>
                <div className="notif-info">
                  <span className="notif-username">{notif.sender?.username || 'User'}</span>
                  <span className="notif-action">
                    {notif.type === 'like' && ' liked your photo.'}
                    {notif.type === 'comment' && ' commented on your post.'}
                    {notif.type === 'follow' && ' started following you.'}
                  </span>
                  <span className="notif-time">{formatTime(notif.createdAt)}</span>
                </div>
                <div className="notif-right-preview">
                  {notif.post?.image ? (
                    <img src={getFileUrl(notif.post.image)} className="preview-img" alt="post" />
                  ) : (
                    notif.type === 'follow' && <div className="follow-indicator" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notif-empty"><p>No notifications yet.</p></div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDrawer;