const User = require("../model/User");
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  const users = await User.find();
  if (!users) {
    return res
      .status(204)
      .json({ message: "Nie znaleziono żadnych użytkowników" });
  }
  res.json(users);
};

const deleteUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "User ID required" });
  }
  id = req.params.id;

  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(204).json({ message: `No user matches ID ${id}` });
  }
  const result = await user.deleteOne();

  res.json(result);
};

const getUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    return res
      .status(204)
      .json({ message: `No user matches ID ${req.body.id}` });
  }
  res.json(user);
};

// @route PATCH /users/:id
const updateUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID użytkownika jest wymagane" });
  }
  id = req.params.id;

  const { username, roles, email, firstName, lastName, password } = req.body;

  if (
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    !email ||
    !firstName ||
    !lastName
  ) {
    return res
      .status(400)
      .json({ message: "Wszystkie pola poza hasłem są wymagane" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res
      .status(400)
      .json({ message: "Nie znaleziono użytkownika o podanym ID" });
  }

  const duplicateUsername = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  const duplicateEmail = await User.findOne({ email })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (
    (duplicateUsername && duplicateUsername?._id.toString() !== id) ||
    (duplicateEmail && duplicateEmail?._id.toString() !== id)
  ) {
    return res
      .status(409)
      .json({ message: "Użytkownik o takiej nazwie lub mailu już istnieje!" });
  }

  user.username = username;
  user.roles = roles;
  user.email = email;
  user.firstName = firstName;
  user.lastName = lastName;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({
    message: `Użytkownik '${updatedUser.username}' został zaaktualizowany`,
  });
};

module.exports = {
  getAllUsers,
  deleteUser,
  getUser,
  updateUser,
};
