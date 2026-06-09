function notFound(req, res) {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === "23505") {
    return res.status(409).json({ error: "Duplicate entry violates a unique constraint" });
  }
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced row does not exist (foreign key violation)" });
  }
  if (err.code === "23514") {
    return res.status(400).json({ error: "Check constraint violation" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
