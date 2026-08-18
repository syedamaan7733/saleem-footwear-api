// ============================================================================
// DESTRUCTIVE ONE-TIME MIGRATION — DO NOT RE-RUN
//
// This script overwrites EVERY user's PIN with the shared temporary value
// (966900), including dealers who have already changed their PIN. It is
// meant to be run EXACTLY ONCE during the PIN-auth rollout. Re-running it
// resets everyone's PIN back to the temp value, which is a security and
// lockout footgun. It is guarded by SEED_PINS_CONFIRM below — do not
// bypass that guard casually.
// ============================================================================
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../db/connect");
const User = require("../models/User");

const TEMP_PIN = "966900";
const CONFIRM_VALUE = "RESET-ALL-PINS-TO-966900";

async function run() {
  if (process.env.SEED_PINS_CONFIRM !== CONFIRM_VALUE) {
    console.error(`
!! DESTRUCTIVE OPERATION BLOCKED !!

This script resets the PIN/password for ALL users in the database to the
shared temporary value "${TEMP_PIN}" — including any dealers who have
already changed their PIN since the initial rollout. It is intended to
run EXACTLY ONCE, during the PIN-auth migration.

To run it intentionally, set the confirmation env var and re-run:

  SEED_PINS_CONFIRM=${CONFIRM_VALUE} npm run seed:pins

Refusing to connect to the database or write any changes.
`);
    process.exit(1);
    return;
  }

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
