import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Messages.css";

const Messages = () => {
  // В URL может быть либо ID чата, либо ID пользователя из профиля
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Храним активного собеседника (объект с username, avatar, _id)
  const [activePartner, setActivePartner] = useState(null);
  // Флаг, является ли текущее окно новым (еще не созданным в БД) чатом
  const [isNewChat, setIsNewChat] = useState(false);

  const authData = JSON.parse(localStorage.getItem("user"));
  const currentUser = authData?.user || authData;
  const currentUserId = currentUser?._id || currentUser?.id;

  const getFullUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150";
    return path.startsWith("http") ? path : `http://localhost:5000${path}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  };

  const handleMarkChatAsRead = async (idOfConv, unreadCount = 0) => {
    if (!idOfConv || isNewChat) return;
    try {
      await api.put(`/messages/${idOfConv}/read`);
      if (unreadCount > 0) {
        window.dispatchEvent(new CustomEvent("RESET_MESSAGE_COUNT", { detail: { count: unreadCount } }));
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === idOfConv ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Ошибка при пометке чата прочитанным:", err);
    }
  };

  // ФУНКЦИЯ ДЛЯ МГНОВЕННОГО УДАЛЕНИЯ ЧАТА (Без всплывающего окна браузера)
  const handleDeleteChat = async (e, idOfConv) => {
    e.stopPropagation(); // Предотвращает открытие чата при нажатии на крестик
    
    try {
      // Сразу отправляем запрос на бэкенд без лишних вопросов
      await api.delete(`/messages/${idOfConv}`);
      
      // Удаляем чат из списка на экране
      setConversations((prev) => prev.filter((c) => c._id !== idOfConv));
      
      // Если этот чат был открыт прямо сейчас — закрываем его окно
      if (conversationId === idOfConv) {
        navigate("/messages", { replace: true });
        setActivePartner(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Ошибка при удалении чата:", err);
      alert(err.response?.data?.message || "Failed to delete chat");
    }
  };

  useEffect(() => {
    const handleNewMessage = (event) => {
      const data = event.detail;
      if (conversationId === data.conversationId) {
        setMessages((prev) => [...prev, data]);
        handleMarkChatAsRead(conversationId, 1);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === data.conversationId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: data }
              : c
          )
        );
      }
    };
    window.addEventListener("CHAT_MESSAGE_RECEIVED", handleNewMessage);
    return () => window.removeEventListener("CHAT_MESSAGE_RECEIVED", handleNewMessage);
  }, [conversationId, isNewChat]);

  // 1. ЗАГРУЗКА СПИСКА ЧАТОВ
  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
      return res.data;
    } catch (err) {
      console.error("Ошибка загрузки чатов:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. ДИНАМИЧЕСКАЯ ПРОВЕРКА URL (Чат или Новый пользователь)
  useEffect(() => {
    const syncChatWindow = async () => {
      if (!conversationId) {
        setActivePartner(null);
        setIsNewChat(false);
        setMessages([]);
        return;
      }

      const latestConversations = await fetchConversations();
      const existingChat = latestConversations.find((c) => c._id === conversationId);

      if (existingChat) {
        // Сценарий А: Это существующий чат
        setIsNewChat(false);
        const partner = existingChat.participants.find(
          (p) => String(p._id || p.id) !== String(currentUserId)
        );
        setActivePartner(partner);

        try {
          const res = await api.get(`/messages/${conversationId}`);
          setMessages(res.data);
          if (existingChat.unreadCount > 0) {
            handleMarkChatAsRead(conversationId, existingChat.unreadCount);
          }
        } catch (err) {
          console.error("Ошибка загрузки сообщений:", err);
        }
      } else {
        // Сценарий Б: Чата в списке нет. Возможно, передан ID пользователя из профиля!
        try {
          const res = await api.get(`/messages/init-chat/${conversationId}`);
          
          if (res.data.exists) {
            navigate(`/messages/${res.data.conversationId}`, { replace: true });
          } else {
            setIsNewChat(true);
            setActivePartner(res.data.user);
            setMessages([]);
          }
        } catch (err) {
          console.error("Ошибка при инициализации нового чата:", err);
          setActivePartner(null);
          setIsNewChat(false);
        }
      }
    };

    syncChatWindow();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. ОТПРАВКА СООБЩЕНИЯ
  const handleSendMessage = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && newMessage.trim() !== "") {
      if (!activePartner) return;

      try {
        if (isNewChat) {
          const res = await api.post("/messages/send-first", {
            recipientId: activePartner._id,
            text: newMessage,
          });
          
          setNewMessage("");
          navigate(`/messages/${res.data.conversationId}`, { replace: true });
        } else {
          const res = await api.post("/messages/send", {
            recipientId: activePartner._id,
            text: newMessage,
          });
          
          setMessages((prev) => [...prev, res.data]);
          
          // ИСПРАВЛЕНО ТУТ: Было NewMessage(""), теперь вызываем хук обновления состояния
          setNewMessage(""); 
          
          setConversations((prev) =>
            prev.map((c) =>
              c._id === conversationId ? { ...c, lastMessage: res.data } : c
            )
          );
        }
      } catch (err) {
        console.error("Ошибка отправки:", err);
      }
    }
  };

  return (
    <div className="messages-page-wrapper">
      <div className="messages-main-content">
        <div className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h2>{currentUser?.username}</h2>
          </div>
          <div className="chats-list">
            {conversations.map((conv) => {
              const chatPartner = conv.participants.find(
                (p) => String(p._id || p.id) !== String(currentUserId)
              );
              return (
                <div
                  key={conv._id}
                  className={`chat-item ${conversationId === conv._id ? "active" : ""}`}
                  onClick={() => navigate(`/messages/${conv._id}`)}
                >
                  <div className="avatar-container">
                    <img
                      src={getFullUrl(chatPartner?.avatar)}
                      className="chat-avatar"
                      alt=""
                    />
                  </div>
                  
                  <div className="chat-details">
                    <span className={`chat-username ${conv.unreadCount > 0 ? "unread-bold" : ""}`}>
                      {chatPartner?.username}
                    </span>
                    <span className={`chat-last-message ${conv.unreadCount > 0 ? "unread-bold" : ""}`}>
                      {conv.lastMessage?.text || "New conversation"}
                    </span>
                  </div>

                  <div className="chat-actions-wrapper">
                    {conv.unreadCount > 0 && (
                      <div className="chat-unread-badge-wrapper">
                        <span className="chat-unread-badge">{conv.unreadCount}</span>
                      </div>
                    )}
                    <button 
                      className="delete-chat-btn" 
                      onClick={(e) => handleDeleteChat(e, conv._id)}
                      title="Delete Chat"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chat-window">
          {activePartner ? (
            <div className="active-chat-container">
              <div className="chat-header">
                <img
                  src={getFullUrl(activePartner?.avatar)}
                  className="header-avatar-small"
                  alt=""
                />
                <span className="header-username">
                  {activePartner?.username}
                </span>
              </div>
              <div className="messages-history">
                <div className="chat-profile-info">
                  <img
                    src={getFullUrl(activePartner?.avatar)}
                    className="avatar-96"
                    alt=""
                  />
                  <h3 className="profile-info-name">
                    {activePartner?.username}
                  </h3>
                  <p className="profile-info-sub">
                    {activePartner?.username} · ICHgram
                  </p>
                  <button
                    className="view-profile-btn"
                    onClick={() => navigate(`/profile/${activePartner?._id}`)}
                  >
                    View profile
                  </button>
                </div>
                <div className="messages-list-inner">
                  {messages.map((msg) => {
                    const mine =
                      String(msg.sender?._id || msg.sender) ===
                      String(currentUserId);
                    return (
                      <div
                        key={msg._id}
                        className={`message-row ${mine ? "mine" : "theirs"}`}
                      >
                        {!mine && (
                          <img
                            src={getFullUrl(activePartner?.avatar)}
                            className="msg-mini-avatar"
                            alt=""
                          />
                        )}
                        <div className="message-bubble">{msg.text}</div>
                        {mine && (
                          <img
                            src={getFullUrl(currentUser?.avatar)}
                            className="msg-mini-avatar"
                            alt=""
                          />
                        )}
                        <div ref={scrollRef} />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="message-input-area">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Write message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleSendMessage}
                    onFocus={() => {
                      const currentConv = conversations.find(c => c._id === conversationId);
                      if (currentConv && currentConv.unreadCount > 0) {
                        handleMarkChatAsRead(conversationId, currentConv.unreadCount);
                      }
                    }}
                    onClick={() => {
                      const currentConv = conversations.find(c => c._id === conversationId);
                      if (currentConv && currentConv.unreadCount > 0) {
                        handleMarkChatAsRead(conversationId, currentConv.unreadCount);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-chat">
              <div className="icon-circle">✉️</div>
              <h2>Your Messages</h2>
              <p>Select a chat to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;