import { Router } from "express";
import {
  addAdminResponse,
  assignRequest,
  changeStatus,
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  updateRequest,
} from "../controllers/requestController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);
router.post("/", requireRole("student"), asyncHandler(createRequest));
router.get("/", asyncHandler(listRequests));
router.get("/:id", asyncHandler(getRequest));
router.put("/:id", requireRole("student"), asyncHandler(updateRequest));
router.delete("/:id", asyncHandler(deleteRequest));
router.put("/:id/status", requireRole("admin"), asyncHandler(changeStatus));
router.put("/:id/assign", requireRole("admin"), asyncHandler(assignRequest));
router.put("/:id/response", requireRole("admin"), asyncHandler(addAdminResponse));

export default router;
