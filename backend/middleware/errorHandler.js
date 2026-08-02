// 404 handler for unmatched routes
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralized error handler — every controller forwards errors here via
// next(err) instead of handling them individually. Keeps error responses
// consistent and stops raw DB/stack details from leaking to the client.
function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
