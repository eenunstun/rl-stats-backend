const express = require("express");
const db = require("../db");
const queries = require("../queries");

const router = express.Router();

// The four endpoints below read their SQL from database/advancedqueries.sql
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

router.get("/top-tournament", async (req, res) => {
  const { rows } = await db.query(queries.get("top-tournament"));
  res.json(rows);
});

module.exports = router;
