const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // Участники чата (всегда двое для лички)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Ссылка на последнее сообщение для превью в списке слева
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);