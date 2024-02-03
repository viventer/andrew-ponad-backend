const checkIfAllExist = require("../helpers/checkIfAllExist");

const bcrypt = require("bcrypt");

const {
  validateUsername,
  validatePassword,
  validateEmail,
  validateName,
  validateOffensiveness,
} = require("../helpers/validations");

const User = require("../model/User");

const handleNewUser = async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;

  if (!checkIfAllExist([username, password, firstName, lastName, email]))
    return res.status(400).json({ message: "Uzupełnij wszystkie pola!" });

  const duplicateUsername = await User.findOne({ username }).exec();
  const duplicateEmail = await User.findOne({ email }).exec();
  if (duplicateUsername || duplicateEmail) return res.sendStatus(409);

  const isUsernameValid = validateUsername(username);
  const isPasswordValid = validatePassword(password);
  const isNameValid = validateName(firstName, lastName);
  const isEmailValid = validateEmail(email);
  const isOffensive = validateOffensiveness([
    username,
    firstName,
    lastName,
    email,
  ]);

  if (!isUsernameValid || !isPasswordValid || !isEmailValid || !isNameValid) {
    return res
      .status(400)
      .json({ message: "Przesłane dane są nieprawidłowe." });
  }

  if (isOffensive) {
    return res
      .status(422)
      .json({ message: "Twoje dane zawierają obraźliwe słowa." });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    const hashedPwd = await bcrypt.hash(password, 10);
    const result = await User.create({
      username,
      firstName,
      lastName,
      email: emailLowerCase,
      password: hashedPwd,
    });

    res
      .status(201)
      .json({ success: `Nowy użytkownik '${username}' został utworzony!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  handleNewUser,
};
