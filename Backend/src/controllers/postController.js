const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");

const populateConfig = [
  { path: "user", select: "username avatar" },
  {
    path: "comments",
    populate: [
      { path: "user", select: "username avatar" },
      { path: "likes", select: "username" },
    ],
  },
];

exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ message: "Фото обязательно" });
    const imagePath = req.file.path || req.file.filename;
    const newPost = new Post({ image: imagePath, caption, user: userId });
    await newPost.save();
    await User.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });
    const populatedPost = await newPost.populate(populateConfig);
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Create Post Error:", error);
    res
      .status(500)
      .json({ message: "Ошибка при создании поста", error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не найден" });
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Нет прав на редактирование" });
    }
    post.caption = caption;
    await post.save();
    const updatedPost = await post.populate(populateConfig);
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении поста" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate(populateConfig)
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении постов" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate(populateConfig)
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при получении постов пользователя" });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const posts = await Post.find({
      user: { $in: [...currentUser.following, req.user.id] },
    })
      .populate(populateConfig)
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Ошибка ленты" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не найден" });
    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { returnDocument: "after" },
    ).populate(populateConfig);

    if (post.user.toString() !== userId) {
      if (!isLiked) {
        const newNotif = await Notification.create({
          receiver: post.user,
          sender: userId,
          type: "like",
          post: post._id,
        });
        const populatedNotif = await Notification.findById(newNotif._id)
          .populate("sender", "username avatar")
          .populate("post", "image");
        const receiverIdStr = post.user.toString();
        const receiverSocketId = global.getReceiverSocketId(receiverIdStr);

        console.log(
          `Socket Debug: Отправка уведомления для ${receiverIdStr}. SocketID: ${receiverSocketId}`,
        );

        if (receiverSocketId && req.io) {
          req.io.to(receiverSocketId).emit("getNotification", populatedNotif);
        }
      } else {
        await Notification.findOneAndDelete({
          receiver: post.user,
          sender: userId,
          type: "like",
          post: post._id,
        });
      }
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при лайке" });
  }
};

exports.getExplorePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const excludeIds = [...currentUser.following, req.user.id];
    const posts = await Post.find({ user: { $nin: excludeIds } })
      .populate(populateConfig)
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Ошибка Explore" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(populateConfig);
    if (!post) return res.status(404).json({ message: "Пост не найден" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не найден" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Нет прав" });
    await User.findByIdAndUpdate(post.user, { $pull: { posts: post._id } });
    await post.deleteOne();
    res.json({ message: "Пост удален" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка удаления" });
  }
};
