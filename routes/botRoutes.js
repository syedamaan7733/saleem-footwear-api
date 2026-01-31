const express = require("express");
const router = express.Router();
const { getUniqueCategories, getCategoryItems } = require("../controllers/botController");

router.route("/categories").get(getUniqueCategories);
router.route("/categories/:category").get(getCategoryItems);

module.exports = router;
