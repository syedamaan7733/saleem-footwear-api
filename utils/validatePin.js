function validatePin(value) {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

module.exports = { validatePin };
