const mongoose = require("mongoose");
const { Schema } = mongoose; // Вот этой строчки тебе не хватало

const commentSchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  // Исправляем поле likes, чтобы это был массив (для нескольких лайков)
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);