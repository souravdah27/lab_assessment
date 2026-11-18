import mongoose from "mongoose";
import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";
import { canTransitionRequest, REQUEST_STATUSES } from "../utils/requestWorkflow.js";
import {
  escapeRegex,
  isNonEmptyString,
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
} from "../utils/validation.js";

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function requestQuery(req) {
  const query = {};
  if (req.user.role === "student") {
    query.createdBy = req.user._id;
  }

  for (const [key, values] of [
    ["status", REQUEST_STATUSES],
    ["priority", REQUEST_PRIORITIES],
    ["category", REQUEST_CATEGORIES],
  ]) {
    if (req.query[key] !== undefined) {
      if (!values.includes(req.query[key])) {
        return { error: `Invalid ${key} filter` };
      }
      query[key] = req.query[key];
    }
  }

  if (req.query.search !== undefined) {
    if (typeof req.query.search !== "string" || req.query.search.trim().length > 100) {
      return { error: "Search must be a string of at most 100 characters" };
    }
    const safeSearch = escapeRegex(req.query.search.trim());
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return { query };
}

export async function createRequest(req, res) {
  const { title, description, category } = req.body;
  if (
    !isNonEmptyString(title, 150) ||
    !isNonEmptyString(description, 5000) ||
    !REQUEST_CATEGORIES.includes(category)
  ) {
    return res.status(400).json({
      message: "Provide a title (max 150), description (max 5000), and valid category",
    });
  }

  const serviceRequest = await ServiceRequest.create({
    title: title.trim(),
    description: description.trim(),
    category,
    createdBy: req.user._id,
  });

  res.status(201).json({ message: "Request created", data: serviceRequest });
}

export async function listRequests(req, res) {
  const { query, error } = requestQuery(req);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: "Page must be positive and limit must be between 1 and 100" });
  }

  const [requests, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate("createdBy", "name email department")
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ServiceRequest.countDocuments(query),
  ]);

  res.json({
    data: requests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getRequest(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id)
    .populate("createdBy", "name email department")
    .populate("assignedTo", "name email department");
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (
    req.user.role === "student" &&
    serviceRequest.createdBy._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: "You can only view your own requests" });
  }

  res.json({ data: serviceRequest });
}

export async function updateRequest(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  const allowedFields = ["title", "description", "category"];
  const fields = Object.keys(req.body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: "Provide one or more editable fields: title, description, category" });
  }
  if (
    (req.body.title !== undefined && !isNonEmptyString(req.body.title, 150)) ||
    (req.body.description !== undefined && !isNonEmptyString(req.body.description, 5000)) ||
    (req.body.category !== undefined && !REQUEST_CATEGORIES.includes(req.body.category))
  ) {
    return res.status(400).json({ message: "One or more request fields are invalid" });
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (serviceRequest.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update your own requests" });
  }
  if (serviceRequest.status !== "Pending") {
    return res.status(403).json({ message: "Only Pending requests can be updated" });
  }

  for (const field of fields) {
    serviceRequest[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
  }
  await serviceRequest.save();
  res.json({ message: "Request updated", data: serviceRequest });
}

export async function deleteRequest(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (req.user.role === "student") {
    if (serviceRequest.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own requests" });
    }
    if (serviceRequest.status !== "Pending") {
      return res.status(403).json({ message: "Only Pending requests can be deleted" });
    }
  }

  await serviceRequest.deleteOne();
  res.json({ message: "Request deleted" });
}

export async function changeStatus(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  const { status, priority } = req.body;
  if (!REQUEST_STATUSES.includes(status)) {
    return res.status(400).json({ message: "A valid status is required" });
  }
  if (priority !== undefined && !REQUEST_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: "Priority must be Low, Medium, or High" });
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (!canTransitionRequest(serviceRequest.status, status)) {
    return res.status(400).json({
      message: `Cannot change status from ${serviceRequest.status} to ${status}`,
    });
  }
  if (status === "Assigned" && !serviceRequest.assignedTo) {
    return res.status(400).json({ message: "Assign the request to an admin before marking it Assigned" });
  }

  serviceRequest.status = status;
  if (priority !== undefined) {
    serviceRequest.priority = priority;
  }
  await serviceRequest.save();
  res.json({ message: "Request status updated", data: serviceRequest });
}

export async function assignRequest(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  const { assignedTo } = req.body;
  if (!validId(assignedTo)) {
    return res.status(400).json({ message: "A valid assignedTo user ID is required" });
  }

  const [serviceRequest, assignee] = await Promise.all([
    ServiceRequest.findById(req.params.id),
    User.findById(assignedTo).select("_id role"),
  ]);
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (!assignee || assignee.role !== "admin") {
    return res.status(400).json({ message: "assignedTo must reference an existing admin account" });
  }
  if (!["Under Review", "Assigned"].includes(serviceRequest.status)) {
    return res.status(400).json({ message: "Requests can only be assigned while Under Review or Assigned" });
  }

  serviceRequest.assignedTo = assignee._id;
  if (serviceRequest.status === "Under Review") {
    serviceRequest.status = "Assigned";
  }
  await serviceRequest.save();
  res.json({ message: "Request assigned", data: serviceRequest });
}

export async function addAdminResponse(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  const { adminResponse } = req.body;
  if (!isNonEmptyString(adminResponse, 3000)) {
    return res.status(400).json({ message: "Response must be a non-empty string of at most 3000 characters" });
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    return res.status(404).json({ message: "Request not found" });
  }

  serviceRequest.adminResponse = adminResponse.trim();
  await serviceRequest.save();
  res.json({ message: "Admin response added", data: serviceRequest });
}
