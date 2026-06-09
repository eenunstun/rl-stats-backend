const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM PLAYER ORDER BY player_id"
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const playerQ = await db.query(
    "SELECT * FROM PLAYER WHERE player_id = $1",
    [id]
  );
  if (playerQ.rowCount === 0) {
    return res.status(404).json({ error: "Player not found" });
  }
  const teams = await db.query(
    `SELECT T.team_id, T.team_name, T.region, PF.since, PF.until
     FROM PLAYS_FOR PF
     JOIN TEAM T ON T.team_id = PF.team_id
     WHERE PF.player_id = $1
     ORDER BY PF.since DESC`,
    [id]
  );
  const stats = await db.query(
    `SELECT COUNT(*)::int AS matches_played,
            COALESCE(SUM(goals), 0)::int AS total_goals,
            COALESCE(SUM(assists), 0)::int AS total_assists,
            COALESCE(SUM(saves), 0)::int AS total_saves,
            COALESCE(ROUND(AVG(shot_accuracy), 2), 0) AS avg_shot_accuracy,
            COALESCE(SUM(CASE WHEN mvp THEN 1 ELSE 0 END), 0)::int AS mvp_count
     FROM PLAYER_MATCH_STATS
     WHERE player_id = $1`,
    [id]
  );
  res.json({
    ...playerQ.rows[0],
    teams: teams.rows,
    career_stats: stats.rows[0],
  });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { player_name, platform } = req.body || {};
  if (!player_name || !platform) {
    return res.status(400).json({ error: "player_name and platform are required" });
  }
  const result = await db.query(
    `INSERT INTO PLAYER (player_id, player_name, platform)
     VALUES ((SELECT COALESCE(MAX(player_id), 0) + 1 FROM PLAYER), $1, $2)
     RETURNING *`,
    [player_name, platform]
  );
  res.status(201).json(result.rows[0]);
});

router.post("/:id/plays-for", requireAuth, requireAdmin, async (req, res) => {
  const player_id = Number(req.params.id);
  const { team_id, since, until } = req.body || {};
  if (!team_id || !since) {
    return res.status(400).json({ error: "team_id and since are required" });
  }
  // Close any currently open contract before opening a new one.
  await db.query(
    `UPDATE PLAYS_FOR
     SET until = $1::date
     WHERE player_id = $2 AND until IS NULL AND since < $1::date`,
    [since, player_id]
  );
  const result = await db.query(
    `INSERT INTO PLAYS_FOR (player_id, team_id, since, until)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [player_id, team_id, since, until || null]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
