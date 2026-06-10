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
      SELECT
        T.team_id,
        T.team_name,
        T.region,

        COUNT(DISTINCT PA.match_id)::int AS matches_played,

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

      GROUP BY
        T.team_id,
        T.team_name,
        T.region

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

    const result = await db.query(
      `INSERT INTO TEAM (team_name, region)
       VALUES ($1, $2)
       RETURNING *`,
      [team_name.trim(), region.trim()]
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
  try {
    const teamId = Number(req.params.id);

    await db.query(
      `UPDATE PLAYS_FOR
       SET until = CURRENT_DATE
       WHERE team_id = $1
         AND until IS NULL`,
      [teamId]
    );

    const result = await db.query(
      `DELETE FROM TEAM
       WHERE team_id = $1
       RETURNING *`,
      [teamId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({
      message: "Team deleted successfully",
      team: result.rows[0]
    });

  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

module.exports = router;