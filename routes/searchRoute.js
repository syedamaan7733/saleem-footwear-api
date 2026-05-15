const router = require("express").Router();
const {
  searchProduct,
  searchCategory,
  querySearch,
  searchProductsByCategory,
  searchGenders,
} = require("../controllers/productController");

router.get("/", searchProduct);

router.get("/genders", searchGenders);
router.get("/category", searchCategory);
router.get("/category/specific", searchProductsByCategory);
router.get("/q", querySearch);

module.exports = router;
