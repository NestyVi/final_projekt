const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Ссылка из Cloudinary
  caption: { type: String, default: '' },   // Описание
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Автор
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Кто лайкнул
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // МАССИВ КОММЕНТАРИЕВ
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);