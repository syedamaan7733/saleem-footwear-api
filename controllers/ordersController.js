const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");

function resolveDelivery(user, body) {
  const useShop =
    body.useShopAddress === true ||
    body.useShopAddress === "true" ||
    (body.useShopAddress !== false &&
      body.useShopAddress !== "false" &&
      !body.deliveryAddress?.trim());

  if (useShop) {
    const shopAddr = user.address?.trim();
    if (!shopAddr) {
      throw new CustomError.BadRequestError(
        "Shop address is not set. Add a delivery address to continue."
      );
    }
    return {
      deliveryAddress: shopAddr,
      pincode: user.pincode?.trim() || "",
      landmark: user.landmark?.trim() || "",
    };
  }

  const deliveryAddress = body.deliveryAddress?.trim();
  const pincode = body.pincode?.trim();
  if (!deliveryAddress) {
    throw new CustomError.BadRequestError("Delivery address is required.");
  }
  if (!pincode) {
    throw new CustomError.BadRequestError("Pincode is required.");
  }
  return {
    deliveryAddress,
    pincode,
    landmark: body.landmark?.trim() || "",
  };
}

// creating order
const createOrder = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new CustomError.NotFoundError("User not found");
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      throw new CustomError.NotFoundError("Cart is empty or not found", 404);
    }

    const delivery = resolveDelivery(user, req.body);

    if (
      req.body.useShopAddress === false ||
      req.body.useShopAddress === "false"
    ) {
      user.deliveryAddress = delivery.deliveryAddress;
      user.pincode = delivery.pincode;
      user.landmark = delivery.landmark;
      await user.save();
    }

    const newOrder = await Order.create({
      userId: cart.userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      totalItems: cart.totalItems,
      deliveryAddress: delivery.deliveryAddress,
      pincode: delivery.pincode,
      landmark: delivery.landmark,
    });

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0, totalItems: 0 }
    );

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.productId", "brand article category gender")
      .populate(
        "userId",
        "name phone shopName address deliveryAddress pincode landmark"
      );

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "Order have beeen created",
      data: populatedOrder,
    });
  } catch (error) {
    if (error.statusCode) throw error;
    console.log(error);
    throw new CustomError.BadRequestError("Something went wrong.");
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  let { status } = req.body;

  if (!orderId) {
    throw new CustomError.BadRequestError("Please do provide OrderId");
  }

  // Convert the status to lowercase
  status = status.toLowerCase();

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    throw new CustomError.BadRequestError("Something went wrong.");
  }
};

const orderHistory = async (req, res) => {
  const userId = req.user.role === "admin" ? req.body.userId : req.user.userId;

  try {
    // const orders = await Order.fin
    const orders = await Order.find({ userId })
      .populate({
        path: "userId",
        select: "name",
      })
      .populate({
        path: "items.productId",
        select: "brand article images ",
      })

      .sort({ createdAt: -1 });
    console.log(orders);
    const countOrder = orders.length;

    if (orders.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: [],
        totalOrder: 0,
        msg: "No order found.",
      });
    } else {
      // const orderCount = await Order.countDocuments(userId);
      // console.log(orderCount);

      res.status(StatusCodes.OK).json({
        success: true,
        data: orders,
        totalOrder: countOrder,
      });
    }
  } catch (error) {
    throw new CustomError.BadRequestError(`Something went wrong. => ${error}`);
  }
};

// Known order statuses across both the mobile (schema enum) and the web admin
// (accepted/rejected) vocabularies. Accepted as filter values so no valid
// status is silently ignored.
const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "accepted",
  "rejected",
];

const countsByStatus = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

const getAllOrders = async (req, res) => {
  const { status, page, limit } = req.query;

  const filter = {};
  if (status && ORDER_STATUSES.includes(String(status).toLowerCase())) {
    filter.status = String(status).toLowerCase();
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total, statusCounts] = await Promise.all([
    Order.find(filter)
      .populate({ path: "userId", select: "name phone shopName address" })
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  res.status(StatusCodes.OK).json({
    success: true,
    data: orders,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 0,
      counts: countsByStatus(statusCounts),
    },
  });
};

const getAdminStats = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [statusCounts, todayOrders, revenueAgg, totalDealers] =
    await Promise.all([
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        {
          $match: {
            status: { $in: ["accepted", "processing", "shipped", "delivered"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.countDocuments({ role: "user" }),
    ]);

  const counts = countsByStatus(statusCounts);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      pending: counts.pending || 0,
      accepted: counts.accepted || 0,
      rejected: counts.rejected || 0,
      processing: counts.processing || 0,
      shipped: counts.shipped || 0,
      delivered: counts.delivered || 0,
      todayOrders,
      revenue: revenueAgg[0]?.total || 0,
      totalDealers,
    },
  });
};

const getSingleOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;

  const order = await Order.findOne({ _id: orderId, userId })
    .populate({
      path: "items.productId",
    })
    .populate({
      path: "userId",
      select: "name phone shopName address",
    });

  if (!order) {
    throw new CustomError.NotFoundError(`No order with id: ${orderId}`);
  }

  res.status(StatusCodes.OK).json({ success: true, data: order });
};

module.exports = {
  createOrder,
  orderHistory,
  updateOrderStatus,
  getAllOrders,
  getAdminStats,
  getSingleOrder,
};
