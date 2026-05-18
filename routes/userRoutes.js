const router = require("express").Router();

const {
  getAllUsers,
  getSingleUser,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/userController");
const { authenticateUser } = require("../middleware/authentication");

router
  .route("/me")
  .get(authenticateUser, getCurrentUser)
  .patch(authenticateUser, updateCurrentUser);

router.route("/").get(authenticateUser, getAllUsers);

router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
