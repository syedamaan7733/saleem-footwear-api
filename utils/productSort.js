const ALLOWED_SORT_FIELDS = new Set(["article", "price", "createdAt"]);

/**
 * Build a Mongoose sort object from query params.
 * @param {string} [sortBy] - article | price | createdAt
 * @param {string} [sortOrder] - asc | desc
 * @returns {Record<string, 1 | -1>}
 */
function resolveProductSort(sortBy, sortOrder) {
  const field = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const direction = sortOrder === "asc" ? 1 : -1;

  if (field === "article") {
    return { article: direction, createdAt: -1 };
  }
  if (field === "price") {
    return { price: direction, createdAt: -1 };
  }
  return { createdAt: direction };
}

module.exports = { resolveProductSort };
