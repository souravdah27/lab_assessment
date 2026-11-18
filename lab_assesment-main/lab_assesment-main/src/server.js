import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/db.js";

const port = Number(process.env.PORT || 3000);
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

await connectToDatabase();
app.listen(port, () => {
  console.log(`Campus service API listening on port ${port}`);
});
