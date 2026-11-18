import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(payload.sub).select("_id name email role department");
  if (!user) {
    return res.status(401).json({ message: "Authentication account no longer exists" });
  }

  req.user = user;
  next();
});

export function requireRole(...roles) {
  return function roleCheck(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}
