const router = require("express").Router();

const {
  getAllUsers,
  getSingleUser,
  getCurrentUser,
} = require("../controllers/userController");
const { authenticateUser } = require("../middleware/authentication");

router.route("/me").get(authenticateUser, getCurrentUser);

router.route("/").get(authenticateUser, getAllUsers);

router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
