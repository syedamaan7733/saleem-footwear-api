const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { logIn } = require("./authControllers");

const addToCart = async (req, res) => {
  const { productId, quantity, itemSet, color } = req.body;
  const userId = req.user.userId;
  // console.log(req.user.role);

  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomError.NotFoundError("Product not found");
    }

    const price = product.price * quantity;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0, totalItems: 0 });
    }

    // Check if the item already exists in the cart with the same productId, color, and itemSet
    const existingCartItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.color === color &&
        JSON.stringify(item.itemSet) === JSON.stringify(itemSet)
    );

    if (existingCartItem) {
      // Update the existing cart item's quantity and price
      existingCartItem.quantity += quantity;
      existingCartItem.price += price;
    } else {
      // Create a new CartItem
      const cartItem = new CartItem({
        productId,
        quantity,
        price,
        itemSet,
        color,
      });
      cart.items.push(cartItem);
    }

    cart.totalPrice += price;
    cart.totalItems += quantity;

    await cart.save();

    res.status(StatusCodes.CREATED).json({ success: true, data: cart });
  } catch (error) {
    throw new CustomError.BadRequestError(error.message);
  }
};

const getCart = async (req, res) => {
  const userId = req.user.userId;

  // Retrieve the cart and populate the productId
  let cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    cart = {
      userId,
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };
    return res.status(StatusCodes.OK).json({ data: cart });
  }

  // Sort the items within the cart by the createdAt field
  cart.items.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt); // Ascending order (oldest first)
    // To sort in descending order (newest first), use:
    // return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.status(StatusCodes.OK).json({ data: cart });
};

const removeitem = async (req, res) => {
  //   const { cartItemId } = req.params.id;
  const userId = req.user.userId;
  //   console.log(req.params.id);
  //   console.log(userId);

  // Find the user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new CustomError.NotFoundError("Cart is empty.");
  }

  // Find the CartItem
  const cartItem = cart.items.id(req.params.id);
  //   console.log(cartItem);

  if (!cartItem) {
    throw new Error("CartItem not found");
  }

  //   Remove the CartItem from the cart
  cart.items.pull(cartItem._id);
  cart.totalPrice -= cartItem.price;
  cart.totalItems -= cartItem.quantity;

  await cart.save();
  const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
  res.status(StatusCodes.OK).json({ success: true, data: updatedCart });
};

const updateCartItem = async (req, res) => {
  const userId = req.user.userId;
  const cartItemId = req.params.id;
  const { quantity, itemSet, color } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = cart.items.id(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "CartItem not found" });
    }

    const product = await Product.findById(cartItem.productId);
    if (!product) {
      throw new CustomError.NotFoundError("Product not found");
    }

    if (quantity !== undefined) {
      const nextQty = Number(quantity);
      if (Number.isNaN(nextQty) || nextQty < 1) {
        cart.items.pull(cartItemId);
      } else {
        cartItem.quantity = nextQty;
        cartItem.price = product.price * nextQty;
      }
    }
    if (itemSet !== undefined) {
      cartItem.itemSet = itemSet;
    }
    if (color !== undefined) {
      cartItem.color = color;
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    await cart.save();
    const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
    res.status(StatusCodes.OK).json({
      msg: "cart have been updated",
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
module.exports = { addToCart, getCart, removeitem, updateCartItem };
