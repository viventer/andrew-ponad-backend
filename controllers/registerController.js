const checkIfAllExist = require("../helpers/checkIfAllExist");
const User = require("../model/User");
const bcrypt = require("bcrypt");
const passwordValidator = require("password-validator");

const handleNewUser = async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;

  if (!checkIfAllExist([username, password, firstName, lastName, email]))
    return res.status(400).json({ message: "Uzupełnij wszystkie pola!" });

  const duplicateUsername = await User.findOne({ username }).exec();
  const duplicateEmail = await User.findOne({ email }).exec();
  if (duplicateUsername || duplicateEmail) return res.sendStatus(409);

  const isUsernameValid = validateUsername(username);
  const isPasswordValid = validatePassword(password);
  // const isNameValid = validateName(firstName, lastName);
  // const isEmailValid = validateName(email);
  if (!isUsernameValid || !isPasswordValid) {
    return res
      .status(400)
      .json({ message: "Przesłane dane są nieprawidłowe." });
  }

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
  - only letters (big and small) or numbers or "_"
  - no whitespaces
  - no special characters on the start and end
  - two special characters mustn't be next to each other
  - must contain at least 2 letters
  */
  const regex =
    /^(?!.*_{2,})(?=.{1,20}$)[a-zA-Z0-9]*[a-zA-Z][a-zA-Z0-9]*_?[a-zA-Z0-9]*[a-zA-Z][a-zA-Z0-9]*[a-zA-Z0-9]$/;

  if (regex.test(username)) {
    return true;
  } else {
    return false;
  }
};

const validatePassword = (password) => {
  const schema = new passwordValidator();

  schema
    .is()
    .min(8) // min. 8 chars
    .has()
    .uppercase() // min. 1 uppercase letter
    .has()
    .lowercase() // min. 1 lowercase letter
    .has()
    .digits() // min. 1 digit
    .has()
    .not()
    .spaces() // no spaces
    .has()
    .symbols(); // min. 1 special character

  const isValid = schema.validate(password);
  if (isValid) {
    return true;
  } else {
    return false;
  }
};

const validateEmail = (email) => {};

const validateName = (firstName, lastName) => {};

module.exports = {
  handleNewUser,
};
