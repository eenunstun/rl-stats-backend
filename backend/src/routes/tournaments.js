const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM TOURNAMENT ORDER BY start_date DESC"
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const tournamentQ = await db.query(
    "SELECT * FROM TOURNAMENT WHERE tournament_id = $1",
    [id]
  );
  if (tournamentQ.rowCount === 0) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  const matches = await db.query(
    `SELECT M.*, A.arena_name
     FROM MATCH_DATA M
     JOIN ARENA A ON A.arena_id = M.arena_id
     WHERE M.tournament_id = $1
     ORDER BY M.match_date`,
    [id]
  );
  res.json({ ...tournamentQ.rows[0], matches: matches.rows });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { tournament_name, country, start_date, end_date } = req.body || {};
  if (!tournament_name || !country || !start_date || !end_date) {
    return res.status(400).json({
      error: "tournament_name, country, start_date, end_date are required",
    });
  }
  const result = await db.query(
    `INSERT INTO TOURNAMENT (tournament_id, tournament_name, country, start_date, end_date)
     VALUES ((SELECT COALESCE(MAX(tournament_id), 0) + 1 FROM TOURNAMENT), $1, $2, $3, $4)
     RETURNING *`,
    [tournament_name, country, start_date, end_date]
  );
  res.status(201).json(result.rows[0]);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  // MATCH_DATA references TOURNAMENT(tournament_id) without ON DELETE CASCADE,
  // so we check up front and return a clear 409 instead of a generic FK error.
  const matchCount = await db.query(
    "SELECT COUNT(*)::int AS count FROM MATCH_DATA WHERE tournament_id = $1",
    [id]
  );
  if (matchCount.rows[0].count > 0) {
    return res.status(409).json({
      error: `Cannot delete tournament: ${matchCount.rows[0].count} match(es) reference it. Delete those matches first.`,
    });
  }
  const result = await db.query(
    "DELETE FROM TOURNAMENT WHERE tournament_id = $1",
    [id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.status(204).end();
});

module.exports = router;
