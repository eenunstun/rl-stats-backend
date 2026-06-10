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

router.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query(`
      WITH team_scores AS (
        SELECT
          PA.match_id,
          PA.team_id,
          PA.team_type,
          COALESCE(SUM(PMS.goals), 0)::int AS team_score
        FROM PLAYS_AS PA
        JOIN MATCH_DATA M
          ON M.match_id = PA.match_id
        LEFT JOIN PLAYS_FOR PF
          ON PF.team_id = PA.team_id
         AND M.match_date >= PF.since
         AND (PF.until IS NULL OR M.match_date <= PF.until)
        LEFT JOIN PLAYER_MATCH_STATS PMS
          ON PMS.match_id = PA.match_id
         AND PMS.player_id = PF.player_id
        GROUP BY PA.match_id, PA.team_id, PA.team_type
      ),
      match_scores AS (
        SELECT
          match_id,
          COALESCE(MAX(team_score) FILTER (WHERE team_type = 'BLUE'), 0)::int AS blue_score,
          COALESCE(MAX(team_score) FILTER (WHERE team_type = 'ORANGE'), 0)::int AS orange_score
        FROM team_scores
        GROUP BY match_id
      ),
      team_wins AS (
        SELECT
          TS.team_id,
          COUNT(*) FILTER (
            WHERE
              (TS.team_type = 'BLUE' AND MS.blue_score > MS.orange_score)
              OR
              (TS.team_type = 'ORANGE' AND MS.orange_score > MS.blue_score)
          )::int AS wins
        FROM team_scores TS
        JOIN match_scores MS
          ON MS.match_id = TS.match_id
        GROUP BY TS.team_id
      )
      SELECT
        T.team_id,
        T.team_name,
        T.region,

        COUNT(DISTINCT PA.match_id)::int AS matches_played,
        COALESCE(TW.wins, 0)::int AS wins,

        COALESCE(SUM(PMS.goals), 0)::int AS goals,
        COALESCE(SUM(PMS.assists), 0)::int AS assists,
        COALESCE(SUM(PMS.saves), 0)::int AS saves,

        COALESCE(
          ROUND(AVG(PMS.shot_accuracy), 2),
          0
        ) AS accuracy

      FROM TEAM T

      LEFT JOIN PLAYS_AS PA
        ON PA.team_id = T.team_id

      LEFT JOIN MATCH_DATA M
        ON M.match_id = PA.match_id

      LEFT JOIN PLAYS_FOR PF
        ON PF.team_id = T.team_id
        AND M.match_date >= PF.since
        AND (PF.until IS NULL OR M.match_date <= PF.until)

      LEFT JOIN PLAYER_MATCH_STATS PMS
        ON PMS.match_id = PA.match_id
        AND PMS.player_id = PF.player_id

      LEFT JOIN team_wins TW
        ON TW.team_id = T.team_id

      GROUP BY
        T.team_id,
        T.team_name,
        T.region,
        TW.wins

      ORDER BY goals DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("Team leaderboard fetch error:", err);

    res.status(500).json({
      error: "Failed to fetch team leaderboard"
    });
  }
});

router.get("/:id/stats", async (req, res) => {
  const teamId = Number(req.params.id);

  if (!Number.isInteger(teamId)) {
    return res.status(400).json({ error: "Valid team_id is required" });
  }

  try {
    const [teamResult, leaderboardResult, rosterResult, matchResult] = await Promise.all([
      db.query("SELECT * FROM TEAM WHERE team_id = $1", [teamId]),
      db.query(`
        WITH team_scores AS (
          SELECT
            PA.match_id,
            PA.team_id,
            PA.team_type,
            COALESCE(SUM(PMS.goals), 0)::int AS team_score
          FROM PLAYS_AS PA
          JOIN MATCH_DATA M ON M.match_id = PA.match_id
          LEFT JOIN PLAYS_FOR PF
            ON PF.team_id = PA.team_id
           AND M.match_date >= PF.since
           AND (PF.until IS NULL OR M.match_date <= PF.until)
          LEFT JOIN PLAYER_MATCH_STATS PMS
            ON PMS.match_id = PA.match_id
           AND PMS.player_id = PF.player_id
          GROUP BY PA.match_id, PA.team_id, PA.team_type
        ),
        match_scores AS (
          SELECT
            match_id,
            COALESCE(MAX(team_score) FILTER (WHERE team_type = 'BLUE'), 0)::int AS blue_score,
            COALESCE(MAX(team_score) FILTER (WHERE team_type = 'ORANGE'), 0)::int AS orange_score
          FROM team_scores
          GROUP BY match_id
        )
        SELECT
          COUNT(DISTINCT PA.match_id)::int AS matches_played,
          COUNT(DISTINCT PA.match_id) FILTER (
            WHERE
              (PA.team_type = 'BLUE' AND MS.blue_score > MS.orange_score)
              OR
              (PA.team_type = 'ORANGE' AND MS.orange_score > MS.blue_score)
          )::int AS wins,
          COALESCE(SUM(PMS.goals), 0)::int AS goals,
          COALESCE(SUM(PMS.assists), 0)::int AS assists,
          COALESCE(SUM(PMS.saves), 0)::int AS saves,
          COALESCE(ROUND(AVG(PMS.shot_accuracy), 2), 0) AS accuracy
        FROM TEAM T
        LEFT JOIN PLAYS_AS PA ON PA.team_id = T.team_id
        LEFT JOIN MATCH_DATA M ON M.match_id = PA.match_id
        LEFT JOIN PLAYS_FOR PF
          ON PF.team_id = T.team_id
         AND M.match_date >= PF.since
         AND (PF.until IS NULL OR M.match_date <= PF.until)
        LEFT JOIN PLAYER_MATCH_STATS PMS
          ON PMS.match_id = PA.match_id
         AND PMS.player_id = PF.player_id
        LEFT JOIN match_scores MS ON MS.match_id = PA.match_id
        WHERE T.team_id = $1
      `, [teamId]),
      db.query(`
        SELECT P.player_id, P.player_name, P.platform, TO_CHAR(PF.since, 'YYYY-MM-DD') AS since
        FROM PLAYS_FOR PF
        JOIN PLAYER P ON P.player_id = PF.player_id
        WHERE PF.team_id = $1 AND PF.until IS NULL
        ORDER BY P.player_name
      `, [teamId]),
      db.query(`
        WITH team_scores AS (
          SELECT
            PA.match_id,
            PA.team_type,
            PA.team_id,
            T.team_name,
            COALESCE(SUM(PMS.goals), 0)::int AS team_score,
            COALESCE(SUM(PMS.assists), 0)::int AS assists,
            COALESCE(SUM(PMS.saves), 0)::int AS saves,
            COALESCE(ROUND(AVG(PMS.shot_accuracy), 2), 0) AS accuracy
          FROM PLAYS_AS PA
          JOIN TEAM T ON T.team_id = PA.team_id
          JOIN MATCH_DATA M ON M.match_id = PA.match_id
          LEFT JOIN PLAYS_FOR PF
            ON PF.team_id = PA.team_id
           AND M.match_date >= PF.since
           AND (PF.until IS NULL OR M.match_date <= PF.until)
          LEFT JOIN PLAYER_MATCH_STATS PMS
            ON PMS.match_id = PA.match_id
           AND PMS.player_id = PF.player_id
          GROUP BY PA.match_id, PA.team_type, PA.team_id, T.team_name
        )
        SELECT
          M.match_id,
          TO_CHAR(M.match_date, 'YYYY-MM-DD') AS match_date,
          M.tournament_stage,
          M.weather,
          COALESCE(TR.tournament_name, 'Non-Tournament Match') AS tournament_name,
          A.arena_name,
          MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_name END) AS blue_team,
          MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_name END) AS orange_team,
          MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_score END) AS blue_score,
          MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_score END) AS orange_score,
          MAX(CASE WHEN TS.team_id = $1 THEN TS.team_type END) AS selected_team_type,
          MAX(CASE WHEN TS.team_id = $1 THEN TS.team_score END) AS selected_team_score,
          MAX(CASE WHEN TS.team_id = $1 THEN TS.assists END) AS selected_team_assists,
          MAX(CASE WHEN TS.team_id = $1 THEN TS.saves END) AS selected_team_saves,
          MAX(CASE WHEN TS.team_id = $1 THEN TS.accuracy END) AS selected_team_accuracy,
          MVP.player_name AS mvp_player_name
        FROM MATCH_DATA M
        JOIN PLAYS_AS PA ON PA.match_id = M.match_id AND PA.team_id = $1
        JOIN ARENA A ON A.arena_id = M.arena_id
        LEFT JOIN TOURNAMENT TR ON TR.tournament_id = M.tournament_id
        LEFT JOIN team_scores TS ON TS.match_id = M.match_id
        LEFT JOIN PLAYER_MATCH_STATS MVP_STATS ON MVP_STATS.match_id = M.match_id AND MVP_STATS.mvp = TRUE
        LEFT JOIN PLAYER MVP ON MVP.player_id = MVP_STATS.player_id
        GROUP BY M.match_id, M.match_date, M.tournament_stage, M.weather, TR.tournament_name, A.arena_name, MVP.player_name
        ORDER BY M.match_date DESC, M.match_id DESC
      `, [teamId])
    ]);

    if (teamResult.rowCount === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({
      team: teamResult.rows[0],
      stats: leaderboardResult.rows[0],
      current_roster: rosterResult.rows,
      matches: matchResult.rows
    });
  } catch (err) {
    console.error("Team stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch team stats" });
  }
});

router.get("/with-rosters", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        T.team_id,
        T.team_name,
        T.region,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'player_id', P.player_id,
              'player_name', P.player_name,
              'platform', P.platform,
              'since', PF.since
            )
          ) FILTER (WHERE P.player_id IS NOT NULL),
          '[]'
        ) AS players
      FROM TEAM T
      LEFT JOIN PLAYS_FOR PF
        ON T.team_id = PF.team_id
        AND PF.until IS NULL
      LEFT JOIN PLAYER P
        ON P.player_id = PF.player_id
      GROUP BY
        T.team_id,
        T.team_name,
        T.region
      ORDER BY T.team_id
    `);

    res.json(rows);
  } catch (err) {
    console.error("Teams with rosters fetch error:", err);
    res.status(500).json({ error: "Failed to fetch teams with rosters" });
  }
});

