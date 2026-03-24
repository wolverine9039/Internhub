/**
 * AppError — Custom error class for consistent API error responses.
 * Based on REST best practices from .agent/skills.
 */
class AppError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
