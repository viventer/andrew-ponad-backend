const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: false,
      default: "Bez tytułu",
    },
    thumbnail: {
      type: String,
      required: false,
    },
    visibility: {
      type: String,
      required: true,
    },
    content: {
      type: Array,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.plugin(AutoIncrement, {
  inc_field: "postNumber",
  id: "postNumber",
  start_seq: 0,
});

module.exports = mongoose.model("Post", postSchema);
