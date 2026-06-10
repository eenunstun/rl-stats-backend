const express = require("express");
const db = require("../db");
const queries = require("../queries");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Thegi four endpoints below read their SQL from database/advancedqueries.sql
// (single source of truth). Add a new endpoint by adding `-- name: <slug>`
// to that file and wiring a route here.

router.get("/top-scorers", async (req, res) => {
  const { rows } = await db.query(queries.get("top-scorers"));
  res.json(rows);
});

router.get("/top-teams-by-matches", async (req, res) => {
  const { rows } = await db.query(queries.get("top-teams-by-matches"));
  res.json(rows);
});

router.get("/fav-teams-leaderboard", async (req, res) => {
  const { rows } = await db.query(queries.get("fav-teams-leaderboard"));
  res.json(rows);
});

router.get("/top-popular-teams-by-goals", async (req, res) => {
  const { rows } = await db.query(queries.get("fav-teams-leaderboard"));
  res.json(rows);
});

router.get("/rank-tournaments-by-goals", async (req, res) => {
  const { rows } = await db.query(queries.get("rank-tournaments-by-goals"));
  res.json(rows);
});

router.get("/top-tournament", async (req, res) => {
  const { rows } = await db.query(queries.get("rank-tournaments-by-goals"));
  res.json(rows);
});

router.get("/player-match-stats", requireAuth, requireAdmin, async (req, res) => {
  const playerId = Number(req.query.player_id);

  if (!Number.isInteger(playerId)) {
    return res.status(400).json({ error: "player_id is required" });
  }

  try {
    const { rows } = await db.query(
      `
      SELECT
        PMS.player_id,
        P.player_name,
        PMS.match_id,
        TO_CHAR(M.match_date, 'YYYY-MM-DD') AS match_date,
        M.tournament_stage,
        COALESCE(T.tournament_name, 'Non-Tournament Match') AS tournament_name,
        A.arena_name,
        PMS.goals,
        PMS.assists,
        PMS.saves,
        PMS.shot_accuracy,
        PMS.mvp
      FROM PLAYER_MATCH_STATS PMS
      JOIN PLAYER P
        ON P.player_id = PMS.player_id
      JOIN MATCH_DATA M
        ON M.match_id = PMS.match_id
      LEFT JOIN TOURNAMENT T
        ON T.tournament_id = M.tournament_id
      JOIN ARENA A
        ON A.arena_id = M.arena_id
      WHERE PMS.player_id = $1
      ORDER BY M.match_date DESC, PMS.match_id DESC
      `,
      [playerId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Player match stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch player match stats" });
  }
});

router.patch("/player-match-stats/:playerId/:matchId", requireAuth, requireAdmin, async (req, res) => {
  const playerId = Number(req.params.playerId);
  const matchId = Number(req.params.matchId);
  const { goals, assists, saves, shot_accuracy, mvp } = req.body || {};

  if (!Number.isInteger(playerId) || !Number.isInteger(matchId)) {
    return res.status(400).json({ error: "Valid player_id and match_id are required" });
  }

  const numericGoals = Number(goals);
  const numericAssists = Number(assists);
  const numericSaves = Number(saves);
  const numericShotAccuracy = Number(shot_accuracy);

  if (
    !Number.isInteger(numericGoals) ||
    !Number.isInteger(numericAssists) ||
    !Number.isInteger(numericSaves) ||
    !Number.isFinite(numericShotAccuracy)
  ) {
    return res.status(400).json({
      error: "goals, assists, saves, and shot_accuracy must be numeric",
    });
  }

  if (numericGoals < 0 || numericAssists < 0 || numericSaves < 0) {
    return res.status(400).json({
      error: "goals, assists, and saves cannot be negative",
    });
  }

  if (numericShotAccuracy < 0 || numericShotAccuracy > 100) {
    return res.status(400).json({
      error: "shot_accuracy must be between 0 and 100",
    });
  }

  try {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      if (Boolean(mvp)) {
        await client.query(
          `UPDATE PLAYER_MATCH_STATS
           SET mvp = FALSE
           WHERE match_id = $1`,
          [matchId]
        );
      }

      const result = await client.query(
      `
      UPDATE PLAYER_MATCH_STATS
      SET
        goals = $1,
        assists = $2,
        saves = $3,
        shot_accuracy = $4,
        mvp = COALESCE($5, FALSE)
      WHERE player_id = $6
        AND match_id = $7
      RETURNING *
      `,
      [
        numericGoals,
        numericAssists,
        numericSaves,
        numericShotAccuracy,
        Boolean(mvp),
        playerId,
        matchId,
      ]
    );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          error: "No existing match stats found for this player and match",
        });
      }

      await client.query("COMMIT");

      res.json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Player match stats update error:", err);
    res.status(500).json({ error: "Failed to update player match stats" });
  }
});

module.exports = router;
