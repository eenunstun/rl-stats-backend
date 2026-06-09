const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM TEAM ORDER BY team_id"
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const teamQ = await db.query(
    "SELECT * FROM TEAM WHERE team_id = $1",
    [id]
  );
  if (teamQ.rowCount === 0) {
    return res.status(404).json({ error: "Team not found" });
  }
  const roster = await db.query(
    `SELECT P.player_id, P.player_name, P.platform, PF.since, PF.until
     FROM PLAYS_FOR PF
     JOIN PLAYER P ON P.player_id = PF.player_id
     WHERE PF.team_id = $1 AND PF.until IS NULL
     ORDER BY P.player_name`,
    [id]
  );
  const stats = await db.query(
    `SELECT COUNT(DISTINCT PA.match_id)::int AS matches_played,
            COALESCE(SUM(PMS.goals), 0)::int AS total_goals,
            COALESCE(SUM(PMS.assists), 0)::int AS total_assists,
            COALESCE(SUM(PMS.saves), 0)::int AS total_saves
     FROM PLAYS_AS PA
     JOIN PLAYS_FOR PF ON PF.team_id = PA.team_id
     JOIN PLAYER_MATCH_STATS PMS
       ON PMS.match_id = PA.match_id
      AND PMS.player_id = PF.player_id
     JOIN MATCH_DATA M ON M.match_id = PA.match_id
     WHERE PA.team_id = $1
       AND M.match_date >= PF.since
       AND (PF.until IS NULL OR M.match_date <= PF.until)`,
    [id]
  );
  res.json({
    ...teamQ.rows[0],
    current_roster: roster.rows,
    stats: stats.rows[0],
  });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { team_name, region } = req.body || {};
  if (!team_name || !region) {
    return res.status(400).json({ error: "team_name and region are required" });
  }
  const result = await db.query(
    `INSERT INTO TEAM (team_id, team_name, region)
     VALUES ((SELECT COALESCE(MAX(team_id), 0) + 1 FROM TEAM), $1, $2)
     RETURNING *`,
    [team_name, region]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
