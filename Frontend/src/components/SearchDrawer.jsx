import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/SearchDrawer.css';

const SearchDrawer = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  const getStorageKey = () => {
    const userStorage = localStorage.getItem("user");
    if (!userStorage) return null;
    const userData = JSON.parse(userStorage);
    const userId = userData?.user?._id || userData?._id || userData?.id || userData?.user?.id;
    return userId ? `recentSearches_${userId}` : null;
  };

  useEffect(() => {
    if (isOpen) {
      const key = getStorageKey();
      if (key) {
        const saved = localStorage.getItem(key);
        setRecentSearches(saved ? JSON.parse(saved) : []);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setLoading(true);
        try {
          const response = await api.get(`/auth/search`, {
            params: { query: searchQuery }
          });
          setSearchResults(response.data);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleUserClick = (user) => {
    const newUserEntry = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      fullName: user.fullName || user.username
    };

    const updatedList = [
      newUserEntry,
      ...recentSearches.filter(item => item._id !== user._id)
    ].slice(0, 10);

    setRecentSearches(updatedList);

    const key = getStorageKey();
    if (key) {
      localStorage.setItem(key, JSON.stringify(updatedList));
    }

    navigate(`/profile/${user._id}`);
    if (onClose) onClose();
    setSearchQuery("");
  };

  // НОВАЯ ФУНКЦИЯ: Очищает и ввод, и историю
  const handleFullClear = () => {
    setSearchQuery(""); // Очищаем поле ввода
    setRecentSearches([]); // Очищаем стейт недавних
    const key = getStorageKey();
    if (key) {
      localStorage.removeItem(key); // Удаляем историю из браузера
    }
  };

  const getFullUrl = (path) => {
    if (!path || path.includes('placeholder')) {
        return 'https://ui-avatars.com/api/?name=User&background=ebebeb&color=a0a0a0';
    }
    return path.startsWith('http') ? path : `http://localhost:5000${path}`;
  };

  return (
    <div className={`search-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2 className="drawer-title">Search</h2>
        <div className="search-input-container">
          <input 
            type="text" 
            placeholder="Search" 
            className="search-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Кнопка теперь рендерится ВСЕГДА, как в Фигме */}
          <button className="input-clear-btn" onClick={handleFullClear}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="12" fill="#DBDBDB" />
              <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="drawer-content">
        {!searchQuery ? (
          <div className="recent-section">
            <h4 className="section-subtitle">Recent</h4>
            {recentSearches.length > 0 ? (
              <div className="results-list">
                {recentSearches.map(user => (
                  <div key={user._id} className="user-item" onClick={() => handleUserClick(user)}>
                    <img src={getFullUrl(user.avatar)} alt="" className="user-avatar" />
                    <span className="user-username">{user.username}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results-text">No recent searches.</p>
            )}
          </div>
        ) : (
          <div className="search-results-section">
            {loading ? (
              <p className="no-results-text">Searching...</p>
            ) : (
              <div className="results-list">
                {searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div key={user._id} className="user-item" onClick={() => handleUserClick(user)}>
                      <img src={getFullUrl(user.avatar)} alt="" className="user-avatar" />
                      <div className="user-info">
                        <span className="user-username">{user.username}</span>
                        <span className="user-fullname">{user.fullName || user.username}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-results-text">No users found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDrawer;