import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import CreatePostModal from "./CreatePostModal";
import SearchDrawer from "./SearchDrawer";
import NotificationsDrawer from "./NotificationsDrawer";
import "../styles/Sidebar.css";

import logo from "../assets/logo2.svg";

import {
  IoHomeOutline, IoHomeSharp,
  IoSearchOutline, IoSearchSharp,
  IoCompassOutline, IoCompassSharp,
  IoPaperPlaneOutline, IoPaperPlaneSharp,
  IoHeartOutline, IoHeartSharp,
  IoAddCircleOutline, IoAddCircleSharp,
  IoLogOutOutline,
} from "react-icons/io5";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Стейт для отслеживания ошибок загрузки аватара в сайдбаре
  const [avatarError, setAvatarError] = useState(false);

  const rawData = localStorage.getItem("user");
  const authData = rawData ? JSON.parse(rawData) : null;
  const currentUser = authData?.user || authData;

  // --- ЛОГИКА ОПРЕДЕЛЕНИЯ ПРАВИЛЬНОГО АВАТАРА ---
  const getFullUrl = (path) => {
    if (!path || path === "undefined" || path === "null" || String(path).trim() === "") {
      return null;
    }
    if (String(path).startsWith("http")) return path;
    return `http://localhost:5000${String(path).startsWith("/") ? "" : "/"}${path}`;
  };

  const rawAvatar = currentUser?.avatarUrl || currentUser?.avatar;
  const avatarUrl = getFullUrl(rawAvatar);
  const userInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U";

  // Сбрасываем ошибку аватара, если пользователь обновился
  useEffect(() => {
    setAvatarError(false);
  }, [rawAvatar]);

  useEffect(() => {
    if (!currentUser || (!currentUser._id && !currentUser.id)) return;

    const userId = (currentUser._id || currentUser.id).toString();
    
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5
    });

    const checkInitialStatus = async () => {
      try {
        const notifRes = await api.get("/notifications");
        setHasNewNotifications(notifRes.data.some(n => !n.isRead));

        const convRes = await api.get("/messages/conversations");
        const totalUnread = convRes.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnread);
      } catch (err) {
        // Ошибка подавлена для чистоты консоли
      }
    };

    checkInitialStatus();

    socket.on("connect", () => {
      socket.emit("addNewUser", userId);
    });

    socket.on("getNotification", () => {
      setHasNewNotifications(true);
    });

    socket.on("getMessage", (data) => {
      if (!window.location.pathname.includes(`/messages/${data.conversationId}`)) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
      window.dispatchEvent(new CustomEvent("CHAT_MESSAGE_RECEIVED", { detail: data }));
    });

    const handleResetCount = (event) => {
      const countToSubtract = event.detail.count || 0;
      setUnreadMessagesCount((prev) => Math.max(0, prev - countToSubtract));
    };

    window.addEventListener("RESET_MESSAGE_COUNT", handleResetCount);

    return () => {
      window.removeEventListener("RESET_MESSAGE_COUNT", handleResetCount);
      if (socket) {
        socket.off("connect");
        socket.off("getNotification");
        socket.off("getMessage");
        
        setTimeout(() => {
          if (socket.connected) {
            socket.disconnect();
          }
        }, 50);
      }
    };
  }, [currentUser?._id, currentUser?.id]);

  const handleNavigation = (path) => {
    setActivePanel(null);
    navigate(path);
  };

  const handlePanelToggle = async (panel) => {
    if (panel === "notifications" && activePanel !== "notifications") {
      setHasNewNotifications(false);
      try { 
        await api.put("/notifications/read"); 
      } catch (err) {
        // Silent error
      }
    }
    setActivePanel(activePanel === panel ? null : panel);
  };

  const isTabActive = (path) => location.pathname === path && !activePanel;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div onClick={() => handleNavigation("/")} style={{ cursor: "pointer" }}>
            <img src={logo} alt="LOGO" className="logo-img" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${isTabActive("/") ? "active" : ""}`} onClick={() => handleNavigation("/")}>
            <span className="nav-icon-wrapper">{isTabActive("/") ? <IoHomeSharp /> : <IoHomeOutline />}</span>
            <span className="nav-text">Home</span>
          </div>

          <div className={`nav-item ${activePanel === "search" ? "active" : ""}`} onClick={() => handlePanelToggle("search")}>
            <span className="nav-icon-wrapper">{activePanel === "search" ? <IoSearchSharp /> : <IoSearchOutline />}</span>
            <span className="nav-text">Search</span>
          </div>

          <div className={`nav-item ${isTabActive("/explore") ? "active" : ""}`} onClick={() => handleNavigation("/explore")}>
            <span className="nav-icon-wrapper">{isTabActive("/explore") ? <IoCompassSharp /> : <IoCompassOutline />}</span>
            <span className="nav-text">Explore</span>
          </div>

          <div className={`nav-item ${location.pathname.startsWith("/messages") ? "active" : ""}`} onClick={() => handleNavigation("/messages")}>
            <span className="nav-icon-wrapper">
              {location.pathname.startsWith("/messages") ? <IoPaperPlaneSharp /> : <IoPaperPlaneOutline />}
              {unreadMessagesCount > 0 && <span className="badge-count">{unreadMessagesCount}</span>}
            </span>
            <span className="nav-text">Messages</span>
          </div>

          <div className={`nav-item ${activePanel === "notifications" ? "active" : ""}`} onClick={() => handlePanelToggle("notifications")}>
            <span className="nav-icon-wrapper">
              {activePanel === "notifications" ? <IoHeartSharp /> : <IoHeartOutline />}
              {hasNewNotifications && <span className="badge-dot"></span>}
            </span>
            <span className="nav-text">Notifications</span>
          </div>

          <div className="nav-item" onClick={() => { setActivePanel(null); setIsModalOpen(true); }}>
            <span className="nav-icon-wrapper"><IoAddCircleOutline /></span>
            <span className="nav-text">Create</span>
          </div>

          {/* ИСПРАВЛЕННЫЙ ПУНКТ ПРОФИЛЯ С АВТОПЕРЕКЛЮЧЕНИЕМ НА БУКВУ ПРИ ОШИБКЕ */}
          <div className={`nav-item ${isTabActive("/profile") ? "active" : ""}`} onClick={() => handleNavigation("/profile")}>
            <div className="profile-icon-container">
              {avatarUrl && !avatarError ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="profile-icon-img" 
                  onError={() => {
                    console.log("Сайдбар: аватар не загрузился, включаем заглушку");
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="sidebar-avatar-initial-box">
                  {userInitial}
                </div>
              )}
            </div>
            <span className="nav-text">Profile</span>
          </div>

          <div 
            className="nav-item logout-item" 
            onClick={() => { localStorage.clear(); window.location.href="/login" }} 
            style={{ marginTop: "auto", color: "#ed4956" }}
          >
            <span className="nav-icon-wrapper"><IoLogOutOutline /></span>
            <span className="nav-text">Log out</span>
          </div>
        </nav>
      </aside>

      <SearchDrawer isOpen={activePanel === "search"} onClose={() => setActivePanel(null)} />
      <NotificationsDrawer 
        isOpen={activePanel === "notifications"} 
        onClose={() => setActivePanel(null)} 
        currentUser={currentUser} 
        setHasNewNotifications={setHasNewNotifications} 
      />
      <div className={`panel-overlay ${activePanel ? "visible" : ""}`} onClick={() => setActivePanel(null)}></div>
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Sidebar;