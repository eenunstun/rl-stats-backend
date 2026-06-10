const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        P.player_id,
        P.player_name,
        P.platform,

        COALESCE(SUM(PMS.goals), 0)::int AS goals,
        COALESCE(SUM(PMS.assists), 0)::int AS assists,
        COALESCE(SUM(PMS.saves), 0)::int AS saves,

        COALESCE(
          ROUND(AVG(PMS.shot_accuracy), 2),
          0
        ) AS shot_accuracy

      FROM PLAYER P

      LEFT JOIN PLAYER_MATCH_STATS PMS
        ON P.player_id = PMS.player_id

      GROUP BY
        P.player_id,
        P.player_name,
        P.platform

      ORDER BY goals DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch leaderboard"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        P.player_id,
        P.player_name,
        P.platform,
        T.team_id,
        T.team_name,
        TO_CHAR(PF.since, 'YYYY-MM-DD') AS since
      FROM PLAYER P
      LEFT JOIN PLAYS_FOR PF
        ON PF.player_id = P.player_id
        AND PF.until IS NULL
      LEFT JOIN TEAM T
        ON T.team_id = PF.team_id
      ORDER BY P.player_id
    `);

    res.json(rows);

  } catch (err) {
    console.error("Players fetch error:", err);

    res.status(500).json({
      error: "Failed to fetch players"
    });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { player_name, platform } = req.body || {};

    if (!player_name || !platform) {
      return res.status(400).json({
        error: "player_name and platform are required",
      });
    }

    const result = await db.query(
      `INSERT INTO PLAYER (player_name, platform)
       VALUES ($1, $2)
       RETURNING *`,
      [player_name.trim(), platform]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create player error:", err);
    res.status(500).json({ error: "Failed to create player" });
  }
});

router.post("/:id/plays-for", requireAuth, requireAdmin, async (req, res) => {
  try {
    const player_id = Number(req.params.id);
    const { team_id, since, until } = req.body || {};

    if (!team_id || !since) {
      return res.status(400).json({
        error: "team_id and since are required",
      });
    }

    await db.query(
      `UPDATE PLAYS_FOR
       SET until = $1::date
       WHERE player_id = $2 
         AND until IS NULL 
         AND since < $1::date`,
      [since, player_id]
    );

    const result = await db.query(
      `INSERT INTO PLAYS_FOR (player_id, team_id, since, until)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [player_id, team_id, since, until || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Assign player to team error:", err);
    res.status(500).json({ error: "Failed to assign player to team" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const player_id = Number(req.params.id);

    const result = await db.query(
      `DELETE FROM PLAYER
       WHERE player_id = $1
       RETURNING *`,
      [player_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Player not found"
      });
    }

    res.json({
      message: "Player deleted successfully",
      player: result.rows[0]
    });

  } catch (err) {
    console.error("Delete player error:", err);
    res.status(500).json({
      error: "Failed to delete player"
    });
  }
});

module.exports = router;