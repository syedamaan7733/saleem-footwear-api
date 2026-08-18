const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

const base = "/api/v1/auth";

// first registered user is admin
async function makeAdmin() {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Admin User", phone: "9000000001", pin: "111111" });
  const res = await request(app)
    .post(`${base}/login`)
    .send({ identifier: "9000000001", pin: "111111" });
  return res.body.token;
}

async function makeDealer(phone = "9000000002") {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Dealer User", phone, pin: "222222" });
  return User.findOne({ phone });
}

describe("admin reset-pin", () => {
  it("admin can reset a dealer to 966900", async () => {
    const adminToken = await makeAdmin();
    const dealer = await makeDealer();
    const res = await request(app)
      .patch(`/api/v1/users/${dealer._id}/reset-pin`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const login = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9000000002", pin: "966900" });
    expect(login.status).toBe(200);
  });

  it("non-admin is forbidden", async () => {
    await makeAdmin(); // consumes the first-admin slot
    const dealer = await makeDealer("9000000003");
    const dealerLogin = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9000000003", pin: "222222" });
    const dealerToken = dealerLogin.body.token;

    const res = await request(app)
      .patch(`/api/v1/users/${dealer._id}/reset-pin`)
      .set("Authorization", `Bearer ${dealerToken}`);
    expect(res.status).toBe(403);
  });
});
