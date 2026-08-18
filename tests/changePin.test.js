const request = require("supertest");
const app = require("../app");

const base = "/api/v1/auth";

async function registerAndLogin(phone = "9669007065", pin = "966900") {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Test Dealer", phone, pin });
  const res = await request(app)
    .post(`${base}/login`)
    .send({ identifier: phone, pin });
  return res.body.token;
}

describe("change-pin", () => {
  it("changes the pin with correct current pin", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch(`${base}/change-pin`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "966900", newPin: "112233" });
    expect(res.status).toBe(200);

    // old pin no longer works, new one does
    const bad = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "966900" });
    expect(bad.status).toBe(401);
    const good = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "112233" });
    expect(good.status).toBe(200);
  });

  it("rejects wrong current pin", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch(`${base}/change-pin`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "000000", newPin: "112233" });
    expect(res.status).toBe(400);
  });

  it("rejects a badly formatted new pin", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch(`${base}/change-pin`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "966900", newPin: "12ab" });
    expect(res.status).toBe(400);
  });

  it("rejects when new pin equals current pin", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch(`${base}/change-pin`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "966900", newPin: "966900" });
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .patch(`${base}/change-pin`)
      .send({ currentPin: "966900", newPin: "112233" });
    expect(res.status).toBe(401);
  });
});
