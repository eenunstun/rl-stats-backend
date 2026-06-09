const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM ARENA ORDER BY arena_id"
  );
  res.json(rows);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { arena_name } = req.body || {};
  if (!arena_name) {
    return res.status(400).json({ error: "arena_name is required" });
  }
  const result = await db.query(
    `INSERT INTO ARENA (arena_id, arena_name)
     VALUES ((SELECT COALESCE(MAX(arena_id), 0) + 1 FROM ARENA), $1)
     RETURNING *`,
    [arena_name]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
