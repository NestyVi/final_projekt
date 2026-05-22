const User = require('../models/UserModel'); 
const Notification = require('../models/NotificationModel'); // КРИТИЧНО: Импорт модели уведомлений

// Получить свой профиль
exports.getMyProfile = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Не авторизован" });
        
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('posts'); 
            
        if (!user) return res.status(404).json({ message: "Пользователь не найден" });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Получить чужой профиль
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password') // пароль не отдаем
            .populate('posts');

        if (!user) return res.status(404).json({ message: "Пользователь не найден" });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Обновить профиль
exports.updateProfile = async (req, res) => {
    try {
        const { username, website, about } = req.body;
        
        const updateData = { 
            username, 
            website, 
            bio: about 
        };

        if (req.file) {
            updateData.avatar = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { returnDocument: 'after' }
        ).select('-password').populate('posts');

        res.json(updatedUser);
    } catch (err) {
        console.error("Ошибка при обновлении:", err);
        res.status(500).json({ message: "Не удалось обновить профиль" });
    }
};

// Подписаться / Отписаться + УВЕДОМЛЕНИЯ
exports.followUser = async (req, res) => {
    const { id } = req.params; 
    const currentUserId = req.user.id;

    if (currentUserId === id) return res.status(400).json({ message: "You cannot follow yourself" });

    try {
        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow) return res.status(404).json({ message: "User not found" });

        // Проверка через String(), так как ID в базе — это объекты
        const isFollowing = currentUser.following.some(folId => folId.toString() === id);

        if (isFollowing) {
            await User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId, 
                { $pull: { following: id } }, 
                { returnDocument: 'after' } // Исправлено здесь
            );
            return res.json({ message: "Unfollowed", following: updatedUser.following });
        } else {
            await User.findByIdAndUpdate(id, { $push: { followers: currentUserId } });
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId, 
                { $push: { following: id } }, 
                { returnDocument: 'after' } // Исправлено здесь
            );

            const notification = new Notification({
                sender: currentUserId,
                receiver: id,
                type: 'follow',
            });
            await notification.save();

            return res.json({ message: "Followed", following: updatedUser.following });
        }
    } catch (err) {
        console.error("Follow error:", err);
        res.status(500).json({ message: "Server error" });
    }
};