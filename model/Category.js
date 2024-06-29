const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  connectedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: [],
      ref: "Post",
    },
  ],
});

module.exports = mongoose.model("Category", categorySchema);