// Get historical team rosters by match date
router.get("/rosters-by-date", async (req, res) => {
  const { match_date } = req.query;

  if (!match_date) {
    return res.status(400).json({ error: "match_date is required." });
  }

  try {
    const result = await db.query(`
      SELECT 
        T.team_id,
        T.team_name,
        P.player_id,
        P.player_name
      FROM TEAM T
      LEFT JOIN PLAYS_FOR PF
        ON T.team_id = PF.team_id
        AND $1::date >= PF.since
        AND (
          PF.until IS NULL
          OR $1::date <= PF.until
        )
      LEFT JOIN PLAYER P
        ON PF.player_id = P.player_id
      ORDER BY T.team_name, P.player_name;
    `, [match_date]);

    const teamsMap = {};

    result.rows.forEach(row => {
      if (!teamsMap[row.team_id]) {
        teamsMap[row.team_id] = {
          team_id: row.team_id,
          team_name: row.team_name,
          players: []
        };
      }

      if (row.player_id) {
        teamsMap[row.team_id].players.push({
          player_id: row.player_id,
          player_name: row.player_name
        });
      }
    });

    res.json(Object.values(teamsMap));

  } catch (err) {
    console.error("Rosters by date error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

router.get("/:id/last-match", async (req, res) => {
  const teamId = Number(req.params.id);

  if (!Number.isInteger(teamId)) {
    return res.status(400).json({ error: "Valid team_id is required" });
  }

  try {
    const { rows } = await db.query(
      `
      WITH team_scores AS (
        SELECT
          PA.match_id,
          PA.team_type,
          T.team_id,
          T.team_name,
          COALESCE(SUM(PMS.goals), 0)::int AS team_score,
          COALESCE(SUM(PMS.assists), 0)::int AS assists,
          COALESCE(SUM(PMS.saves), 0)::int AS saves
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
        GROUP BY PA.match_id, PA.team_type, T.team_id, T.team_name
      )
      SELECT
        M.match_id,
        TO_CHAR(M.match_date, 'YYYY-MM-DD') AS match_date,
        M.tournament_stage,
        M.weather,
        COALESCE(TR.tournament_name, 'Non-Tournament Match') AS tournament_name,
        A.arena_name,
        MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_name END) AS blue_team,
        MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_name END) AS orange_team,
        MAX(CASE WHEN TS.team_type = 'BLUE' THEN TS.team_score END) AS blue_score,
        MAX(CASE WHEN TS.team_type = 'ORANGE' THEN TS.team_score END) AS orange_score,
        MAX(CASE WHEN TS.team_id = $1 THEN TS.team_type END) AS selected_team_type,
        MAX(CASE WHEN TS.team_id = $1 THEN TS.team_score END) AS selected_team_score,
        MAX(CASE WHEN TS.team_id = $1 THEN TS.assists END) AS selected_team_assists,
        MAX(CASE WHEN TS.team_id = $1 THEN TS.saves END) AS selected_team_saves
      FROM MATCH_DATA M
      JOIN PLAYS_AS PA
        ON PA.match_id = M.match_id
       AND PA.team_id = $1
      JOIN ARENA A
        ON A.arena_id = M.arena_id
      LEFT JOIN TOURNAMENT TR
        ON TR.tournament_id = M.tournament_id
      LEFT JOIN team_scores TS
        ON TS.match_id = M.match_id
      GROUP BY
        M.match_id,
        M.match_date,
        M.tournament_stage,
        M.weather,
        TR.tournament_name,
        A.arena_name
      ORDER BY M.match_date DESC, M.match_id DESC
      LIMIT 1
      `,
      [teamId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("Team last match fetch error:", err);
    res.status(500).json({ error: "Failed to fetch team last match" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const teamQ = await db.query(
    "SELECT * FROM TEAM WHERE team_id = $1",
    [id]
  );

  if (teamQ.rowCount === 0) {
    return res.status(404).json({
      error: "Team not found"
    });
  }

  const roster = await db.query(
    `SELECT
        P.player_id,
        P.player_name,
        P.platform,
        PF.since,
        PF.until
     FROM PLAYS_FOR PF
     JOIN PLAYER P
       ON P.player_id = PF.player_id
     WHERE PF.team_id = $1
       AND PF.until IS NULL
     ORDER BY P.player_name`,
    [id]
  );

  const stats = await db.query(
    `SELECT
        COUNT(DISTINCT PA.match_id)::int AS matches_played,
        COALESCE(SUM(PMS.goals), 0)::int AS total_goals,
        COALESCE(SUM(PMS.assists), 0)::int AS total_assists,
        COALESCE(SUM(PMS.saves), 0)::int AS total_saves
     FROM PLAYS_AS PA
     JOIN PLAYS_FOR PF
       ON PF.team_id = PA.team_id
     JOIN PLAYER_MATCH_STATS PMS
       ON PMS.match_id = PA.match_id
      AND PMS.player_id = PF.player_id
     JOIN MATCH_DATA M
       ON M.match_id = PA.match_id
     WHERE PA.team_id = $1
       AND M.match_date >= PF.since
       AND (PF.until IS NULL OR M.match_date <= PF.until)`,
    [id]
  );

  res.json({
    ...teamQ.rows[0],
    current_roster: roster.rows,
    stats: stats.rows[0]
  });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { team_name, region } = req.body || {};

    if (!team_name || !region) {
      return res.status(400).json({
        error: "team_name and region are required"
      });
    }

    const normalizedName = team_name.trim();
    const normalizedRegion = region.trim();

    const existing = await db.query(
      `SELECT team_id
       FROM TEAM
       WHERE LOWER(team_name) = LOWER($1)`,
      [normalizedName]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: "A team with this name already exists"
      });
    }

    const result = await db.query(
      `INSERT INTO TEAM (team_id, team_name, region)
       VALUES (
         (SELECT COALESCE(MAX(team_id), 0) + 1 FROM TEAM),
         $1,
         $2
       )
       RETURNING *`,
      [normalizedName, normalizedRegion]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.delete("/:teamId/players/:playerId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const playerId = Number(req.params.playerId);

    const result = await db.query(
      `UPDATE PLAYS_FOR
       SET until = CURRENT_DATE
       WHERE team_id = $1
         AND player_id = $2
         AND until IS NULL
       RETURNING *`,
      [teamId, playerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Active team membership not found"
      });
    }

    res.json({
      message: "Player removed from team successfully",
      membership: result.rows[0]
    });

  } catch (err) {
    console.error("Remove player from team error:", err);
    res.status(500).json({
      error: "Failed to remove player from team"
    });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const teamId = Number(req.params.id);

    await client.query("BEGIN");

    const matchIdsResult = await client.query(
      `SELECT match_id
       FROM PLAYS_AS
       WHERE team_id = $1`,
      [teamId]
    );

    const matchIds = matchIdsResult.rows.map(row => row.match_id);

    if (matchIds.length > 0) {
      await client.query(
        `DELETE FROM PLAYER_MATCH_STATS
         WHERE match_id = ANY($1::int[])`,
        [matchIds]
      );

      await client.query(
        `DELETE FROM PLAYS_AS
         WHERE match_id = ANY($1::int[])`,
        [matchIds]
      );

      await client.query(
        `DELETE FROM MATCH_DATA
         WHERE match_id = ANY($1::int[])`,
        [matchIds]
      );
    }

    await client.query(
      `DELETE FROM FAV_TEAM
       WHERE team_id = $1`,
      [teamId]
    );

    await client.query(
      `DELETE FROM PLAYS_FOR
       WHERE team_id = $1`,
      [teamId]
    );

    const result = await client.query(
      `DELETE FROM TEAM
       WHERE team_id = $1
       RETURNING *`,
      [teamId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Team not found" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Team deleted successfully",
      team: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete team error:", err);
    res.status(500).json({ error: "Failed to delete team" });
  } finally {
    client.release();
  }
});

module.exports = router;
