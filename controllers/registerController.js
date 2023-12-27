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

module.exports = {
  handleNewUser,
};
