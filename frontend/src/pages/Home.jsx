import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import {
  Trophy,
  TrendingUp,
  Heart,
  Crown,
  Swords,
  ChevronRight,
} from "lucide-react";

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl bg-rlpurple/10 border border-rlpurple/30 flex items-center justify-center">
        <Icon size={18} className="text-rlpurple" />
      </div>
      <div>
        <h2 className="text-lg font-black uppercase tracking-tighter">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={
        "bg-rldark border border-rlborder rounded-2xl p-6 transition-all hover:border-rlpurple/40 " +
        className
      }
    >
      {children}
    </section>
  );
}

function Table({ columns, rows, empty = "No data yet." }) {
  if (!rows.length) {
    return (
      <p className="text-gray-500 text-sm py-4 text-center">{empty}</p>
    );
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-rlborder">
            {columns.map((c) => (
              <th
                key={c}
                className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-gray-500"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-rlborder/40 last:border-0 hover:bg-rlsurface/50 transition-colors"
            >
              {row.map((v, j) => (
                <td key={j} className="py-3 px-2 font-medium">
                  {v ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState({
    topScorers: [],
    topTeams: [],
    favTeams: [],
    topTournament: [],
    scores: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api("/api/stats/top-scorers"),
      api("/api/stats/top-teams-by-matches"),
      api("/api/stats/fav-teams-leaderboard"),
      api("/api/stats/top-tournament"),
      api("/api/matches/scores"),
    ])
      .then(([topScorers, topTeams, favTeams, topTournament, scores]) => {
        setData({ topScorers, topTeams, favTeams, topTournament, scores });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-rl-gradient border border-rlborder mb-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url(/Rocket-league-photo.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 60%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 60%, black 100%)",
          }}
        />
        <div className="relative px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-4">
              Rocket League Esports · Live stats
            </p>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tighter uppercase mb-6">
              Where the <span className="text-rlpurple">numbers</span>
              <br />
              tell the story.
            </h1>
            <p className="text-gray-400 mb-8 max-w-lg">
              Live tournament leaderboards, player and team profiles, match
              results filterable by arena or stage — all backed by the five
              advanced SQL queries from the project report.
            </p>
            <div className="flex gap-3">
              <Link
                to="/matches"
                className="text-[11px] font-black uppercase tracking-widest bg-rlpurple hover:bg-purple-500 px-5 py-3 rounded-xl purple-glow inline-flex items-center gap-2"
              >
                Browse matches <ChevronRight size={14} />
              </Link>
              <Link
                to="/players"
                className="text-[11px] font-black uppercase tracking-widest border border-rlborder hover:border-rlpurple px-5 py-3 rounded-xl"
              >
                Players
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <Card>
            <SectionTitle
              icon={Trophy}
              title="Top Scorers"
              subtitle="Query 1 · Goals leaders with ≥60% accuracy"
            />
            <Table
              columns={["#", "Player", "Goals", "Assists", "Accuracy", "Saves"]}
              rows={data.topScorers.map((r, i) => [
                <span className="text-rlpurple font-black">{i + 1}</span>,
                <span className="font-bold">{r.player_name}</span>,
                r.goal_total,
                r.assist_total,
                `${r.average_shot_accuracy}%`,
                r.saves_total,
              ])}
            />
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <SectionTitle
                icon={TrendingUp}
                title="Most Active Teams"
                subtitle="Query 2 · Top 5 by matches played"
              />
              <Table
                columns={["#", "Team", "Matches"]}
                rows={data.topTeams.map((r, i) => [
                  <span className="text-rlpurple font-black">{i + 1}</span>,
                  <span className="font-bold">{r.team_name}</span>,
                  r.played_total,
                ])}
              />
            </Card>

            <Card>
              <SectionTitle
                icon={Heart}
                title="Fan Favorites"
                subtitle="Query 3 · Top 3 favorited teams by goals"
              />
              <Table
                columns={["#", "Team", "Goals", "Accuracy"]}
                rows={data.favTeams.map((r, i) => [
                  <span className="text-pink-400 font-black">{i + 1}</span>,
                  <span className="font-bold">{r.team_name}</span>,
                  r.team_total_goal,
                  `${r.team_average_shot_accuracy}%`,
                ])}
                empty="No favorited teams yet — star a team to populate this."
              />
            </Card>
          </div>

          <Card>
            <SectionTitle
              icon={Crown}
              title="Tournament Of Goals"
              subtitle="Query 4 · The single highest-scoring tournament"
            />
            <Table
              columns={["Tournament", "Goals", "Assists", "Saves"]}
              rows={data.topTournament.map((r) => [
                <span className="font-bold">{r.tournament_name}</span>,
                r.tournament_total_goal,
                r.tournament_total_assist,
                r.tournament_total_save,
              ])}
            />
          </Card>

          <Card>
            <SectionTitle
              icon={Swords}
              title="All Match Final Scores"
              subtitle="Query 5 · Time-windowed by PLAYS_FOR contracts"
            />
            <Table
              columns={["Match", "Date", "Blue", "", "Orange", ""]}
              rows={data.scores.map((r) => [
                <Link
                  to={`/matches/${r.match_id}`}
                  className="text-rlpurple hover:underline font-mono"
                >
                  #{r.match_id}
                </Link>,
                <span className="text-gray-400 font-mono text-xs">
                  {r.match_date}
                </span>,
                <span className="text-blue-300 font-bold">{r.blue_team}</span>,
                <span className="font-black text-lg">{r.blue_score}</span>,
                <span className="text-orange-300 font-bold">
                  {r.orange_team}
                </span>,
                <span className="font-black text-lg">{r.orange_score}</span>,
              ])}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
