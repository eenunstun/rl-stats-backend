require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const playerRoutes = require("./routes/players");
const teamRoutes = require("./routes/teams");
const tournamentRoutes = require("./routes/tournaments");
const arenaRoutes = require("./routes/arenas");
const matchRoutes = require("./routes/matches");
const favoritesRoutes = require("./routes/favorites");
const statsRoutes = require("./routes/stats");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "RL Stats backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/arenas", arenaRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/users/me", favoritesRoutes);
app.use("/api/stats", statsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
