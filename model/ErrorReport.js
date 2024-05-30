const mongoose = require("mongoose");

const errorReportSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: Array,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ErrorReport", errorReportSchema);
