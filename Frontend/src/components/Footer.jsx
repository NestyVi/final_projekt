import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreatePostModal from "./CreatePostModal";
import SearchDrawer from "./SearchDrawer";
import NotificationsDrawer from "./NotificationsDrawer";
import '../styles/Footer.css';

const Footer = () => {
  // Логика состояний для вызова панелей и модалок
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const rawData = localStorage.getItem("user");
  const authData = rawData ? JSON.parse(rawData) : null;
  const currentUser = authData?.user || authData;

  const handlePanelToggle = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <>
      <footer className="main-footer">
        <div className="footer-links">
          <Link to="/">Home</Link>
          
          <span className="footer-link-btn" onClick={() => handlePanelToggle("search")}>
            Search
          </span>

          <Link to="/explore">Explore</Link>
          
          <Link to="/messages">Messages</Link>

          <span className="footer-link-btn" onClick={() => handlePanelToggle("notifications")}>
            Notifications
          </span>

          <span className="footer-link-btn" onClick={() => setIsModalOpen(true)}>
            Create
          </span>
        </div>

        <p className="copyright">© {new Date().getFullYear()} ICHGRAM</p>
      </footer>

      {/* Выезжающие панели из Sidebar */}
      <SearchDrawer 
        isOpen={activePanel === "search"} 
        onClose={() => setActivePanel(null)} 
      />
      
      <NotificationsDrawer 
        isOpen={activePanel === "notifications"} 
        onClose={() => setActivePanel(null)} 
        currentUser={currentUser} 
      />

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      {/* Оверлей закрытия */}
      {activePanel && (
        <div 
          className="panel-overlay visible" 
          onClick={() => setActivePanel(null)}
          style={{ zIndex: 998 }}
        ></div>
      )}
    </>
  );
};

export default Footer;