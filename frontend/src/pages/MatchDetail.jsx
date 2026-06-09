import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { ArrowLeft } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/api/matches/${id}`)
      .then(setMatch)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!match)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const blue = match.teams?.find((t) => t.team_type === "BLUE");
  const orange = match.teams?.find((t) => t.team_type === "ORANGE");

  // Compute team scores from player stats so we can show a scoreline.
  const scoreFor = (teamId) =>
    (match.player_stats || [])
      .filter((s) => s.team_id === teamId) // (may not always be set; fall back to 0)
      .reduce((sum, s) => sum + (s.goals || 0), 0);

  return (
    <div className="animate-fade-up space-y-8">
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
      >
        <ArrowLeft size={12} /> Matches
      </Link>

      <div className="bg-rl-gradient border border-rlborder rounded-3xl p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-2">
          Match · #{match.match_id}
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-3">
          {match.tournament_name}
        </h1>
        <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">
          <span>{match.match_date}</span>
          <span>{match.tournament_stage}</span>
          <span>{match.arena_name}</span>
          <span>{match.weather}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[blue, orange].filter(Boolean).map((t) => (
          <Link
            key={t.team_type}
            to={`/teams/${t.team_id}`}
            className={
              "relative overflow-hidden rounded-2xl p-6 border transition-all hover:-translate-y-0.5 " +
              (t.team_type === "BLUE"
                ? "bg-gradient-to-br from-blue-900/40 to-blue-950/80 border-blue-700/50 hover:border-blue-500"
                : "bg-gradient-to-br from-orange-900/40 to-orange-950/80 border-orange-700/50 hover:border-orange-500")
            }
          >
            <div
              className={
                "absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl " +
                (t.team_type === "BLUE"
                  ? "bg-blue-500/30 text-blue-200"
                  : "bg-orange-500/30 text-orange-200")
              }
            >
              {t.team_type}
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-tighter uppercase mt-2">
              {t.team_name}
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-rldark border border-rlborder rounded-2xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
          Player stats
        </p>
        {match.player_stats?.length ? (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-rlborder">
                  {["Player", "Goals", "Assists", "Saves", "Accuracy", "MVP"].map(
                    (c) => (
                      <th
                        key={c}
                        className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-gray-500"
                      >
                        {c}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {match.player_stats.map((s) => (
                  <tr
                    key={s.player_id}
                    className="border-b border-rlborder/40 last:border-0 hover:bg-rlsurface/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <Link
                        to={`/players/${s.player_id}`}
                        className="font-bold hover:text-rlpurple"
                      >
                        {s.player_name}
                      </Link>
                    </td>
                    <td className="py-3 px-2 font-mono">{s.goals}</td>
                    <td className="py-3 px-2 font-mono">{s.assists}</td>
                    <td className="py-3 px-2 font-mono">{s.saves}</td>
                    <td className="py-3 px-2 font-mono">{s.shot_accuracy}%</td>
                    <td className="py-3 px-2">
                      {s.mvp ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md">
                          ★ MVP
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No stats recorded.</p>
        )}
      </div>
    </div>
  );
}
