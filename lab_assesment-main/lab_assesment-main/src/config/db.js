import mongoose from "mongoose";

export async function connectToDatabase() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set");
  }

  await mongoose.connect(MONGODB_URI);
}
