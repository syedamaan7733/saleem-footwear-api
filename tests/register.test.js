const request = require("supertest");
const app = require("../app");

const base = "/api/v1/auth";

describe("register PIN validation", () => {
  it("registers with a valid 6-digit pin field", async () => {
    const res = await request(app)
      .post(`${base}/register`)
      .send({ name: "Test Dealer", phone: "9669007065", pin: "966900" });
    expect(res.status).toBe(201);
  });

  it("still accepts the legacy password field", async () => {
    const res = await request(app)
      .post(`${base}/register`)
      .send({ name: "Legacy Dealer", phone: "9669007066", password: "123456" });
    expect(res.status).toBe(201);
  });

  it("rejects a non-6-digit pin", async () => {
    const res = await request(app)
      .post(`${base}/register`)
      .send({ name: "Bad Dealer", phone: "9669007067", pin: "12ab5" });
    expect(res.status).toBe(400);
  });
});
