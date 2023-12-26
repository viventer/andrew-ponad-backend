const Post = require("../model/Post");
const User = require("../model/User");

// @route GET /posts
const getAllPosts = async (req, res) => {
  const posts = await Post.find().lean();

  if (!posts?.length) {
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
    filteredPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();

      if (user.username === req.username) {
        return true;
      } else if (["unlisted", "private", "draft"].includes(post.visibility)) {
        return false;
      } else if (
        post.visibility === "verifiedOnly" &&
        (req?.roles?.toString() === ["User"].toString() || !req.isLoggedIn)
      ) {
        return false;
      } else {
        return true;
      }
    })
  );

  const finalPosts = filteredPosts.filter(
    (post, index) => authorizedPosts[index]
  );

  if (!finalPosts?.length) {
    return res.status(400).json({ message: "Nie znaleziono postów" });
  }

  const postsWithUser = await Promise.all(
    finalPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();
      return { ...post, username: user.username };
    })
  );

  res.json(postsWithUser);
};

// @route GET /posts/byFilter
const getPostsByFilter = async (req, res) => {
  const filter = req.body.filter;

  if (!filter || !filter.type || !filter.value) {
    return res.status(400).json({ message: "Podaj filtr" });
  }

  const posts = await Post.find().lean();

  if (!posts?.length) {
    return res.status(400).json({ message: "Nie znaleziono postów" });
  }

  const filteredPosts = posts.map((post) => {
    if (filter.value == post[filter.type]) {
      return true;
    } else {
      return false;
    }
  });

  const authorizedPosts = await Promise.all(
    filteredPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();

      if (user.username === req.username) {
        return true;
      } else if (["unlisted", "private", "draft"].includes(post.visibility)) {
        return false;
      } else if (
        post.visibility === "verifiedOnly" &&
        (req?.roles?.toString() === ["User"].toString() || !req.isLoggedIn)
      ) {
        return false;
      } else {
        return true;
      }
    })
  );

  const finalPosts = posts.filter((post, index) => authorizedPosts[index]);

  if (!finalPosts?.length) {
    return res.status(400).json({ message: "Nie znaleziono postów" });
  }

  const postsWithUser = await Promise.all(
    finalPosts.map(async (post) => {
      const user = await User.findById(post.author).lean().exec();
      return { ...post, username: user.username };
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

  const post = await Post.findOne({ _id: id });
  if (!post) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono posta o ID: ${req.params.id}` });
  }

  const user = await User.findById(post.author).lean().exec();

  if (user.username === req.username) {
    return res.json(post);
  } else if (["private", "draft"].includes(post.visibility)) {
    return res
      .status(403)
      .json({ message: "Nie masz uprawnień do tego posta" });
  } else if (
    post.visibility === "verifiedOnly" &&
    (req?.roles?.toString() === ["User"].toString() || !req.isLoggedIn)
  ) {
    return res
      .status(403)
      .json({ message: "Nie masz uprawnień do tego posta" });
  } else {
    return res.json(post);
  }
};

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

// @route PATCH /posts/:id
const updatePost = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID posta jest wymagane" });
  }
  const id = req.params.id;

  const { author, title, thumbnail, visibility, content, category } = req.body;

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

  const creator = await User.findById(author).exec();
  if (!creator) {
    return res
      .status(400)
      .json({ message: "Użytkownik o podanym ID autora nie istnieje" });
  }

  if (
    creator.username != req.username &&
    !req.roles.includes("Admin") &&
    !req.roles.includes("Editor")
  ) {
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

  if (
    creator.username != req.username &&
    !req.roles.includes("Admin") &&
    !req.roles.includes("Editor")
  ) {
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

  const post = await Post.findById(id).exec();
  if (!post) {
    return res.status(400).json({ message: "Nie odnaleziono posta" });
  }

  post.views += 1;

  const updatedPost = await post.save();

  res.json(`Post: '${updatedPost.title}' został zaaktualizowany`);
};

module.exports = {
  getAllPosts,
  getPost,
  createNewPost,
  updatePost,
  deletePost,
  getPostsByFilter,
  addPostView,
};
