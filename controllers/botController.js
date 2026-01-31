const CategoriesImages = require("../models/CategoriesImages");
const { StatusCodes } = require("http-status-codes");

const getUniqueCategories = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Use aggregation to get unique categories and paginate
  const result = await CategoriesImages.aggregate([
    // Group by category to get unique names
    {
      $group: {
        _id: "$category",
        // get the first image url for the category (optional, but good for display)
        imageUrl: { $first: "$imageUrl" }, 
      },
    },
    // Sort optionally (alphabetical)
    { $sort: { _id: 1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  // Extract data from facet result
  const data = result[0].data;
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
  const totalPages = Math.ceil(total / limit);

  res.status(StatusCodes.OK).json({
    categories: data.map((item) => ({
        name: item._id,
        imageUrl: item.imageUrl
    })),
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  });
};

// Get all items for a specific category
const getCategoryItems = async (req, res) => {
  const { category } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20; // Default limit 20
  const skip = (page - 1) * limit;

  // Case insensitive search for category
  const query = { category: { $regex: new RegExp(`^${category}$`, 'i') } };

  const total = await CategoriesImages.countDocuments(query);
  const items = await CategoriesImages.find(query)
    .select("imageUrl article category") // Select specific fields
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit);

  res.status(StatusCodes.OK).json({
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  });
};

module.exports = {
  getUniqueCategories,
  getCategoryItems,
};
