const router = require("express").Router();
const {
  register,
  logIn,
  logout,
  changePin,
} = require("../controllers/authControllers");
const { authenticateUser } = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", logIn);
router.get("/logout", logout);
router.patch("/change-pin", authenticateUser, changePin);

module.exports = router;
