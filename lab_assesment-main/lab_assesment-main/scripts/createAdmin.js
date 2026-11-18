import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { connectToDatabase } from "../src/config/db.js";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DEPARTMENT } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_DEPARTMENT) {
  throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_DEPARTMENT in .env");
}
if (ADMIN_PASSWORD.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters");
}

try {
  await connectToDatabase();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) {
    throw new Error(`An account with ${email} already exists`);
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password,
    department: ADMIN_DEPARTMENT.trim(),
    role: "admin",
  });
  console.log(`Admin account created for ${email}`);
} finally {
  await mongoose.disconnect();
}
