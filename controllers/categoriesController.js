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

  if (name?.length > 24 || name?.length < 3) {
    return res
      .status(400)
      .json({ message: "Nazwa powinna zawierać od 3 do 24 znaków." });
  }

  const category = await Category.create({ name });

  if (category) {
    return res
      .status(201)
      .json({ message: "Nowa kategoria została utworzona" });
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

// @route PATCH /categories/:id
const changeCategoryName = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID kategorii jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const { newName } = req.body;
  if (!newName) {
    return res.status(400).json({ message: "Nie podano nowej nazwy" });
  }

  if (newName?.length > 24 || newName?.length < 3) {
    return res
      .status(400)
      .json({ message: "Nowa nazwa powinna zawierać od 3 do 24 znaków." });
  }

  const category = await Category.findOne({ _id: id });
  if (!category) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono kategorii o ID: ${req.params.id}` });
  }

  category.name = newName;
  await category.save();

  res.json("Nazwa kategorii została zaaktualizowana");
};

module.exports = {
  getAllCategories,
  createNewCategory,
  changeCategoryName,
  deleteCategory,
};
