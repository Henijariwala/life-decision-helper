// middleware/errorHandler.js - Global Error Handler
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Default error values
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Development vs Production error details
  const errorDetails = process.env.NODE_ENV === "development" 
    ? {
        stack: err.stack,
        error: err
      }
    : {};

  // Log error for monitoring
  if (statusCode === 500) {
    console.error("🚨 CRITICAL ERROR:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.email || "anonymous"
    });
  }

  // Render error page
  res.status(statusCode).render("error", {
    title: `Error ${statusCode}`,
    message,
    code: statusCode,
    ...errorDetails
  });
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler
};