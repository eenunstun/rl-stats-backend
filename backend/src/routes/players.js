const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query(`
      WITH match_team_scores AS (
        SELECT
          PA.match_id,
          PA.team_id,
          PA.team_type,
          COALESCE(SUM(PMS.goals), 0)::int AS team_score
        FROM PLAYS_AS PA
        JOIN MATCH_DATA M
          ON M.match_id = PA.match_id
        JOIN PLAYS_FOR PF
          ON PF.team_id = PA.team_id
          AND M.match_date >= PF.since
          AND (PF.until IS NULL OR M.match_date <= PF.until)
        JOIN PLAYER_MATCH_STATS PMS
          ON PMS.match_id = PA.match_id
          AND PMS.player_id = PF.player_id
        GROUP BY PA.match_id, PA.team_id, PA.team_type
      ),
      match_scores AS (
        SELECT
          match_id,
          COALESCE(MAX(team_score) FILTER (WHERE team_type = 'BLUE'), 0)::int AS blue_score,
          COALESCE(MAX(team_score) FILTER (WHERE team_type = 'ORANGE'), 0)::int AS orange_score
        FROM match_team_scores
        GROUP BY match_id
      ),
      player_team_in_match AS (
        SELECT
          PMS.player_id,
          PMS.match_id,
          PA.team_type
        FROM PLAYER_MATCH_STATS PMS
        JOIN MATCH_DATA M
          ON M.match_id = PMS.match_id
        JOIN PLAYS_FOR PF
          ON PF.player_id = PMS.player_id
          AND M.match_date >= PF.since
          AND (PF.until IS NULL OR M.match_date <= PF.until)
        JOIN PLAYS_AS PA
          ON PA.match_id = PMS.match_id
          AND PA.team_id = PF.team_id
      ),
      player_wins AS (
        SELECT
          PTM.player_id,
          COUNT(*) FILTER (
            WHERE
              (PTM.team_type = 'BLUE' AND MS.blue_score > MS.orange_score)
              OR
              (PTM.team_type = 'ORANGE' AND MS.orange_score > MS.blue_score)
          )::int AS wins
        FROM player_team_in_match PTM
        JOIN match_scores MS
          ON MS.match_id = PTM.match_id
        GROUP BY PTM.player_id
      ),
      current_teams AS (
        SELECT DISTINCT ON (PF.player_id)
          PF.player_id,
          T.team_id,
          T.team_name
        FROM PLAYS_FOR PF
        JOIN TEAM T
          ON T.team_id = PF.team_id
        WHERE PF.until IS NULL
        ORDER BY PF.player_id, PF.since DESC
      )
      SELECT
        P.player_id,
        P.player_name,
        P.platform,
        CT.team_id,
        CT.team_name,

        COALESCE(SUM(PMS.goals), 0)::int AS goals,
        COALESCE(SUM(PMS.assists), 0)::int AS assists,
        COALESCE(SUM(PMS.saves), 0)::int AS saves,
        COALESCE(SUM(CASE WHEN PMS.mvp THEN 1 ELSE 0 END), 0)::int AS mvps,
        COALESCE(PW.wins, 0)::int AS wins,

        COALESCE(
          ROUND(AVG(PMS.shot_accuracy), 2),
          0
        ) AS shot_accuracy

      FROM PLAYER P

      LEFT JOIN PLAYER_MATCH_STATS PMS
        ON P.player_id = PMS.player_id

      LEFT JOIN player_wins PW
        ON PW.player_id = P.player_id

      LEFT JOIN current_teams CT
        ON CT.player_id = P.player_id

      GROUP BY
        P.player_id,
        P.player_name,
        P.platform,
        CT.team_id,
        CT.team_name,
        PW.wins

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

    const normalizedName = player_name.trim();

    const existing = await db.query(
      `SELECT player_id
       FROM PLAYER
       WHERE LOWER(player_name) = LOWER($1)`,
      [normalizedName]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: "A player with this name already exists",
      });
    }

    const result = await db.query(
      `INSERT INTO PLAYER (player_id, player_name, platform)
       VALUES (
         (SELECT COALESCE(MAX(player_id), 0) + 1 FROM PLAYER),
         $1,
         $2
       )
       RETURNING *`,
      [normalizedName, platform]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create player error:", err);
    res.status(500).json({ error: "Failed to create player" });
  }
});

router.get("/:id/last-match", async (req, res) => {
  const playerId = Number(req.params.id);

  if (!Number.isInteger(playerId)) {
    return res.status(400).json({ error: "Valid player_id is required" });
  }

  try {
    const { rows } = await db.query(
      `
      WITH team_scores AS (
        SELECT
          PA.match_id,
          PA.team_type,
          T.team_name,
          COALESCE(SUM(PMS.goals), 0)::int AS team_score
        FROM PLAYS_AS PA
        JOIN TEAM T
          ON T.team_id = PA.team_id
        JOIN MATCH_DATA M
          ON M.match_id = PA.match_id
        LEFT JOIN PLAYS_FOR PF
          ON PF.team_id = PA.team_id
         AND M.match_date >= PF.since
         AND (PF.until IS NULL OR M.match_date <= PF.until)
        LEFT JOIN PLAYER_MATCH_STATS PMS
          ON PMS.match_id = PA.match_id
         AND PMS.player_id = PF.player_id
        GROUP BY PA.match_id, PA.team_type, T.team_name
      )
      SELECT
        M.match_id,
        TO_CHAR(M.match_date, 'YYYY-MM-DD') AS match_date,
        M.tournament_stage,
        M.weather,
        COALESCE(TR.tournament_name, 'Non-Tournament Match') AS tournament_name,
        A.arena_name,
        PMS.goals,
        PMS.assists,
        PMS.saves,
        PMS.shot_accuracy,
        PMS.mvp,
        MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_name END) AS blue_team,
        MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_name END) AS orange_team,
        MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_score END) AS blue_score,
        MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_score END) AS orange_score
      FROM PLAYER_MATCH_STATS PMS
      JOIN MATCH_DATA M
        ON M.match_id = PMS.match_id
      JOIN ARENA A
        ON A.arena_id = M.arena_id
      LEFT JOIN TOURNAMENT TR
        ON TR.tournament_id = M.tournament_id
      LEFT JOIN team_scores TS
        ON TS.match_id = M.match_id
      WHERE PMS.player_id = $1
      GROUP BY
        M.match_id,
        M.match_date,
        M.tournament_stage,
        M.weather,
        TR.tournament_name,
        A.arena_name,
        PMS.goals,
        PMS.assists,
        PMS.saves,
        PMS.shot_accuracy,
        PMS.mvp
      ORDER BY M.match_date DESC, M.match_id DESC
      LIMIT 1
      `,
      [playerId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("Player last match fetch error:", err);
    res.status(500).json({ error: "Failed to fetch player last match" });
  }
});

router.post("/:id/plays-for", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const player_id = Number(req.params.id);
    const { team_id } = req.body || {};

    if (!Number.isInteger(player_id) || !team_id) {
      return res.status(400).json({
        error: "player_id and team_id are required",
      });
    }

    const targetTeamId = Number(team_id);

    await client.query("BEGIN");

    const activeMembership = await client.query(
      `SELECT team_id
       FROM PLAYS_FOR
       WHERE player_id = $1
         AND until IS NULL`,
      [player_id]
    );

    if (
      activeMembership.rowCount > 0 &&
      Number(activeMembership.rows[0].team_id) === targetTeamId
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Player is already assigned to this team",
      });
    }

    const targetRoster = await client.query(
      `SELECT COUNT(*)::int AS active_players
       FROM PLAYS_FOR
       WHERE team_id = $1
         AND until IS NULL`,
      [targetTeamId]
    );

    if (targetRoster.rows[0].active_players >= 3) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This team already has 3 active players",
      });
    }

    await client.query(
      `UPDATE PLAYS_FOR
       SET until = CURRENT_DATE
       WHERE player_id = $1
         AND until IS NULL`,
      [player_id]
    );

    const result = await client.query(
      `INSERT INTO PLAYS_FOR (player_id, team_id, since, until)
       VALUES ($1, $2, CURRENT_DATE, NULL)
       RETURNING *`,
      [player_id, targetTeamId]
    );

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign player to team error:", err);
    res.status(500).json({ error: "Failed to assign player to team" });
  } finally {
    client.release();
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const player_id = Number(req.params.id);

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM FAV_PLAYER
       WHERE player_id = $1`,
      [player_id]
    );

    await client.query(
      `DELETE FROM PLAYER_MATCH_STATS
       WHERE player_id = $1`,
      [player_id]
    );

    await client.query(
      `DELETE FROM PLAYS_FOR
       WHERE player_id = $1`,
      [player_id]
    );

    const result = await client.query(
      `DELETE FROM PLAYER
       WHERE player_id = $1
       RETURNING *`,
      [player_id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Player not found"
      });
    }

    await client.query("COMMIT");

    res.json({
      message: "Player deleted successfully",
      player: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete player error:", err);
    res.status(500).json({
      error: "Failed to delete player"
    });
  } finally {
    client.release();
  }
});

module.exports = router;
