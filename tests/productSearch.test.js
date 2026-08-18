const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");

function makeProduct(overrides) {
  return {
    brand: "Generic",
    article: "ART",
    category: "casual",
    price: 500,
    itemSet: [{ size: "7", lengths: 12 }],
    colors: { RED: ["a.jpg"] },
    ...overrides,
  };
}

describe("GET /products?search=", () => {
  beforeEach(async () => {
    await Product.create(makeProduct({ brand: "Nike", article: "AF1", category: "sports" }));
    await Product.create(makeProduct({ brand: "Adidas", article: "UB22", category: "running" }));
    await Product.create(makeProduct({ brand: "Bata", article: "SCHOOL01", category: "sports" }));
  });

  it("matches on brand (case-insensitive)", async () => {
    const res = await request(app).get("/api/v1/products?search=nike");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].brand).toBe("Nike");
  });

  it("matches on article", async () => {
    const res = await request(app).get("/api/v1/products?search=UB22");
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].brand).toBe("Adidas");
  });

  it("matches on category across multiple products", async () => {
    const res = await request(app).get("/api/v1/products?search=sports");
    expect(res.body.products).toHaveLength(2);
  });

  it("returns everything when search is empty", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.body.products).toHaveLength(3);
  });
});
