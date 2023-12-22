const User = require("../model/User");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;
  if (!username || !password || !firstName || !lastName || !email)
    return res.status(400).json({ message: "Uzupełnij wszystkie pola!" });
  const duplicate = await User.findOne({ username }).exec();
  if (duplicate) return res.sendStatus(409);
  try {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const result = await User.create({
      username: username,
      password: hashedPwd,
    });

    console.log(result);

    res
      .status(201)
      .json({ success: `Nowy użytkownik ${username} został utworzony!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  handleNewUser,
};
