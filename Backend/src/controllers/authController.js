const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Notification = require('../models/NotificationModel');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- РЕГИСТРАЦИЯ ---
exports.register = async (req, res) => {
    try {
        const { email, fullName, username, password } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ message: "Заполните все обязательные поля" });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: "Email занят" });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username занят" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            fullName: fullName || username,
            username,
            password: hashedPassword
        });

        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            message: "Пользователь успешно зарегистрирован!",
            token,
            user: { 
                id: newUser._id, 
                username: newUser.username, 
                email: newUser.email, 
                fullName: newUser.fullName,
                following: [],
                followers: []
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка на сервере", error: error.message });
    }
};

// --- ВХОД ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        });
        
        if (!user) return res.status(404).json({ message: "Пользователь не найден" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Неверный пароль" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.status(200).json({
            message: "Вход выполнен!",
            token,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                fullName: user.fullName,
                avatar: user.avatar,
                following: user.following,
                followers: user.followers
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// --- ПОДПИСКА / ОТПИСКА ---
exports.followUser = async (req, res) => {
    try {
        const { id } = req.params; 
        const { postId } = req.body; // ПОЛУЧАЕМ postId из запроса (если подписка из карточки поста)
        const userId = req.user.id; 

        if (id === userId) return res.status(400).json({ message: "Нельзя подписаться на себя" });

        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(userId);

        if (!userToFollow) return res.status(404).json({ message: "Пользователь не найден" });

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Отписка
            currentUser.following = currentUser.following.filter(fid => fid.toString() !== id);
            userToFollow.followers = userToFollow.followers.filter(fid => fid.toString() !== userId);
            
            await Notification.findOneAndDelete({ sender: userId, receiver: id, type: 'follow' });
        } else {
            // Подписка
            currentUser.following.push(id);
            userToFollow.followers.push(userId);

            // СОЗДАЕМ УВЕДОМЛЕНИЕ (добавляем post, если он передан)
            await Notification.create({
                receiver: id,
                sender: userId,
                type: 'follow',
                post: postId || null // Если подписка не через пост, будет null
            });
        }

        await currentUser.save();
        await userToFollow.save();

        res.status(200).json({ 
            message: isFollowing ? "Отписались" : "Подписались",
            following: currentUser.following 
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при подписке" });
    }
};

// --- ПОИСК ---
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        }).select('username fullName avatar');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при поиске" });
    }
};

// --- ПОЛУЧИТЬ МОИ ДАННЫЕ ---
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) { 
        res.status(500).json({ message: "Ошибка получения профиля" }); 
    }
};

// --- ОБНОВИТЬ ПРОФИЛЬ ---
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, username, website, bio } = req.body;
        const user = await User.findById(req.user.id);
        
        if (req.file) user.avatar = req.file.path;
        user.fullName = fullName || user.fullName;
        user.username = username || user.username;
        user.website = website || user.website;
        user.bio = bio || user.bio;
        
        await user.save();
        
        const updatedUser = user.toObject();
        delete updatedUser.password;
        
        res.status(200).json({ message: "Обновлено", user: updatedUser });
    } catch (error) { 
        res.status(500).json({ message: "Ошибка обновления профиля" }); 
    }
};

// --- СБРОС ПАРОЛЯ ---
exports.resetPasswordRequest = async (req, res) => {
    try {
        const { identity } = req.body;
        const user = await User.findOne({ $or: [{ email: identity }, { username: identity }] });
        if (!user) return res.status(404).json({ message: "Не найден" });
        
        const resetLink = `http://localhost:5173/reset-password-confirm/${user._id}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Сброс пароля',
            html: `<p>Для сброса пароля перейдите по ссылке:</p><a href="${resetLink}">${resetLink}</a>`
        });
        res.json({ message: "Инструкции отправлены на почту" });
    } catch (error) { 
        res.status(500).json({ message: "Ошибка при запросе сброса" }); 
    }
};

exports.updatePasswordAfterReset = async (req, res) => {
    try {
        const { id, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(id, { password: hashedPassword });
        res.json({ message: "Пароль успешно обновлен" });
    } catch (error) { 
        res.status(500).json({ message: "Ошибка при смене пароля" }); 
    }
};