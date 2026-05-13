const express = require("express");
const router = express.Router();
const {
  createOrder,
  orderHistory,
  updateOrderStatus,
  getAllOrders,
  getSingleOrder,
} = require("../controllers/ordersController");
const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");

router
  .route("/")
  .post(authenticateUser, createOrder)
  .get([authenticateUser, authorizePermission("admin")], getAllOrders);
router.route("/history").get(authenticateUser, orderHistory);
router.route("/:orderId").get(authenticateUser, getSingleOrder);
router
  .route("/status/:orderId")
  .patch([authenticateUser, authorizePermission("admin")], updateOrderStatus);

module.exports = router;
