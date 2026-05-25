const multer = require("multer");
const router = require("express").Router();

const {
  getActivePromotions,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionController");
const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const adminOnly = [authenticateUser, authorizePermission("admin")];

router.route("/").get(getActivePromotions).post(adminOnly, upload.single("image"), createPromotion);
router.route("/admin").get(adminOnly, getAllPromotions);
router
  .route("/:id")
  .patch(adminOnly, upload.single("image"), updatePromotion)
  .delete(adminOnly, deletePromotion);

module.exports = router;
