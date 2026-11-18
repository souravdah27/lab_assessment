export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: "Validation failed", errors: messages });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier or value" });
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
}
