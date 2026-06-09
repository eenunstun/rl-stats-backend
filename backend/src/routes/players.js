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

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const counts = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM PLAYER_MATCH_STATS WHERE player_id = $1)::int AS stats,
       (SELECT COUNT(*) FROM PLAYS_FOR WHERE player_id = $1)::int AS contracts,
       (SELECT COUNT(*) FROM FAV_PLAYER WHERE player_id = $1)::int AS favorites`,
    [id]
  );
  const { stats, contracts, favorites } = counts.rows[0];
  if (stats + contracts + favorites > 0) {
    return res.status(409).json({
      error: `Cannot delete player: ${stats} stat row(s), ${contracts} contract(s), ${favorites} favorite(s) reference it. Delete those first.`,
    });
  }
  const result = await db.query(
    "DELETE FROM PLAYER WHERE player_id = $1",
    [id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Player not found" });
  }
  res.status(204).end();
});

// Composite key on PLAYS_FOR is (player_id, team_id, since). The `since` query
// param targets a specific contract; without it, all contracts for the pair
// are removed.
router.delete(
  "/:player_id/plays-for/:team_id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const player_id = Number(req.params.player_id);
    const team_id = Number(req.params.team_id);
    const { since } = req.query;
    const result = since
      ? await db.query(
          "DELETE FROM PLAYS_FOR WHERE player_id = $1 AND team_id = $2 AND since = $3::date",
          [player_id, team_id, since]
        )
      : await db.query(
          "DELETE FROM PLAYS_FOR WHERE player_id = $1 AND team_id = $2",
          [player_id, team_id]
        );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contract not found" });
    }
    res.status(204).end();
  }
);

module.exports = router;
