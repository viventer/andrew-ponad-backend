const checkIfAllExist = require("../helpers/checkIfAllExist");
const User = require("../model/User");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;

  if (!checkIfAllExist([username, password, firstName, lastName, email]))
    return res.status(400).json({ message: "Uzupełnij wszystkie pola!" });

  const duplicateUsername = await User.findOne({ username }).exec();
  const duplicateEmail = await User.findOne({ email }).exec();
  if (duplicateUsername || duplicateEmail) return res.sendStatus(409);

  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    const result = await User.create({
      username,
      firstName,
      lastName,
      email,
      password: hashedPwd,
    });

    res
      .status(201)
      .json({ success: `Nowy użytkownik '${username}' został utworzony!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const validateUsername = (username) => {
  /*
  Requirements:
  - min. 3 chars
  - max. 20 chars
  - only letters (big and small), numbers, and these special characters: .-_
  - no whitespaces
  - no special characters on the start and end
  - two special characters mustn't be next to each other
  - must contain at least 2 letters
  */
  const regex =
    /^(?=[a-zA-Z0-9.-_]{3,20}$)(?=\D*\d)(?!.*[\s])(?!.*[.-_]{2,})[^.-_].*[^.-_]$/;

  if (regex.test(username)) {
    return true;
  } else {
    return false;
  }
};

const validatePassword = (password) => {};

const validateEmail = (email) => {};

const validateName = (email) => {};

module.exports = {
  handleNewUser,
};
