const express = require("express");
const db = require("../db");
const { signToken, requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function validateStrongPassword(password, username) {
  const safePassword = password || "";
  const safeUsername = (username || "").toLowerCase();

  const rules = {
    length: safePassword.length >= 8 && safePassword.length <= 30,
    case: /[a-z]/.test(safePassword) && /[A-Z]/.test(safePassword),
    number: /[0-9]/.test(safePassword),
    special: /[^A-Za-z0-9]/.test(safePassword),
    usernameCheck: safePassword.length > 0 && (safeUsername === "" || !safePassword.toLowerCase().includes(safeUsername)),
  };

  return {
    isStrong: Object.values(rules).every(Boolean),
    rules,
  };
}

router.post("/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const passwordStrength = validateStrongPassword(password, username);
  if (!passwordStrength.isStrong) {
    return res.status(400).json({
      error: "Password must be 8-30 characters and include uppercase, lowercase, number, special character, and must not contain the username",
      rules: passwordStrength.rules,
    });
  }

  const existing = await db.query(
    "SELECT user_id FROM APP_USER WHERE username = $1",
    [username]
  );
  if (existing.rowCount > 0) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const result = await db.query(
    `INSERT INTO APP_USER (user_id, username, password, is_admin)
     VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM APP_USER), $1, $2, FALSE)
     RETURNING user_id, username, is_admin`,
    [username, password]
  );
  const user = result.rows[0];
  res.status(201).json({ user, token: signToken(user) });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  const result = await db.query(
    "SELECT user_id, username, password, is_admin FROM APP_USER WHERE username = $1",
    [username]
  );
  if (result.rowCount === 0 || result.rows[0].password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const user = {
    user_id: result.rows[0].user_id,
    username: result.rows[0].username,
    is_admin: result.rows[0].is_admin,
  };
  res.json({ user, token: signToken(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        user_id,
        username,
        is_admin
      FROM APP_USER
      ORDER BY user_id
    `);

    res.json(rows);
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
