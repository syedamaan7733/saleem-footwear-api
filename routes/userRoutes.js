const router = require("express").Router();

const {
  getAllUsers,
  getSingleUser,
  getCurrentUser,
  updateCurrentUser,
  resetUserPin,
} = require("../controllers/userController");
const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");

router
  .route("/me")
  .get(authenticateUser, getCurrentUser)
  .patch(authenticateUser, updateCurrentUser);

router
  .route("/")
  .get([authenticateUser, authorizePermission("admin")], getAllUsers);

router
  .route("/:id/reset-pin")
  .patch(authenticateUser, authorizePermission("admin"), resetUserPin);

router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
