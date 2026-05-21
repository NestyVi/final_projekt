import React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from "react-router-dom";

// Публичные страницы
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";

// Компоненты разметки и приватные страницы
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PostModal from "./components/PostModal";
import NotFound from "./pages/NotFound";

// --- КОМПОНЕНТ ЗАЩИТЫ РОУТОВ ---
const PrivateRoute = () => {
  const user = localStorage.getItem("user"); // Проверяем наличие юзера в сторедже
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// --- КОМПОНЕНТ ДЛЯ АВТОРИЗОВАННЫХ (чтобы не пускать на Login) ---
const PublicRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  return user ? <Navigate to="/" replace /> : children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Пытаемся достать background из state (для модалок)
  const background = location.state && location.state.background;

  return (
    <>
      {/* Основная сетка маршрутов */}
      <Routes location={background || location}>
        
        {/* --- ПУБЛИЧНЫЕ РОУТЫ (завернуты в PublicRoute) --- */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-confirm/:id" element={<ResetPasswordConfirm />} />

        {/* --- ПРИВАТНЫЕ РОУТЫ (завернуты в PrivateRoute) --- */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />

            {/* МЕССЕНДЖЕР */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />

            {/* Заглушки для Drawer-ов (в Sidebar они управляются стейтом, тут просто чтобы пути не давали 404) */}
            <Route path="/search" element={null} />
            <Route path="/notification" element={null} />

            {/* ПРОФИЛЬ */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/:userId" element={<Profile />} />

            {/* Если зашли на пост по прямой ссылке (например, скинули другу) */}
            {!background && <Route path="/post/:id" element={<PostModal />} />}
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>

      {/* --- МОДАЛЬНЫЙ РОУТ (открывается ПОВЕРХ текущего location) --- */}
      {background && (
        <Routes>
          <Route
            path="/post/:id"
            element={
              <PostModal 
                onClose={() => navigate(-1)} 
              />
            }
          />
        </Routes>
      )}
    </>
  );
}

export default App;