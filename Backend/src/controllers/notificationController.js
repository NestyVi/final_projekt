const Notification = require('../models/NotificationModel');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user.id })
            .populate('sender', 'username avatar')
            .populate('post', 'image')
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Ошибка загрузки уведомлений" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        // Помечаем все уведомления пользователя как прочитанные
        await Notification.updateMany(
            { receiver: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: "Успешно прочитано" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};