const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/fav-players", async (req, res) => {
  const { rows } = await db.query(
    `SELECT P.*
     FROM FAV_PLAYER FP
     JOIN PLAYER P ON P.player_id = FP.player_id
     WHERE FP.user_id = $1
     ORDER BY P.player_name`,
    [req.user.user_id]
  );
  res.json(rows);
});

router.post("/fav-players", async (req, res) => {
  const { player_id } = req.body || {};
  if (!player_id) {
    return res.status(400).json({ error: "player_id is required" });
  }
  const result = await db.query(
    `INSERT INTO FAV_PLAYER (user_id, player_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [req.user.user_id, player_id]
  );
  if (result.rowCount === 0) {
    return res.status(409).json({ error: "Player already favorited" });
  }
  res.status(201).json(result.rows[0]);
});

router.delete("/fav-players/:player_id", async (req, res) => {
  const player_id = Number(req.params.player_id);
  const result = await db.query(
    "DELETE FROM FAV_PLAYER WHERE user_id = $1 AND player_id = $2",
    [req.user.user_id, player_id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  res.status(204).end();
});

router.get("/fav-teams", async (req, res) => {
  const { rows } = await db.query(
    `SELECT T.*
     FROM FAV_TEAM FT
     JOIN TEAM T ON T.team_id = FT.team_id
     WHERE FT.user_id = $1
     ORDER BY T.team_name`,
    [req.user.user_id]
  );
  res.json(rows);
});

router.post("/fav-teams", async (req, res) => {
  const { team_id } = req.body || {};
  if (!team_id) {
    return res.status(400).json({ error: "team_id is required" });
  }
  const result = await db.query(
    `INSERT INTO FAV_TEAM (user_id, team_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [req.user.user_id, team_id]
  );
  if (result.rowCount === 0) {
    return res.status(409).json({ error: "Team already favorited" });
  }
  res.status(201).json(result.rows[0]);
});

router.delete("/fav-teams/:team_id", async (req, res) => {
  const team_id = Number(req.params.team_id);
  const result = await db.query(
    "DELETE FROM FAV_TEAM WHERE user_id = $1 AND team_id = $2",
    [req.user.user_id, team_id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  res.status(204).end();
});

module.exports = router;
