const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  CANONICAL,
  normalizeGender,
  buildGenderFilter,
  buildGenderDistinctFilter,
} = require("../utils/normalizeGender");
const { buildBrandFilter } = require("../utils/normalizeBrand");

const createProduct = async (req, res) => {
  const items = req.body;
  req.body.user = req.user.userId;
  const product = await Product.create(items);
  res.status(StatusCodes.CREATED).json({ product });
};

// const getAllProducts = async (req, res) => {

//   const products = await Product.find({})
//     .sort({ createdAt: -1 })
//     .select(
//       "brand colors inStock price images itemSet material category gender article createdAt"
//     );
//   // console.log("OK");

//   res.status(StatusCodes.OK).json({ count: products.length, products });
// };
const getAllProducts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    gender,
    brand,
    material,
    inStock,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};
  if (category) filter.category = category;
  const genderFilter = buildGenderFilter(gender);
  if (genderFilter) Object.assign(filter, genderFilter);
  const brandFilter = buildBrandFilter(brand);
  if (brandFilter) Object.assign(filter, brandFilter);
  if (material) filter.material = material;
  if (inStock === "true" || inStock === "1") filter.inStock = true;
  if (inStock === "false" || inStock === "0") filter.inStock = false;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .select(
      "brand colors inStock price images itemSet colorsStock material category gender article createdAt"
    )
    .skip(skip)
    .limit(limitNumber);

  const totalProducts = await Product.countDocuments(filter);

  res.status(StatusCodes.OK).json({
    count: products.length,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limitNumber) || 1,
    currentPage: pageNumber,
    products,
  });
};

const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id: ${productId}`);
  }
  // console.log(product);

  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
  let product = await Product.findById(productId);
  if (!product) {
    throw new CustomError.NotFoundError(`No product with ID: ${productId}`);
  }

  // Update product fields manually
  Object.keys(req.body).forEach((key) => {
    product[key] = req.body[key];
  });

  // Save the product (triggers `pre("save")` middleware)
  await product.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: `Product with ID ${productId} has been updated successfully.`,
    data: product,
  });
};

const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with Id: ${productId}`);
  }
  await Product.deleteOne({ _id: productId });
  res.status(StatusCodes.OK).json({ msg: "Product have been deleted ;)" });
};

/*
 *____________________________*
 |CATEGORY RELATED CONTROLLERS|
  ____________________________
*/

// const searchCategory = async (req, res) => {
//   const { gender } = req.query;
//   // console.log(gender);

//   try {
//     let categories;

//     if (!gender) {
//       categories = await Product.distinct("category");
//     } else {
//       // Find all distinct categories in the Product collection based on the gender
//       categories = await Product.distinct("category", { gender: gender });
//       // console.log(categories);
//     }
//     //
//     // Send the list of categories as a response
//     res.status(200).json({
//       success: true,
//       data: categories,
//       totalCategory: `Total category in ${gender} section: ${categories.length}`,
//     });
//   } catch (error) {
//     // Handle errors
//     console.error("Error fetching categories:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while fetching categories",
//       error: error.message,
//     });
//   }
// };

const searchCategory = async (req, res) => {
  const { gender: genderRaw } = req.query;
  const canonicalGender = normalizeGender(genderRaw);
  const genderDistinctFilter = buildGenderDistinctFilter(genderRaw);

  try {
    const categories = await Product.distinct(
      "category",
      genderDistinctFilter
    );

    const categoryWithImages = await Promise.all(
      categories.map(async (category) => {
        const productQuery = { category, ...genderDistinctFilter };
        const product = await Product.findOne(productQuery)
          .select("category images")
          .sort({ createdAt: -1 });

        return {
          category,
          image: product?.images?.[0] ?? null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoryWithImages,
      gender: canonicalGender,
      totalCategories: `Total category in ${canonicalGender || "all"} section: ${
        categories.length
      }`,
    });
  } catch (error) {
    console.error("Error fetching categories with images:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching categories with images",
      error: error.message,
    });
  }
};

const searchProductsByCategory = async (req, res) => {
  const { category, gender, page = 1, limit = 20, inStock } = req.query;

  try {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { category };
    const genderFilter = buildGenderFilter(gender);
    if (genderFilter) Object.assign(filter, genderFilter);
    if (inStock === "true" || inStock === "1") filter.inStock = true;
    if (inStock === "false" || inStock === "0") filter.inStock = false;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber) || 1,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching products",
      error: error.message,
    });
  }
};

