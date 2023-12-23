const Post = require("../model/Post");
const User = require("../model/User");

// @desc Get all posts
// @route GET /posts
const getAllPosts = async (req, res) => {
  const posts = await Post.find().lean();

  if (!posts?.length) {
    return res.status(400).json({ message: "Nie znaleziono postów" });
  }

  const postsWithUser = await Promise.all(
    posts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();
      return { ...post, username: user.username };
    })
  );

  res.json(postsWithUser);
};

// @desc Create new post
// @route POST /posts
const createNewPost = async (req, res) => {
  const { author, title, thumbnail, visibility, content, category } = req.body;

  if (!author || !title || !thumbnail || !visibility || !content || !category) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane" });
  }

  const duplicate = await Post.findOne({ title })
    .collation({ locale: "pl", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res
      .status(409)
      .json({ message: "Post o takim tytule już istnieje" });
  }

  const post = await Post.create({
    author,
    title,
    thumbnail,
    visibility,
    content,
    category,
  });

  if (post) {
    return res.status(201).json({ message: "Nowy post został utworzony" });
  } else {
    return res.status(400).json({ message: "Niepoprawne dane posta" });
  }
};

// @desc Update a post
// @route PATCH /posts
const updatePost = async (req, res) => {
  const { id, author, title, thumbnail, visibility, content, category } =
    req.body;

  if (
    !id ||
    !author ||
    !title ||
    !thumbnail ||
    !visibility ||
    !content ||
    !category
  ) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane" });
  }

  const post = await Post.findById(id).exec();

  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  // Check for duplicate title
  const duplicate = await Post.findOne({ title })
    .collation({ locale: "pl", strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original post
  if (duplicate && duplicate?._id.toString() !== id) {
    return res
      .status(409)
      .json({ message: "Post o takim tytule już istnieje" });
  }

  post.author = author;
  post.title = title;
  post.thumbnail = thumbnail;
  post.visibility = visibility;
  post.content = content;
  post.category = category;

  const updatedPost = await post.save();

  res.json(`Post: "${updatedPost.title}" został zaaktualizowany`);
};

// @desc Delete a post
// @route DELETE /posts
const deletePost = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Wymagane ID posta" });
  }

  const post = await Post.findById(id).exec();

  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  const result = await post.deleteOne();

  const reply = `Post "${result.title}" o ID: ${result._id} został usunięty`;

  res.json(reply);
};

module.exports = {
  getAllPosts,
  createNewPost,
  updatePost,
  deletePost,
};
