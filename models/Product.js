const mongoose = require("mongoose");

/**
 * Schema for product item sets (size and quantity information)
 */
const setSchema = new mongoose.Schema({
  size: {
    type: String,
    required: [true, "Please provide set size"],
  },
  lengths: {
    type: Number,
    required: [true, "Please provide set length"],
  },
  _id: false,
});

/**
 * Schema for tracking stock availability per color
 */
const colorStockSchema = new mongoose.Schema({
  color: {
    type: String,
    required: [true],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  _id: false,
});

/**
 * Product Schema
 * Represents footwear products with multiple color variants and sizes
 */
const productSchema = new mongoose.Schema(
  {
    // Brand information (indexed for performance)
    brand: {
      type: String,
      required: true,
      index: true,
    },

    // Product article/SKU number
    article: {
      type: String,
    },

    // Available size sets for this product
    itemSet: {
      type: [setSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Product must have at least one set.",
      },
    },

    // Product description
    description: String,

    // Category (indexed for filtering)
    category: {
      type: String,
      index: true,
    },

    // Color variants with their associated images
    // Map structure: { "RED": ["img1.jpg", "img2.jpg"], "BLUE": ["img3.jpg"] }
    colors: {
      type: Map,
      of: [String],
      required: true,
    },

    // Stock availability per color (auto-synced with colors Map)
    colorsStock: {
      type: [colorStockSchema],
    },

    // Product pricing
    price: {
      type: Number,
      required: true,
    },

    // Product images (all color variants)
    images: [String],

    // Material type (indexed for filtering)
    material: { 
      type: String, 
      index: true 
    },

    // Target gender
    gender: String,

    // Overall stock availability
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Pre-save middleware to automatically sync colorsStock with colors Map
 * Ensures colorsStock array matches the keys in the colors Map
 */
productSchema.pre("save", function (next) {
  // Only run if colors field was modified
  if (!this.isModified("colors")) return next();

  // Extract color names from the colors Map
  const colorKeys = Array.from(this.colors.keys());
  
  // Create a map of existing stock statuses to preserve them
  const existingStockMap = new Map(
    this.colorsStock.map(({ color, inStock }) => [color, inStock])
  );

  // Rebuild colorsStock array to match current colors
  // Preserve existing stock status if available, default to true for new colors
  this.colorsStock = colorKeys.map((color) => ({
    color,
    inStock: existingStockMap.has(color) ? existingStockMap.get(color) : true,
  }));

  next();
});

// Performance indexes
productSchema.index({ createdAt: -1 }); // For sorting by latest

module.exports = mongoose.model("Product", productSchema);