// search functionality
const searchProduct = async (req, res) => {
  try {
    const { q, page = 1 } = req.query; // Extract 'q' and 'page' from query parameters

    // Construct the search query
    const searchQuery = {
      $or: [
        { gender: { $regex: q } }, // Case-insensitive search in gender
        { brand: { $regex: q, $options: "i" } }, // Case-insensitive search in brand
        { category: { $regex: q, $options: "i" } }, // Case-insensitive search in category
        { article: { $regex: q, $options: "i" } }, // Case-insensitive search in article
      ],
    };

    // Pagination options
    const limit = 10; // Number of results per page
    const skip = (page - 1) * limit; // Calculate how many results to skip

    // Execute the query with pagination
    const products = await Product.find(searchQuery)
      .select("brand article category gender images") // Only select the productName field
      .skip(skip) // Skip the appropriate number of results
      .limit(limit); // Limit the number of results returned

    // Get the total count of matching documents
    const total = await Product.countDocuments(searchQuery);

    // Calculate the total number of pages
    const totalPages = Math.ceil(total / limit);

    // Send the response with products, current page, and total pages
    res.json({
      products,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const GENDER_LABELS = {
  male: "Men's",
  female: "Women's",
  kids: "Kids'",
  unisex: "Unisex",
};

const searchGenders = async (req, res) => {
  try {
    const products = await Product.find({ gender: { $exists: true, $ne: "" } })
      .select("gender")
      .lean();

    const counts = { male: 0, female: 0, kids: 0, unisex: 0 };
    for (const p of products) {
      const canonical = normalizeGender(p.gender);
      if (canonical && counts[canonical] !== undefined) {
        counts[canonical] += 1;
      }
    }

    const genders = CANONICAL.map((id) => ({
      id,
      label: GENDER_LABELS[id],
      count: counts[id],
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      genders,
    });
  } catch (error) {
    console.error("Error fetching genders:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while fetching genders",
      error: error.message,
    });
  }
};

const querySearch = async (req, res) => {
  res.json({ msg: "hello" });
};

const searchArticle = async (req, res) => {
  try {
    // Extract the article from the request query
    const { article } = req.query;

    // Ensure the article parameter is provided
    if (!article) {
      return res.status(400).json({
        success: false,
        message: "Article query parameter is required",
      });
    }

    // Search for products with the matching article
    const products = await Product.find({
      article: { $regex: article, $options: "i" },
    });

    // Check if products were found
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found matching the article",
      });
    }

    // Send the list of matching products as a response
    res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    // Handle errors
    console.error("Error searching for article:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for the article",
      error: error.message,
    });
  }
};

/**
 * Get all unique brands sorted by latest product
 * Returns brands from products sorted by most recently created product
 * 
 * @route GET /api/v1/products/brands
 * @returns {Object} { success: boolean, count: number, brands: Array<string> }
 */
const searchBrand = async (req, res) => {
  try {
    // Aggregate to get unique brands with their latest product date
    const brands = await Product.aggregate([
      {
        $match: {
          brand: { $exists: true, $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: { $toUpper: "$brand" },
          latestProduct: { $max: "$createdAt" },
        },
      },
      { $match: { _id: { $ne: "" } } },
      { $sort: { latestProduct: -1 } },
      { $project: { _id: 0, brand: "$_id" } },
    ]);

    const brandList = brands.map((b) => b.brand).filter(Boolean);

    res.status(200).json({
      success: true,
      count: brandList.length,
      brands: brandList,
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching brands",
      error: error.message,
    });
  }
};

/**
 * Get all unique materials sorted by latest product
 * Returns materials from products sorted by most recently created product
 * Filters out null/undefined materials
 * 
 * @route GET /api/v1/products/materials
 * @returns {Object} { success: boolean, count: number, materials: Array<string> }
 */
const searchMaterial = async (req, res) => {
  try {
    // Aggregate to get unique materials with their latest product date
    const materials = await Product.aggregate([
      // Group by material and find the latest product for each
      {
        $group: {
          _id: "$material",
          latestProduct: { $max: "$createdAt" },
        },
      },
      
      // Sort by latest product date (most recent first)
      { $sort: { latestProduct: -1 } },
      
      // Project only the material name
      { $project: { _id: 0, material: "$_id" } },
    ]);

    // Extract material names and filter out null/undefined values
    const materialList = materials.map((m) => m.material).filter(Boolean);

    res.status(200).json({
      success: true,
      count: materialList.length,
      materials: materialList,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching materials",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  searchCategory,
  searchProductsByCategory,
  searchGenders,
  querySearch,
  searchArticle,
  searchBrand,
  searchMaterial,
};
