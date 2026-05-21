const Conversation = require('../models/ConversationModel');
const Message = require('../models/MessageModel');
const User = require('../models/UserModel'); // <-- Убедись, что путь и название модели верные

// 1. СТАНДАРТНАЯ ОТПРАВКА СООБЩЕНИЯ (В существующий чат)
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId]
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text,
      isRead: false 
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar');

    if (req.io) {
      const receiverSocketId = global.getReceiverSocketId(recipientId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("getMessage", populatedMessage);
      }
    }

    await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      { lastMessage: newMessage._id },
      { returnDocument: 'after' }
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Ошибка отправки", error: error.message });
  }
};

// 2. ПОЛУЧЕНИЕ СПИСКА ЧАТОВ (С подсчетом непрочитанных для каждого)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'username avatar'
      })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          isRead: false
        });
        
        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.status(200).json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: "Ошибка загрузки чатов", error: error.message });
  }
};

// 3. ЗАГРУЗКА ИСТОРИИ СООБЩЕНИЙ КОНКРЕТНОГО ЧАТА
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Ошибка загрузки сообщений", error: error.message });
  }
};

// 4. ПРИНУДИТЕЛЬНЫЙ СБРОС СЧЕТЧИКА НЕПРОЧИТАННЫХ (При фокусе на инпут)
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "Чат помечен прочитанным" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка обновления статуса", error: error.message });
  }
};

// ==========================================================================
// 5. ИНИЦИАЛИЗАЦИЯ ЧАТА ПРИ ПЕРЕХОДЕ ИЗ ЧУЖОГО ПРОФИЛЯ (Новый метод)
// ==========================================================================
exports.initChat = async (req, res) => {
  try {
    const { possibleUserId } = req.params;
    const currentUserId = req.user.id;

    if (String(possibleUserId) === String(currentUserId)) {
      return res.status(400).json({ message: "Нельзя создать чат с самим собой" });
    }

    const existingConversation = await Conversation.findOne({
      participants: { $all: [currentUserId, possibleUserId] }
    });

    if (existingConversation) {
      return res.status(200).json({
        exists: true,
        conversationId: existingConversation._id
      });
    }

    const targetUser = await User.findById(possibleUserId).select('username avatar');
    if (!targetUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.status(200).json({
      exists: false,
      user: targetUser
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка инициализации чата", error: error.message });
  }
};

// ==========================================================================
// 6. ОТПРАВКА САМОГО ПЕРВОГО СООБЩЕНИЯ В НОВЫЙ ДИАЛОГ (Новый метод)
// ==========================================================================
exports.sendFirstMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Текст сообщения не может быть пустым" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId]
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text,
      isRead: false
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar');

    if (req.io) {
      const receiverSocketId = global.getReceiverSocketId(recipientId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("getMessage", populatedMessage);
      }
    }

    await Conversation.findByIdAndUpdate(
      conversation._id,
      { lastMessage: newMessage._id },
      { returnDocument: 'after' }
    );

    res.status(201).json({
      success: true,
      conversationId: conversation._id,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка создания первого сообщения", error: error.message });
  }
};

// Удаление чата и всех связанных с ним сообщений
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // 1. Проверяем, существует ли чат и является ли пользователь его участником
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(443).json({ message: "Чат не найден или у вас нет прав на его удаление" });
    }

    // 2. Удаляем все сообщения, принадлежащие этому чату
    await Message.deleteMany({ conversationId });

    // 3. Удаляем сам чат
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ success: true, message: "Чат успешно удален" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении чата", error: error.message });
  }
};