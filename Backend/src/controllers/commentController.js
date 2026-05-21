const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");
const Notification = require("../models/NotificationModel");

exports.createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user.id;

    const newComment = new Comment({ text, user: userId, post: postId });
    await newComment.save();

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: newComment._id } },
      { returnDocument: 'after' }
    ).populate("user");
{ returnDocument: 'after' }
    const populatedComment = await newComment.populate("user", "username avatar");

    // УВЕДОМЛЕНИЕ: Автору поста о новом комментарии
    if (post.user._id.toString() !== userId.toString()) {
      const notif = await Notification.create({
        receiver: post.user._id,
        sender: userId,
        type: 'comment',
        post: postId,
        comment: newComment._id
      });

      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'username avatar')
        .populate('post', 'image');

      const receiverSocketId = global.getReceiverSocketId(post.user._id.toString());
      if (receiverSocketId && req.io) {
        req.io.to(receiverSocketId).emit('getNotification', populatedNotif);
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Ошибка при создании комментария:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Комментарий не найден" });

    const isLiked = comment.likes.map(id => id.toString()).includes(userId.toString());

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { returnDocument: 'after' }
    ).populate("user", "username avatar");

    // УВЕДОМЛЕНИЕ: Автору комментария о лайке
    if (!isLiked && comment.user.toString() !== userId.toString()) {
      const notif = await Notification.create({
        receiver: comment.user,
        sender: userId,
        type: 'like',
        post: comment.post // Передаем пост, чтобы при клике на нотиф открыть его
      });

      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'username avatar')
        .populate('post', 'image');

      const receiverSocketId = global.getReceiverSocketId(comment.user.toString());
      
      console.log(`Socket Debug: Отправка лайка пользователю ${comment.user}. SocketID: ${receiverSocketId}`);

      if (receiverSocketId && req.io) {
        req.io.to(receiverSocketId).emit('getNotification', populatedNotif);
      }
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Ошибка при лайке комментария:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};