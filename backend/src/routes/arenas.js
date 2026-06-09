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

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const matchCount = await db.query(
    "SELECT COUNT(*)::int AS count FROM MATCH_DATA WHERE arena_id = $1",
    [id]
  );
  if (matchCount.rows[0].count > 0) {
    return res.status(409).json({
      error: `Cannot delete arena: ${matchCount.rows[0].count} match(es) reference it. Delete those matches first.`,
    });
  }
  const result = await db.query(
    "DELETE FROM ARENA WHERE arena_id = $1",
    [id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Arena not found" });
  }
  res.status(204).end();
});

module.exports = router;
