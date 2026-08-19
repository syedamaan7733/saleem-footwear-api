const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    itemSet: [
      {
        size: String,
        lengths: Number,
      },
    ],
    color: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    // Includes the web-admin vocabulary (accepted/rejected) alongside the
    // fulfilment states so status writes validate instead of silently storing
    // out-of-enum values.
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "accepted",
      "rejected",
    ],
    default: "pending",
  },
  deliveryAddress: {
    type: String,
    default: "",
    maxlength: 200,
  },
  pincode: {
    type: String,
    default: "",
    maxlength: 10,
  },
  landmark: {
    type: String,
    default: "",
    maxlength: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
