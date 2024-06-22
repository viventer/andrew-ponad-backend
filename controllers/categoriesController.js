const Category = require("../model/Category");
const Post = require("../model/Post");

const checkIfAllExist = require("../helpers/checkIfAllExist");
const checkIfEmpty = require("../helpers/checkIfEmpty");

// @router GET /categories
const getAllCategories = async (req, res) => {
  const categories = await Category.find({}).lean();

  let isEmpty = checkIfEmpty(categories);
  if (isEmpty) {
    return res.status(400).json({ message: "Nie znaleziono kategorii" });
  }

  const categoriesWithPostTitles = await Promise.all(
    categories.map(async (category) => {
      let postTitles = [];
      for (const postId of category.connectedPosts) {
        if (postId) {
          const post = await Post.findById(postId).lean().exec();
          if (post) {
            postTitles.push(post.title);
          }
        }
      }
      return { ...category, postTitles };
    })
  );

  res.json(categoriesWithPostTitles);
};

// @route POST /categories
const createNewCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nazwa kategorii jest wymagana" });
  }

  if (name?.length > 24) {
    return res.status(400).json({ message: "Nazwa kategorii jest zbyt długa" });
  }

  const category = await Category.create({ title });

  if (category) {
    return res
      .status(201)
      .json({ message: "Nowa kategoria została utworzona" });
  }
};

// @route PATCH /categories/:id
const changeConnectedPosts = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID kategorii jest wymagane" });
  }
  const categoryId = req.params.id;

  if (categoryId.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const category = await Category.findOne({ _id: categoryId });
  if (!category) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono kategorii o ID: ${req.params.id}` });
  }

  const { action, postId } = req.body;
  const allExist = checkIfAllExist([action, postId]);
  if (!allExist) {
    return res.status(400).json({ message: "Akcja i id posta są wymagane." });
  }

  const post = await Post.findById(postId).lean().exec();
  if (!post) {
    return res
      .status(204)
      .json({ message: "Nie znaleziono posta o podanym id." });
  }

  const hasCategory = post.category == categoryId;
  if (!hasCategory && action == "connect") {
    return res
      .status(204)
      .json({ message: "Post nie posiada podanej kategorii." });
  } else if (action == "connect") {
    category.connectedPosts = [...category.connectedPosts, postId];
    await category.save();
  } else if (!hasCategory && action == "disconnect") {
    category.connectedPosts = category.connectedPosts.filter(
      (post) => post._id != postId
    );
    await category.save();
  } else if (hasCategory && action == "disconnect") {
    return res
      .status(204)
      .json({
        message: "Post posiada podaną kategorię. Nie można go odłączyć.",
      });
  } else {
    return res
      .status(400)
      .json({ message: "Podana akcja jest nieprawidłowa." });
  }
};

// @route DELETE /categories/:id
const deleteCategory = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID kategorii jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const category = await Category.findOne({ _id: id });
  if (!category) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono kategorii o ID: ${req.params.id}` });
  }

  const hasConnectedPosts = category.connectedPosts.length > 0;
  if (hasConnectedPosts) {
    return res
      .status(400)
      .json({ message: "Nie możesz usunąć kategorii połączonej z postami." });
  }

  await category.deleteOne();

  res.json(`Kategoria o ID: ${id} została usunięta`);
};

module.exports = {
  getAllCategories,
  createNewCategory,
  changeConnectedPosts,
  deleteCategory,
};
