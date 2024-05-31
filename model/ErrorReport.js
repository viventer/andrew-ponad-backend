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
    description: {
      type: String,
      required: true,
    },
    images: {
      type: Array,
      required: false,
    },
    status: {
      type: String,
      required: false,
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ErrorReport", errorReportSchema);
