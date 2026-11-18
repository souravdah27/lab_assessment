import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isNonEmptyString } from "../utils/validation.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set");
  }

  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

export async function register(req, res) {
  const { name, email, password, department } = req.body;

  if (
    !isNonEmptyString(name, 100) ||
    typeof email !== "string" ||
    !EMAIL_PATTERN.test(email.trim()) ||
    email.trim().length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128 ||
    !isNonEmptyString(department, 100)
  ) {
    return res.status(400).json({
      message: "Provide a valid name, email, password (8-128 characters), and department",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    department: department.trim(),
    role: "student",
  });
  const token = createToken(user);

  res.status(201).json({
    message: "Registration successful",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    message: "Login successful",
    data: {
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    },
  });
}
