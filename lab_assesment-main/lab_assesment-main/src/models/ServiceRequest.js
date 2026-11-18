import mongoose from "mongoose";
import {
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
} from "../utils/validation.js";
import { REQUEST_STATUSES } from "../utils/requestWorkflow.js";

const serviceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: true,
      enum: REQUEST_CATEGORIES,
    },
    priority: {
      type: String,
      required: true,
      enum: REQUEST_PRIORITIES,
      default: "Medium",
    },
    status: {
      type: String,
      required: true,
      enum: REQUEST_STATUSES,
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { timestamps: true },
);

serviceRequestSchema.index({ createdBy: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, priority: 1, category: 1 });

export default mongoose.model("ServiceRequest", serviceRequestSchema);
