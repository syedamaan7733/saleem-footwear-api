const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Order = require("../models/Order");

const base = "/api/v1/auth";

// The first registered user becomes admin.
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

// Insert raw so we can seed the accepted/rejected statuses the web admin writes
// (they are outside the schema enum, exactly as they exist in production).
function seedOrders() {
  const userId = new mongoose.Types.ObjectId();
  return Order.collection.insertMany([
    { userId, items: [], totalPrice: 100, totalItems: 1, status: "pending", createdAt: new Date() },
    { userId, items: [], totalPrice: 200, totalItems: 2, status: "pending", createdAt: new Date() },
    { userId, items: [], totalPrice: 300, totalItems: 3, status: "accepted", createdAt: new Date() },
    { userId, items: [], totalPrice: 400, totalItems: 4, status: "rejected", createdAt: new Date() },
  ]);
}

describe("GET /order (admin, filtered)", () => {
  it("filters by status and returns counts meta", async () => {
    const token = await makeAdmin();
    await seedOrders();

    const res = await request(app)
      .get("/api/v1/order?status=pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.counts.pending).toBe(2);
    expect(res.body.meta.counts.accepted).toBe(1);
    expect(res.body.meta.counts.rejected).toBe(1);
  });

  it("paginates", async () => {
    const token = await makeAdmin();
    await seedOrders();

    const res = await request(app)
      .get("/api/v1/order?limit=1&page=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.totalPages).toBe(4);
  });

  it("forbids non-admins", async () => {
    await makeAdmin();
    const dealerToken = await makeDealerToken();
    const res = await request(app)
      .get("/api/v1/order")
      .set("Authorization", `Bearer ${dealerToken}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /order/admin/stats", () => {
  it("returns status counts, revenue and dealer count", async () => {
    const token = await makeAdmin();
    await makeDealerToken(); // one dealer
    await seedOrders();

    const res = await request(app)
      .get("/api/v1/order/admin/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pending).toBe(2);
    expect(res.body.data.accepted).toBe(1);
    expect(res.body.data.rejected).toBe(1);
    // Revenue = confirmed orders only (accepted here) → 300
    expect(res.body.data.revenue).toBe(300);
    expect(res.body.data.todayOrders).toBe(4);
    expect(res.body.data.totalDealers).toBe(1);
  });

  it("forbids non-admins", async () => {
    await makeAdmin();
    const dealerToken = await makeDealerToken();
    const res = await request(app)
      .get("/api/v1/order/admin/stats")
      .set("Authorization", `Bearer ${dealerToken}`);
    expect(res.status).toBe(403);
  });
});
