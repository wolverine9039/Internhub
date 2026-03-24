/**
 * Centralized error handler middleware.
 * Catches all errors thrown via next(err) or AppError.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  // Handle MySQL duplicate entry specifically
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A resource with this identifier already exists',
        details: [],
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      },
    });
  }

  return res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || [],
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
};

module.exports = errorHandler;
