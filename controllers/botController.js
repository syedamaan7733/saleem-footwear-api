const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");

/**
 * Get unique categories with their representative images
 * Returns categories sorted by latest product creation date
 * 
 * @route GET /bot/categories
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @returns {Object} { categories: Array, meta: Object }
 */
const getUniqueCategories = async (req, res) => {
  // Parse pagination parameters
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Aggregate pipeline to get unique categories with latest images
    const result = await Product.aggregate([
      // Step 1: Sort by createdAt descending to get latest products first
      { $sort: { createdAt: -1 } },

      // Step 2: Group by category and capture the latest product's image
      {
        $group: {
          _id: "$category",
          imageUrl: { $first: { $arrayElemAt: ["$images", 0] } },
          latestDate: { $max: "$createdAt" },
        },
      },

      // Step 3: Sort categories by their latest product date
      { $sort: { latestDate: -1 } },

      // Step 4: Apply pagination using facet
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    // Extract results and calculate pagination metadata
    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    // Format and send response
    res.status(StatusCodes.OK).json({
      categories: data.map((item) => ({
        name: item._id,
        imageUrl: item.imageUrl,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in getUniqueCategories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: error.message 
    });
  }
};

/**
 * Get all items for a specific category
 * Products are "exploded" by color - each color variant becomes a separate item
 * 
 * @route GET /bot/categories/:category
 * @param {string} category - Category name (case-insensitive)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @returns {Object} { items: Array, meta: Object }
 */
const getCategoryItems = async (req, res) => {
  // Extract parameters
  const { category } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    // Aggregate pipeline to explode products by color
    const result = await Product.aggregate([
      // Step 1: Match products in the specified category (case-insensitive)
      { 
        $match: { 
          category: { $regex: new RegExp(`^${category}$`, "i") } 
        } 
      },

      // Step 2: Convert colors Map to array for unwinding
      // Transforms: { "RED": ["img1.jpg"], "BLUE": ["img2.jpg"] }
      // Into: [{ k: "RED", v: ["img1.jpg"] }, { k: "BLUE", v: ["img2.jpg"] }]
      { 
        $addFields: { 
          colorsArray: { $objectToArray: "$colors" } 
        } 
      },

      // Step 3: Unwind colors array - creates one document per color variant
      { $unwind: "$colorsArray" },

      // Step 4: Project only the fields we need in the response
      {
        $project: {
          _id: 1,
          article: 1,
          category: 1,
          brand: 1,
          material: 1,
          imageUrl: { $arrayElemAt: ["$colorsArray.v", 0] }, // First image of this color
          color: "$colorsArray.k", // Color name
          createdAt: 1,
        },
      },

      // Step 5: Sort by creation date (latest first)
      { $sort: { createdAt: -1 } },

      // Step 6: Apply pagination using facet
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    // Extract results and calculate pagination metadata
    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    // Format and send response
    res.status(StatusCodes.OK).json({
      items: data.map((item) => ({
        _id: item._id,
        imageUrl: item.imageUrl,
        article: item.article,
        category: item.category,
        brand: item.brand,
        color: item.color,
        material: item.material,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in getCategoryItems:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: error.message 
    });
  }
};

module.exports = {
  getUniqueCategories,
  getCategoryItems,
};
