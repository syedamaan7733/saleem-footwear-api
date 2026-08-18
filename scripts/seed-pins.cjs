require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../db/connect");
const User = require("../models/User");

const TEMP_PIN = "966900";

async function run() {
  await connectDB(process.env.MONGO_URI);
  const users = await User.find({});
  let updated = 0;
  for (const user of users) {
    user.password = TEMP_PIN; // pre-save hook hashes it
    user.failedPinAttempts = 0;
    user.lockUntil = null;
    await user.save();
    updated += 1;
  }
  console.log(`Seeded temp PIN for ${updated} user(s).`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
