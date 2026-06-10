const express = require("express");
const db = require("../db");
const queries = require("../queries");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
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
    SELECT M.*, T.tournament_name, A.arena_name
    FROM MATCH_DATA M
    JOIN TOURNAMENT T ON T.tournament_id = M.tournament_id
    JOIN ARENA A ON A.arena_id = M.arena_id
    ${where}
    ORDER BY M.match_date DESC, M.match_id DESC
  `;

  const { rows } = await db.query(sql, params);
  res.json(rows);
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
    SELECT M.*, T.tournament_name, A.arena_name
    FROM MATCH_DATA M
    JOIN TOURNAMENT T ON T.tournament_id = M.tournament_id
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

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { match_date, tournament_stage, weather, tournament_id, arena_id } =
    req.body || {};

  if (!match_date || !tournament_stage || !weather || !tournament_id || !arena_id) {
    return res.status(400).json({
      error:
        "match_date, tournament_stage, weather, tournament_id, arena_id are required",
    });
  }

  const result = await db.query(
    `
    INSERT INTO MATCH_DATA
      (match_date, tournament_stage, weather, tournament_id, arena_id)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [match_date, tournament_stage, weather, tournament_id, arena_id]
  );

  res.status(201).json(result.rows[0]);
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
