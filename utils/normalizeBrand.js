/**
 * Display / dedupe key for brands (uppercase).
 * @param {string | undefined | null} raw
 * @returns {string | null}
 */
function normalizeBrandKey(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim().toUpperCase();
}

/**
 * Case-insensitive exact brand match for MongoDB queries.
 * @param {string | undefined | null} raw
 * @returns {Record<string, RegExp> | null}
 */
function buildBrandFilter(raw) {
  const key = normalizeBrandKey(raw);
  if (!key) return null;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { brand: new RegExp(`^${escaped}$`, "i") };
}

module.exports = {
  normalizeBrandKey,
  buildBrandFilter,
};
