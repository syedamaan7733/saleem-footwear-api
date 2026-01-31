const mongoose = require("mongoose");

const categoriesImagesSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Please provide category name"],
    },
    imageUrl: {
      type: String,
      required: [true, "Please provide image URL"],
    },
    article: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "categoriesImages",
  }
);

module.exports = mongoose.model("CategoriesImages", categoriesImagesSchema);
