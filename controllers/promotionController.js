const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Promotion = require("../models/Promotion");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return value === "true";
}

function parsePromotionPayload(body) {
  const payload = {};

  if (body.title !== undefined) payload.title = body.title.trim();
  if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl.trim();
  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (Number.isNaN(sortOrder)) {
      throw new CustomError.BadRequestError("Sort order must be a number.");
    }
    payload.sortOrder = sortOrder;
  }

  const isActive = parseBoolean(body.isActive);
  if (isActive !== undefined) payload.isActive = isActive;

  return payload;
}

const getActivePromotions = async (req, res) => {
  const promotions = await Promotion.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select("title imageUrl sortOrder isActive createdAt updatedAt");

  res.status(StatusCodes.OK).json({
    success: true,
    count: promotions.length,
    promotions,
  });
};

const getAllPromotions = async (req, res) => {
  const promotions = await Promotion.find({})
    .sort({ sortOrder: 1, createdAt: -1 })
    .select("title imageUrl sortOrder isActive createdAt updatedAt");

  res.status(StatusCodes.OK).json({
    success: true,
    count: promotions.length,
    promotions,
  });
};

const createPromotion = async (req, res) => {
  const payload = parsePromotionPayload(req.body);

  if (req.file) {
    payload.imageUrl = await uploadToCloudinary(req.file);
  }

  if (!payload.imageUrl) {
    throw new CustomError.BadRequestError("Please upload a promotion image.");
  }

  const promotion = await Promotion.create(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    promotion,
  });
};

const updatePromotion = async (req, res) => {
  const { id: promotionId } = req.params;
  const payload = parsePromotionPayload(req.body);

  if (req.file) {
    payload.imageUrl = await uploadToCloudinary(req.file);
  }

  const promotion = await Promotion.findByIdAndUpdate(promotionId, payload, {
    new: true,
    runValidators: true,
  });

  if (!promotion) {
    throw new CustomError.NotFoundError(
      `No promotion with id: ${promotionId}`
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    promotion,
  });
};

const deletePromotion = async (req, res) => {
  const { id: promotionId } = req.params;
  const promotion = await Promotion.findByIdAndDelete(promotionId);

  if (!promotion) {
    throw new CustomError.NotFoundError(
      `No promotion with id: ${promotionId}`
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Promotion deleted successfully.",
  });
};

module.exports = {
  getActivePromotions,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
