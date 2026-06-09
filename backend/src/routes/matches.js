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

// Must come before the /:id route so Express does not capture "scores" as an id.
router.get("/scores", async (req, res) => {
  const { rows } = await db.query(queries.get("match-scores"));
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const matchQ = await db.query(
    `SELECT M.*, T.tournament_name, A.arena_name
     FROM MATCH_DATA M
     JOIN TOURNAMENT T ON T.tournament_id = M.tournament_id
     JOIN ARENA A ON A.arena_id = M.arena_id
     WHERE M.match_id = $1`,
    [id]
  );
  if (matchQ.rowCount === 0) {
    return res.status(404).json({ error: "Match not found" });
  }
  const teams = await db.query(
    `SELECT PA.team_type, T.team_id, T.team_name
     FROM PLAYS_AS PA
     JOIN TEAM T ON T.team_id = PA.team_id
     WHERE PA.match_id = $1`,
    [id]
  );
  const playerStats = await db.query(
    `SELECT PMS.*, P.player_name
     FROM PLAYER_MATCH_STATS PMS
     JOIN PLAYER P ON P.player_id = PMS.player_id
     WHERE PMS.match_id = $1
     ORDER BY PMS.goals DESC, PMS.assists DESC`,
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
    `INSERT INTO MATCH_DATA (match_id, match_date, tournament_stage, weather, tournament_id, arena_id)
     VALUES ((SELECT COALESCE(MAX(match_id), 0) + 1 FROM MATCH_DATA), $1, $2, $3, $4, $5)
     RETURNING *`,
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
    return res.status(400).json({ error: "team_type must be 'BLUE' or 'ORANGE'" });
  }
  const result = await db.query(
    `INSERT INTO PLAYS_AS (team_id, match_id, team_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
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
    `INSERT INTO PLAYER_MATCH_STATS (player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, FALSE))
     RETURNING *`,
    [player_id, match_id, goals, assists, saves, shot_accuracy, mvp]
  );
  res.status(201).json(result.rows[0]);
});

// PLAYER_MATCH_STATS and PLAYS_AS only make sense in the context of a match,
// so cascade them inside a single transaction. PLAYER_MATCH_STATS goes first
// because PLAYS_AS does not reference it.
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM PLAYER_MATCH_STATS WHERE match_id = $1",
      [id]
    );
    await client.query("DELETE FROM PLAYS_AS WHERE match_id = $1", [id]);
    const result = await client.query(
      "DELETE FROM MATCH_DATA WHERE match_id = $1",
      [id]
    );
    await client.query("COMMIT");
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.delete(
  "/:match_id/plays-as/:team_id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const match_id = Number(req.params.match_id);
    const team_id = Number(req.params.team_id);
    const result = await db.query(
      "DELETE FROM PLAYS_AS WHERE match_id = $1 AND team_id = $2",
      [match_id, team_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Team assignment not found" });
    }
    res.status(204).end();
  }
);

router.delete(
  "/:match_id/stats/:player_id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const match_id = Number(req.params.match_id);
    const player_id = Number(req.params.player_id);
    const result = await db.query(
      "DELETE FROM PLAYER_MATCH_STATS WHERE match_id = $1 AND player_id = $2",
      [match_id, player_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Stat row not found" });
    }
    res.status(204).end();
  }
);

module.exports = router;
