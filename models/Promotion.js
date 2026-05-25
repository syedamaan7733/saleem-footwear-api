const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      required: [true, "Please provide a promotion image"],
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

promotionSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model("Promotion", promotionSchema);
