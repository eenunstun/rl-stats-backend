const express = require("express");
const db = require("../db");
const queries = require("../queries");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { tournament_id, arena_id, stage } = req.query;
    const filters = [];
    const params = [];

    if (tournament_id) {
      params.push(Number(tournament_id));
      filters.push(`M.tournament_id = $${params.length}`);
    }

    if (arena_id) {
      params.push(Number(arena_id));
      filters.push(`M.arena_id = $${params.length}`);
    }

    if (stage) {
      params.push(stage);
      filters.push(`M.tournament_stage = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const sql = `
  SELECT
    M.match_id,
    M.match_date,
    M.tournament_stage,
    M.weather,
    M.tournament_id,
    M.arena_id,

    COALESCE(T.tournament_name, 'Non-Tournament Match') AS tournament_name,
    T.country,
    T.start_date,
    T.end_date,

    AR.arena_name,

    COALESCE(S.blue_team, BLUE.team_name) AS team1_name,
    COALESCE(S.orange_team, ORANGE.team_name) AS team2_name,
    COALESCE(S.blue_score, 0) AS team1_goals,
    COALESCE(S.orange_score, 0) AS team2_goals,
    COALESCE(BLUE_STATS.assists, 0) AS team1_assists,
    COALESCE(ORANGE_STATS.assists, 0) AS team2_assists,
    COALESCE(BLUE_STATS.saves, 0) AS team1_saves,
    COALESCE(ORANGE_STATS.saves, 0) AS team2_saves,
    COALESCE(BLUE_STATS.shot_accuracy, 0) AS team1_shot_accuracy,
    COALESCE(ORANGE_STATS.shot_accuracy, 0) AS team2_shot_accuracy,
    MVP_PLAYER.player_name AS mvp_player_name,

    CASE
      WHEN S.blue_score > S.orange_score THEN COALESCE(S.blue_team, BLUE.team_name)
      WHEN S.orange_score > S.blue_score THEN COALESCE(S.orange_team, ORANGE.team_name)
      WHEN S.blue_score IS NULL OR S.orange_score IS NULL THEN 'Not recorded'
      ELSE 'Draw'
    END AS winner_team_name

  FROM MATCH_DATA M
  LEFT JOIN TOURNAMENT T ON T.tournament_id = M.tournament_id
  JOIN ARENA AR ON AR.arena_id = M.arena_id
  LEFT JOIN PLAYS_AS BLUE_PA
    ON BLUE_PA.match_id = M.match_id
   AND BLUE_PA.team_type = 'BLUE'
  LEFT JOIN TEAM BLUE
    ON BLUE.team_id = BLUE_PA.team_id
  LEFT JOIN PLAYS_AS ORANGE_PA
    ON ORANGE_PA.match_id = M.match_id
   AND ORANGE_PA.team_type = 'ORANGE'
  LEFT JOIN TEAM ORANGE
    ON ORANGE.team_id = ORANGE_PA.team_id
  LEFT JOIN (
    ${queries.get("match-scores").replace(/ORDER BY A\.match_id;?/i, "")}
  ) S ON S.match_id = M.match_id
  LEFT JOIN (
    SELECT
      PA.match_id,
      SUM(PMS.assists) AS assists,
      SUM(PMS.saves) AS saves,
      ROUND(AVG(PMS.shot_accuracy), 2) AS shot_accuracy
    FROM PLAYS_AS PA
    JOIN PLAYS_FOR PF
      ON PF.team_id = PA.team_id
    JOIN PLAYER_MATCH_STATS PMS
      ON PMS.match_id = PA.match_id
     AND PMS.player_id = PF.player_id
    JOIN MATCH_DATA M2
      ON M2.match_id = PA.match_id
    WHERE PA.team_type = 'BLUE'
      AND M2.match_date >= PF.since
      AND (PF.until IS NULL OR M2.match_date <= PF.until)
    GROUP BY PA.match_id
  ) BLUE_STATS ON BLUE_STATS.match_id = M.match_id
  LEFT JOIN (
    SELECT
      PA.match_id,
      SUM(PMS.assists) AS assists,
      SUM(PMS.saves) AS saves,
      ROUND(AVG(PMS.shot_accuracy), 2) AS shot_accuracy
    FROM PLAYS_AS PA
    JOIN PLAYS_FOR PF
      ON PF.team_id = PA.team_id
    JOIN PLAYER_MATCH_STATS PMS
      ON PMS.match_id = PA.match_id
     AND PMS.player_id = PF.player_id
    JOIN MATCH_DATA M2
      ON M2.match_id = PA.match_id
    WHERE PA.team_type = 'ORANGE'
      AND M2.match_date >= PF.since
      AND (PF.until IS NULL OR M2.match_date <= PF.until)
    GROUP BY PA.match_id
  ) ORANGE_STATS ON ORANGE_STATS.match_id = M.match_id
  LEFT JOIN PLAYER_MATCH_STATS MVP_STATS
    ON MVP_STATS.match_id = M.match_id
   AND MVP_STATS.mvp = TRUE
  LEFT JOIN PLAYER MVP_PLAYER
    ON MVP_PLAYER.player_id = MVP_STATS.player_id

  ${where}

  ORDER BY M.match_date DESC, M.match_id DESC
`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/matches error:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Must come before /:id
router.get("/scores", async (req, res) => {
  const { rows } = await db.query(queries.get("match-scores"));
  res.json(rows);
});

// Must come before /:id
router.post("/tournament", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const {
      match_date,
      tournament_stage,
      weather,
      tournament_id,
      arena_id,
      team1_id,
      team2_id,
      players,
    } = req.body || {};

    if (
      !match_date ||
      !tournament_stage ||
      !weather ||
      !tournament_id ||
      !arena_id ||
      !team1_id ||
      !team2_id ||
      !Array.isArray(players) ||
      players.length !== 6
    ) {
      return res.status(400).json({
        error: "Missing required tournament match data",
      });
    }

    if (Number(team1_id) === Number(team2_id)) {
      return res.status(400).json({
        error: "Teams must be different",
      });
    }

    const blueTeamId = Number(team1_id);
    const orangeTeamId = Number(team2_id);
    const playerIds = players.map((p) => Number(p.player_id));

    const duplicateMatchup = await db.query(
      `
      SELECT M.match_id
      FROM MATCH_DATA M
      JOIN PLAYS_AS PA1
        ON PA1.match_id = M.match_id
      JOIN PLAYS_AS PA2
        ON PA2.match_id = M.match_id
      WHERE M.tournament_id = $1
        AND PA1.team_id = $2
        AND PA2.team_id = $3
      LIMIT 1
      `,
      [Number(tournament_id), blueTeamId, orangeTeamId]
    );

    if (duplicateMatchup.rowCount > 0) {
      return res.status(409).json({
        error: "These two teams already have a recorded match in this tournament",
      });
    }

    if (playerIds.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({
        error: "Each player must have a valid player_id",
      });
    }

    if (new Set(playerIds).size !== players.length) {
      return res.status(400).json({
        error: "Duplicate players are not allowed",
      });
    }

    const bluePlayers = players.filter((p) => Number(p.team_id) === blueTeamId);
    const orangePlayers = players.filter((p) => Number(p.team_id) === orangeTeamId);

    if (bluePlayers.length !== 3 || orangePlayers.length !== 3) {
      return res.status(400).json({
        error: "Tournament matches require exactly 3 blue players and 3 orange players",
      });
    }

    const mvpCount = players.filter((p) => p.mvp === true).length;

    if (mvpCount !== 1) {
      return res.status(400).json({
        error: "Exactly one MVP player is required",
      });
    }

    for (const p of players) {
      const goals = Number(p.goals);
      const assists = Number(p.assists);
      const saves = Number(p.saves);
      const shotAccuracy = Number(p.shot_accuracy);

      if (
        !Number.isInteger(goals) ||
        !Number.isInteger(assists) ||
        !Number.isInteger(saves) ||
        !Number.isFinite(shotAccuracy)
      ) {
        return res.status(400).json({
          error: "Player goals, assists, saves, and shot accuracy must be numeric",
        });
      }

      if (goals < 0 || assists < 0 || saves < 0) {
        return res.status(400).json({
          error: "Player goals, assists, and saves cannot be negative",
        });
      }

      if (shotAccuracy < 0 || shotAccuracy > 100) {
        return res.status(400).json({
          error: "Player shot accuracy must be between 0 and 100",
        });
      }
    }

    await client.query("BEGIN");

    const matchResult = await client.query(
      `
      INSERT INTO MATCH_DATA
        (match_date, tournament_stage, weather, tournament_id, arena_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [match_date, tournament_stage, weather, tournament_id, arena_id]
    );

    const match = matchResult.rows[0];
    const match_id = match.match_id;

    await client.query(
      `
      INSERT INTO PLAYS_AS
        (team_id, match_id, team_type)
      VALUES
        ($1, $2, 'BLUE'),
        ($3, $2, 'ORANGE')
      `,
      [team1_id, match_id, team2_id]
    );

    for (const p of players) {
      await client.query(
        `
        INSERT INTO PLAYER_MATCH_STATS
          (player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
        VALUES
          ($1, $2, $3, $4, $5, $6, COALESCE($7, FALSE))
        `,
        [
          p.player_id,
          match_id,
          p.goals,
          p.assists,
          p.saves,
          p.shot_accuracy,
          p.mvp,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Tournament match created successfully",
      match,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create tournament match error:", err);

    res.status(500).json({
      error: "Failed to create tournament match",
    });
  } finally {
    client.release();
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const matchQ = await db.query(
    `
    SELECT M.*, COALESCE(T.tournament_name, 'Non-Tournament Match') AS tournament_name, A.arena_name
    FROM MATCH_DATA M
    LEFT JOIN TOURNAMENT T ON T.tournament_id = M.tournament_id
    JOIN ARENA A ON A.arena_id = M.arena_id
    WHERE M.match_id = $1
    `,
    [id]
  );

  if (matchQ.rowCount === 0) {
    return res.status(404).json({ error: "Match not found" });
  }

  const teams = await db.query(
    `
    SELECT PA.team_type, T.team_id, T.team_name
    FROM PLAYS_AS PA
    JOIN TEAM T ON T.team_id = PA.team_id
    WHERE PA.match_id = $1
    `,
    [id]
  );

  const playerStats = await db.query(
    `
    SELECT PMS.*, P.player_name
    FROM PLAYER_MATCH_STATS PMS
    JOIN PLAYER P ON P.player_id = PMS.player_id
    WHERE PMS.match_id = $1
    ORDER BY PMS.goals DESC, PMS.assists DESC
    `,
    [id]
  );

  res.json({
    ...matchQ.rows[0],
    teams: teams.rows,
    player_stats: playerStats.rows,
  });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const match_id = Number(req.params.id);

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM PLAYER_MATCH_STATS
       WHERE match_id = $1`,
      [match_id]
    );

    await client.query(
      `DELETE FROM PLAYS_AS
       WHERE match_id = $1`,
      [match_id]
    );

    const result = await client.query(
      `DELETE FROM MATCH_DATA
       WHERE match_id = $1
       RETURNING *`,
      [match_id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Match not found" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Match deleted successfully",
      match: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete match error:", err);
    res.status(500).json({ error: "Failed to delete match" });
  } finally {
    client.release();
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const {
      match_date,
      tournament_stage = "Regular Match",
      weather,
      tournament_id = null,
      arena_id,
      team1_id,
      team2_id,
      players,
    } = req.body || {};

    if (
      !match_date ||
      !weather ||
      !arena_id ||
      !team1_id ||
      !team2_id ||
      !Array.isArray(players) ||
      players.length !== 6
    ) {
      return res.status(400).json({
        error: "match_date, weather, arena_id, team1_id, team2_id, and six player stats are required",
      });
    }

    if (Number(team1_id) === Number(team2_id)) {
      return res.status(400).json({ error: "Teams must be different" });
    }

    const blueTeamId = Number(team1_id);
    const orangeTeamId = Number(team2_id);
    const playerIds = players.map((p) => Number(p.player_id));

    if (playerIds.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({
        error: "Each player must have a valid player_id",
      });
    }

    if (new Set(playerIds).size !== players.length) {
      return res.status(400).json({
        error: "Duplicate players are not allowed",
      });
    }

    const bluePlayers = players.filter((p) => Number(p.team_id) === blueTeamId);
    const orangePlayers = players.filter((p) => Number(p.team_id) === orangeTeamId);

    if (bluePlayers.length !== 3 || orangePlayers.length !== 3) {
      return res.status(400).json({
        error: "Regular matches require exactly 3 blue players and 3 orange players",
      });
    }

    const mvpCount = players.filter((p) => p.mvp === true).length;

    if (mvpCount !== 1) {
      return res.status(400).json({
        error: "Exactly one MVP player is required",
      });
    }

    for (const p of players) {
      const goals = Number(p.goals);
      const assists = Number(p.assists);
      const saves = Number(p.saves);
      const shotAccuracy = Number(p.shot_accuracy);

      if (
        !Number.isInteger(goals) ||
        !Number.isInteger(assists) ||
        !Number.isInteger(saves) ||
        !Number.isFinite(shotAccuracy)
      ) {
        return res.status(400).json({
          error: "Player goals, assists, saves, and shot accuracy must be numeric",
        });
      }

      if (goals < 0 || assists < 0 || saves < 0) {
        return res.status(400).json({
          error: "Player goals, assists, and saves cannot be negative",
        });
      }

      if (shotAccuracy < 0 || shotAccuracy > 100) {
        return res.status(400).json({
          error: "Player shot accuracy must be between 0 and 100",
        });
      }
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO MATCH_DATA
        (match_date, tournament_stage, weather, tournament_id, arena_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [match_date, tournament_stage, weather, tournament_id || null, arena_id]
    );

    const match = result.rows[0];

    await client.query(
      `
      INSERT INTO PLAYS_AS
        (team_id, match_id, team_type)
      VALUES
        ($1, $2, 'BLUE'),
        ($3, $2, 'ORANGE')
      `,
      [team1_id, match.match_id, team2_id]
    );

    for (const p of players) {
      await client.query(
        `
        INSERT INTO PLAYER_MATCH_STATS
          (player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
        VALUES
          ($1, $2, $3, $4, $5, $6, COALESCE($7, FALSE))
        `,
        [
          p.player_id,
          match.match_id,
          p.goals,
          p.assists,
          p.saves,
          p.shot_accuracy,
          p.mvp,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(match);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create match error:", err);
    res.status(500).json({ error: "Failed to create match" });
  } finally {
    client.release();
  }
});

router.post("/:id/plays-as", requireAuth, requireAdmin, async (req, res) => {
  const match_id = Number(req.params.id);
  const { team_id, team_type } = req.body || {};

  if (!team_id || !team_type) {
    return res.status(400).json({ error: "team_id and team_type are required" });
  }

  if (!["BLUE", "ORANGE"].includes(team_type)) {
    return res.status(400).json({
      error: "team_type must be 'BLUE' or 'ORANGE'",
    });
  }

  const result = await db.query(
    `
    INSERT INTO PLAYS_AS
      (team_id, match_id, team_type)
    VALUES
      ($1, $2, $3)
    RETURNING *
    `,
    [team_id, match_id, team_type]
  );

  res.status(201).json(result.rows[0]);
});

router.post("/:id/stats", requireAuth, requireAdmin, async (req, res) => {
  const match_id = Number(req.params.id);
  const { player_id, goals, assists, saves, shot_accuracy, mvp } = req.body || {};

  if (
    player_id == null ||
    goals == null ||
    assists == null ||
    saves == null ||
    shot_accuracy == null
  ) {
    return res.status(400).json({
      error: "player_id, goals, assists, saves, shot_accuracy are required",
    });
  }

  const result = await db.query(
    `
    INSERT INTO PLAYER_MATCH_STATS
      (player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
    VALUES
      ($1, $2, $3, $4, $5, $6, COALESCE($7, FALSE))
    RETURNING *
    `,
    [player_id, match_id, goals, assists, saves, shot_accuracy, mvp]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;
