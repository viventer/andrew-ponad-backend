const User = require("../model/User");
const bcrypt = require("bcrypt");
const checkIfAllExist = require("../helpers/checkIfAllExist");
const {
  validateUsername,
  validateOffensiveness,
  validateEmail,
  validateName,
  validatePassword,
} = require("../helpers/validations");

// @route GET /users
const getAllUsers = async (req, res) => {
  const users = await User.find();
  if (!users) {
    return res
      .status(204)
      .json({ message: "Nie znaleziono żadnych użytkowników" });
  }
  res.json(users);
};

// @route DELETE /users/:id
const deleteUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID użytkownika jest wymagane" });
  }
  id = req.params.id;

  const user = await User.findOne({ _id: id });
  if (!user) {
    return res
      .status(204)
      .json({ message: `Nie ma użytkownika o podanym id: ${id}` });
  }

  if (req.username !== user.username && !req.roles.includes("Admin")) {
    return res
      .status(401)
      .json({ message: "Nie masz dostępu do innych użytkowników" });
  }

  const result = await user.deleteOne();

  res.json(result);
};

// @route GET /users/:id
const getUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "Wymagane ID użytkownika" });
  }

  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    return res
      .status(204)
      .json({ message: `Nie ma użytkownika o podanym id: ${req.body.id}` });
  }

  if (req.username !== user.username && !req.roles.includes("Admin")) {
    res
      .status(401)
      .json({ message: "Nie masz dostępu do innych użytkowników" });
  } else {
    res.json(user);
  }
};

// @route PATCH /users/:id
const updateUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID użytkownika jest wymagane" });
  }
  id = req.params.id;

  const { username, roles, email, firstName, lastName, password } = req.body;

  console.log(req.body);

  if (!checkIfAllExist([username, roles])) {
    return res
      .status(400)
      .json({ message: "Nazwa użytkownika i role są wymagane" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res
      .status(400)
      .json({ message: "Nie znaleziono użytkownika o podanym ID" });
  }

  if (req.username !== user.username && !req.roles.includes("Admin")) {
    return res
      .status(401)
      .json({ message: "Nie masz dostępu do innych użytkowników" });
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

  if (req.roles.includes("Admin")) user.roles = roles;
  if (username) {
    const isUsernameValid = validateUsername(username);
    if (!isUsernameValid) {
      return res
        .status(400)
        .json({ message: "Przesłane dane są nieprawidłowe." });
    }
    user.username = username;
  }
  if (email) {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return res
        .status(400)
        .json({ message: "Przesłane dane są nieprawidłowe." });
    }
    user.email = email;
  }
  if (firstName && lastName) {
    const isNameValid = validateName(firstName, lastName);
    if (!isNameValid) {
      return res
        .status(400)
        .json({ message: "Przesłane dane są nieprawidłowe." });
    }
    user.firstName = firstName;
    user.lastName = lastName;
  }
  if (password) {
    const isPasswordValid = validatePassword(password);
    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Przesłane dane są nieprawidłowe." });
    } else if (isPasswordSame) {
      return res
        .status(400)
        .json({ message: "Nowe hasło musi być inne od starego" });
    }
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
