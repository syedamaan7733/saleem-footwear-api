const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Order = require("../models/Order");

const base = "/api/v1/auth";

async function makeAdmin() {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Admin User", phone: "9000000001", pin: "111111" });
  const res = await request(app)
    .post(`${base}/login`)
    .send({ identifier: "9000000001", pin: "111111" });
  return res.body.token;
}

async function makeDealerToken(phone = "9000000002") {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Dealer User", phone, pin: "222222" });
  const res = await request(app)
    .post(`${base}/login`)
    .send({ identifier: phone, pin: "222222" });
  return res.body.token;
}

describe("GET /users (list) authorization", () => {
  it("allows admins", async () => {
    const token = await makeAdmin();
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids non-admins", async () => {
    await makeAdmin();
    const dealerToken = await makeDealerToken();
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${dealerToken}`);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /order/status/:orderId validation", () => {
  async function seedPendingOrder() {
    const userId = new mongoose.Types.ObjectId();
    const { insertedId } = await Order.collection.insertOne({
      userId,
      items: [],
      totalPrice: 100,
      totalItems: 1,
      status: "pending",
      createdAt: new Date(),
    });
    return insertedId;
  }

  it("accepts a valid status (accepted)", async () => {
    const token = await makeAdmin();
    const orderId = await seedPendingOrder();
    const res = await request(app)
      .patch(`/api/v1/order/status/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("accepted");
  });

  it("rejects an out-of-enum status", async () => {
    const token = await makeAdmin();
    const orderId = await seedPendingOrder();
    const res = await request(app)
      .patch(`/api/v1/order/status/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "bogus" });
    expect(res.status).toBe(400);
  });
});
