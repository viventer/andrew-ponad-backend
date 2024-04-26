const Post = require("../model/Post");
const User = require("../model/User");

const checkIfAllExist = require("../helpers/checkIfAllExist");

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

  const postsWithUser = await Promise.all(
    finalPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();
      return { ...post, username: user?.username };
    })
  );

  res.json(postsWithUser);
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

  const isAuthorized = await checkIfAuthorized(post, req);
  if (isAuthorized) {
    return res.json(post);
  }

  return res.status(403).json({ message: "Nie masz uprawnień do tego posta" });
};

// @route POST /posts
const createNewPost = async (req, res) => {
  const { author, title, thumbnail, visibility, content, category } = req.body;

  const allExist = checkIfAllExist([
    author,
    title,
    visibility,
    content,
    category,
  ]);

  if (!allExist) {
    return res.status(400).json({ message: "Uzupełnij wymgane pola" });
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

// @route PATCH /posts/:id
const updatePost = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const { author, title, thumbnail, visibility, content, category } = req.body;

  const allExist = checkIfAllExist([
    id,
    author,
    title,
    thumbnail,
    visibility,
    content,
    category,
  ]);
  if (!allExist) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane" });
  }

  const post = await Post.findById(id).exec();
  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  const creator = await User.findById(post.author).exec();
  console.log(post);
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

  const duplicate = await Post.findOne({ title })
    .collation({ locale: "pl", strength: 2 })
    .lean()
    .exec();

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

const checkIfEmpty = (postsList) => {
  return postsList.length == 0;
};

const checkIfAuthorized = async (post, req) => {
  const user = await User.findById(post.author).lean().exec();

  if (user?.username === req.username) {
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
  console.log(req.roles);
  console.log(creator.username);
  console.log(req.username);
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

module.exports = {
  getAllPosts,
  getPost,
  createNewPost,
  updatePost,
  deletePost,
  addPostView,
};
