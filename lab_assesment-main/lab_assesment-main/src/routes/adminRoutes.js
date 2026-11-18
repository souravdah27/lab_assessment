import { Router } from "express";
import { getDashboard } from "../controllers/adminController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/dashboard", authenticate, requireRole("admin"), asyncHandler(getDashboard));

export default router;
