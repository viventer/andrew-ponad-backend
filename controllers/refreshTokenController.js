const User = require("../model/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  console.log("cookies:", cookies);
  if (!cookies?.jwt)
    return res.status(401).json({ message: "Problem with cookies" });
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none" });

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate a new refresh token
    const newRefreshToken = jwt.sign(
      { username: decoded.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Find and update the user by the username in the decoded token
    const updatedUser = await User.findOneAndUpdate(
      { username: decoded.username },
      { $addToSet: { newRefreshToken } }, // Add new refresh token to the array if not already present
      { $pull: { refreshToken } },
      { new: true, upsert: false } // Return the updated document and do not create new document if not found
    );

    if (!updatedUser) {
      return res.sendStatus(403);
    }

    // Set the new refresh token in the cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
    });

    // Generate a new access token
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: updatedUser.username,
          roles: Object.values(updatedUser.roles),
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    // Send the new access token in the response
    res.json({ accessToken, userId: updatedUser.id });
  } catch (err) {
    console.error("Error handling refresh token:", err);
    return res.sendStatus(403);
  }
};

module.exports = { handleRefreshToken };
