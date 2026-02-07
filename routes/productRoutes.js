const router = require("express").Router();

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchBrand,
  searchMaterial,
} = require("../controllers/productController");

const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");

/**
 * Product Routes
 * 
 * Base path: /api/v1/products
 */

// Main product CRUD routes
router
  .route("/")
  .post([authenticateUser, authorizePermission("admin")], createProduct)
  .get(getAllProducts);

// Filter routes (must come before /:id to avoid conflicts)
router.route("/brands").get(searchBrand);
router.route("/materials").get(searchMaterial);

// Single product routes
router
  .route("/:id")
  .get(getSingleProduct)
  .patch([authenticateUser, authorizePermission("admin")], updateProduct)
  .delete(deleteProduct);

module.exports = router;
