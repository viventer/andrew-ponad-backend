const User = require("../model/User");

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
  if (!req?.body?.id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const user = await User.findOne({ _id: req.body.id });
  if (!user) {
    return res
      .status(204)
      .json({ message: `No user matches ID ${req.body.id}` });
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

module.exports = {
  getAllUsers,
  deleteUser,
  getUser,
};
