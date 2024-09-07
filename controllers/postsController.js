const Post = require("../model/Post");
const Category = require("../model/Category");
const User = require("../model/User");

const checkIfAllExist = require("../helpers/checkIfAllExist");
const checkIfEmpty = require("../helpers/checkIfEmpty");

// @route GET /posts
const getAllPosts = async (req, res) => {
  const posts = await Post.find({}, { content: 0 }).lean();

  let isEmpty = checkIfEmpty(posts);
  if (isEmpty) {
    return res.status(400).json({ message: "Nie znaleziono postów" });
  }

  const filter = req?.body?.filter;

  let filteredPosts = posts;
  if (filter && filter.type && filter.value) {
    const filterAsync = async (post) => {
      const user = await User.findById(post.author).lean().exec();
      post.username = user.username;
      return filter.value == post[filter.type];
    };

    const filterPromises = posts.map(filterAsync);

    const results = await Promise.all(filterPromises);

    filteredPosts = posts.filter((post, index) => results[index]);
  }

  const authorizedPosts = await Promise.all(
    filteredPosts.map((post) => checkIfAuthorized(post, req))
  );

  const finalPosts = filteredPosts.filter(
    (post, index) => authorizedPosts[index]
  );

  isEmpty = checkIfEmpty(posts);
  if (isEmpty) {
    return res
      .status(400)
      .json({ message: "Nie znaleziono postów do których masz dostęp" });
  }

  const postsWithUsernameAndCategoryName = await Promise.all(
    finalPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();
      const category = await Category.findById(post.category).lean().exec();
      let categoryName;
      if (category) {
        categoryName = category.name;
      }
      return { ...post, username: user?.username, categoryName };
    })
  );

  res.json(postsWithUsernameAndCategoryName);
};

