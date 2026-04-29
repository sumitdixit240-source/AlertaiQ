module.exports = (err, req, res, next) => {
  console.error("❌ Error Stack:", err.stack || err.message);

  // default status
  const statusCode = err.status || 500;

  // avoid leaking internal errors in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
};
