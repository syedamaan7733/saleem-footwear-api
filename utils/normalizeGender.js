/** Canonical gender values stored in Product.gender */
const CANONICAL = ["male", "female", "kids", "unisex"];

/** Maps lowercase input -> canonical value */
const ALIAS_TO_CANONICAL = {
  male: "male",
  men: "male",
  man: "male",
  mens: "male",
  female: "female",
  women: "female",
  woman: "female",
  womens: "female",
  kids: "kids",
  kid: "kids",
  children: "kids",
  unisex: "unisex",
};

/** All DB string variants that map to each canonical gender (for $in queries) */
const CANONICAL_TO_DB_VARIANTS = {
  male: ["male", "Male", "MALE", "Men", "men", "MEN", "Man", "man"],
  female: ["female", "Female", "FEMALE", "Women", "women", "WOMEN", "Woman", "woman"],
  kids: ["kids", "Kids", "KIDS", "kid", "Kid", "children", "Children"],
  unisex: ["unisex", "Unisex", "UNISEX"],
};

/**
 * @param {string | undefined | null} raw
 * @returns {'male' | 'female' | 'kids' | 'unisex' | null}
 */
function normalizeGender(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const key = String(raw).trim().toLowerCase();
  return ALIAS_TO_CANONICAL[key] ?? null;
}

/**
 * MongoDB filter for gender field (tolerates legacy casing in DB).
 * @param {string | undefined | null} raw
 * @returns {Record<string, unknown> | null}
 */
function buildGenderFilter(raw) {
  const canonical = normalizeGender(raw);
  if (!canonical) return null;
  const variants = CANONICAL_TO_DB_VARIANTS[canonical];
  return { gender: { $in: variants } };
}

/**
 * Distinct category query filter fragment when gender is set.
 * @param {string | undefined | null} raw
 * @returns {Record<string, unknown>}
 */
function buildGenderDistinctFilter(raw) {
  const filter = buildGenderFilter(raw);
  return filter ?? {};
}

module.exports = {
  CANONICAL,
  normalizeGender,
  buildGenderFilter,
  buildGenderDistinctFilter,
};
