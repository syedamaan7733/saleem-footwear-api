const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

const base = "/api/v1/auth";

async function makeUser(phone = "9669007065", pin = "966900") {
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Test Dealer", phone, pin });
}

describe("login", () => {
  it("logs in with correct pin", async () => {
    await makeUser();
    const res = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "966900" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("accepts legacy password field on login", async () => {
    await makeUser();
    const res = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", password: "966900" });
    expect(res.status).toBe(200);
  });

  it("rejects wrong pin and increments counter", async () => {
    await makeUser();
    const res = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "000000" });
    expect(res.status).toBe(401);
    const user = await User.findOne({ phone: "9669007065" });
    expect(user.failedPinAttempts).toBe(1);
  });

  it("locks the account after 10 wrong attempts", async () => {
    await makeUser();
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post(`${base}/login`)
        .send({ identifier: "9669007065", pin: "000000" });
    }
    const user = await User.findOne({ phone: "9669007065" });
    expect(user.lockUntil).not.toBeNull();

    // even the correct pin is refused while locked
    const res = await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "966900" });
    expect(res.status).toBe(401);
    expect(res.body.msg).toMatch(/too many|locked|try again/i);
  });

  it("clears counter on successful login", async () => {
    await makeUser();
    await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "000000" });
    await request(app)
      .post(`${base}/login`)
      .send({ identifier: "9669007065", pin: "966900" });
    const user = await User.findOne({ phone: "9669007065" });
    expect(user.failedPinAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
  });
});