// @route GET /posts/:id
const getPost = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const post = await Post.findOne({ _id: id });
  if (!post) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono posta o ID: ${req.params.id}` });
  }

  const category = await Category.findById(post.category).lean().exec();
  let categoryName;

  if (category) {
    categoryName = category.name;
  }

  const cleanPost = post.toObject({ virtuals: true });
  let postWithCategoryName = { ...cleanPost, categoryName };

  const isAuthorized = await checkIfAuthorized(post, req);
  if (isAuthorized) {
    return res.json(postWithCategoryName);
  }

  return res.status(401).json({ message: "Nie masz uprawnień do tego posta" });
};

// @route POST /posts
const createNewPost = async (req, res) => {
  const { author, title, thumbnail, visibility, content, categoryName } =
    req.body;

  const allExist = checkIfAllExist([author, visibility, content]);

  if (!allExist) {
    return res.status(400).json({ message: "Uzupełnij wymagane pola" });
  }

  const foundCategory = await Category.findOne({ name: categoryName });
  let category;
  if (foundCategory) {
    category = foundCategory._id;
  }

  if (title?.length > 40) {
    return res.status(400).json({ message: "Tytuł posta jest zbyt długi" });
  }

  const postWithSameTitle = await Post.findOne({ title });
  if (postWithSameTitle) {
    return res.status(409).json({ message: "Post o tym tytule już istnieje" });
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
    if (category) {
      connectPostToCategory(category, post._id);
    }
    return res
      .status(201)
      .json({ message: "Nowy post został utworzony", id: post._id });
  } else {
    return res.status(400).json({ message: "Niepoprawne dane posta" });
  }
};

// @route PATCH /posts/:id
const updatePost = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const { author, title, thumbnail, visibility, content, categoryName } =
    req.body;

  const allExist = checkIfAllExist([id, author, visibility, content]);
  if (!allExist) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane" });
  }

  if (title?.length > 40) {
    return res.status(400).json({ message: "Tytuł posta jest zbyt długi" });
  }

  const post = await Post.findById(id).exec();
  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  const postWithSameTitle = await Post.findOne({ title });
  if (postWithSameTitle && post.title != title && title != "Bez tytułu") {
    return res.status(409).json({ message: "Post o tym tytule już istnieje" });
  }

  const creator = await User.findById(post.author).exec();
  if (!creator) {
    return res
      .status(400)
      .json({ message: "Użytkownik o podanym ID autora nie istnieje" });
  }

  const canEdit = checkIfCanEdit(creator, req);
  if (!canEdit) {
    return res
      .status(403)
      .json({ message: "Możesz edytować tylko swoje posty!" });
  }

  const oldPostCategoryId = post?.category?.toString();
  const foundOldCategory = await Category.findOne({ _id: oldPostCategoryId });
  const foundNewCategory = await Category.findOne({ name: categoryName });

  post.author = author;
  post.title = title;
  post.thumbnail = thumbnail;
  post.visibility = visibility;
  post.content = content;

  if (
    foundNewCategory &&
    foundNewCategory._id.toString() != oldPostCategoryId
  ) {
    post.category = foundNewCategory._id;
    try {
      if (foundOldCategory) {
        disconnectPostFromCategory(oldPostCategoryId, post._id);
      }
      connectPostToCategory(foundNewCategory._id, post._id);
    } catch (error) {
      return res
        .status(204)
        .json({ message: "Podana kategoria jest nieprawidłowa." });
    }
  }

  const updatedPost = await post.save();
  res.json(`Post: '${updatedPost.title}' został zaaktualizowany`);
};

// @route DELETE /posts/:id
const deletePost = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const post = await Post.findById(id).exec();

  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  const creator = await User.findById(post.author).exec();
  if (!creator) {
    return res
      .status(400)
      .json({ message: "Użytkownik o podanym ID autora nie istnieje" });
  }

  const canEdit = checkIfCanEdit(creator, req);
  if (!canEdit) {
    return res
      .status(403)
      .json({ message: "Możesz usuwać tylko swoje posty!" });
  }

  try {
    disconnectPostFromCategory(post.category, post._id);
  } catch (error) {
    return res.status(204).json({ message: "Podana kategoria nie istnieje." });
  }

  const result = await post.deleteOne();

  const reply = `Post '${post.title}' o ID: ${post._id} został usunięty`;

  res.json(reply);
};

const addPostView = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const post = await Post.findById(id).exec();
  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  post.views += 1;

  const updatedPost = await post.save();

  res.json(`Post: '${updatedPost.title}' został zaaktualizowany`);
};

const checkIfAuthorized = async (post, req) => {
  const user = await User.findById(post.author).lean().exec();

  if (
    user?.username === req.username ||
    req?.roles?.includes("Admin") ||
    req?.roles?.includes("Editor")
  ) {
    return true;
  } else if (["private", "draft"].includes(post.visibility)) {
    return false;
  } else if (
    post.visibility === "verifiedOnly" &&
    (req?.roles?.toString() === ["User"].toString() || !req.isLoggedIn)
  ) {
    return false;
  } else {
    return true;
  }
};

const checkIfCanEdit = (creator, req) => {
  if (
    creator.username !== req.username &&
    !req.roles.includes("Admin") &&
    !req.roles.includes("Editor")
  ) {
    return false;
  } else {
    return true;
  }
};

const disconnectPostFromCategory = async (categoryId, postId) => {
  const category = await getCategory(categoryId);
  if (!category) {
    return;
  }

  category.connectedPosts = category.connectedPosts.filter(
    (connectedPostId) => connectedPostId.toString() != postId
  );
  await category.save();
};

const connectPostToCategory = async (categoryId, postId) => {
  const category = await getCategory(categoryId);
  category.connectedPosts = [...category.connectedPosts, postId];
  await category.save();
};

const getCategory = async (categoryId) => {
  const category = await Category.findOne({ _id: categoryId });
  if (!category) {
    return;
  } else {
    return category;
  }
};

module.exports = {
  getAllPosts,
  getPost,
  createNewPost,
  updatePost,
  deletePost,
  addPostView,
};
