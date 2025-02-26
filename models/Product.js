const mongoose = require("mongoose");

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

// Define a Product schema
const productSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
    },
    article: {
      type: String,
    },
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
    description: String,
    category: String,
    colors: {
      type: Map,
      of: [String],
      required: true,
    },
    colorsStock: {
      type: [colorStockSchema],
    }, // An array of available colors
    //   size: [String], // An array of available sizes
    price: {
      type: Number,
      required: true,
    },
    // discount: Number,
    // stock_quantity: {
    //   type: Number,
    //   default: 0,
    // },
    images: [String],
    material: String,
    gender: String,
    inStock: {
      type: Boolean,
      default: true,
    },
    // style: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware to sync the colorStock on creation and updatation.
productSchema.pre("save", function (next) {
  if (!this.isModified("colors")) return next(); // only trigger during the color changes or creation

  const colorKeys = Array.from(this.colors.keys());
  const existingStockMap = new Map(
    this.colorsStock.map(({ color, inStock }) => [color, inStock])
  );

  // creating a new colorStock
  this.colorsStock = colorKeys.map((color) => ({
    color,
    inStock: existingStockMap.has(color) ? existingStockMap.get(color) : true,
  }));
  console.log("-------------------------------------------");
  console.log("colorKeys:", colorKeys);
  console.log("existingStockMap", existingStockMap);
  console.log("colorStock", this.colorsStock);
  console.log("colors", this.colors);

  console.log("-------------------------------------------");
  next();
});
// Create the Product model

module.exports = mongoose.model("Product", productSchema);
