const { validatePin } = require("../utils");

describe("validatePin", () => {
  it("accepts exactly 6 digits", () => {
    expect(validatePin("966900")).toBe(true);
  });
  it("rejects fewer than 6 digits", () => {
    expect(validatePin("12345")).toBe(false);
  });
  it("rejects more than 6 digits", () => {
    expect(validatePin("1234567")).toBe(false);
  });
  it("rejects non-numeric", () => {
    expect(validatePin("12a456")).toBe(false);
  });
  it("rejects empty / undefined", () => {
    expect(validatePin("")).toBe(false);
    expect(validatePin(undefined)).toBe(false);
  });
});
