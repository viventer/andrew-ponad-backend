const User = require("../model/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  console.log("cookies:", cookies);
  if (!cookies?.jwt)
    return res.status(401).json({ message: "Problem with cookies" });
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true });

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user by the username in the decoded token
    const foundUser = await User.findOne({ username: decoded.username }).exec();

    if (!foundUser) {
      return res.sendStatus(403);
    }

    // Remove the old refresh token from the user's array
    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    // Generate a new refresh token
    const newRefreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Add the new refresh token to the user's array
    foundUser.refreshToken.push(newRefreshToken);

    // Save the updated user document
    await foundUser.save();

    // Generate a new access token
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: Object.values(foundUser.roles),
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    // Set the new refresh token in the cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Send the new access token in the response
    res.json({ accessToken, userId: foundUser.id });
  } catch (err) {
    console.error("Error handling refresh token:", err);
    return res.sendStatus(403);
  }
};

module.exports = { handleRefreshToken };
