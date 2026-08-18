const request = require("supertest");
const app = require("../app");

describe("health", () => {
  it("GET / returns healthy", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});
