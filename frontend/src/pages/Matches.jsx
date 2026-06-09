import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Filter, X } from "lucide-react";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [arenas, setArenas] = useState([]);
  const [filters, setFilters] = useState({
    tournament_id: "",
    arena_id: "",
    stage: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/tournaments"), api("/api/arenas")]).then(
      ([t, a]) => {
        setTournaments(t);
        setArenas(a);
      }
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v)
    );
    const qs = new URLSearchParams(params).toString();
    api(`/api/matches${qs ? `?${qs}` : ""}`)
      .then(setMatches)
      .finally(() => setLoading(false));
  }, [filters]);

  const hasFilters = filters.tournament_id || filters.arena_id || filters.stage;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-1">
          History
        </p>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Matches
        </h1>
      </div>

      <div className="bg-rldark border border-rlborder rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-rlpurple" />
          <span className="text-[10px] font-black uppercase tracking-widest text-rlpurple">
            Filters
          </span>
          {hasFilters && (
            <button
              onClick={() =>
                setFilters({ tournament_id: "", arena_id: "", stage: "" })
              }
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
            >
              <X size={10} /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.tournament_id}
            onChange={(e) =>
              setFilters({ ...filters, tournament_id: e.target.value })
            }
            className="rl-input"
          >
            <option value="">All tournaments</option>
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.tournament_name}
              </option>
            ))}
          </select>
          <select
            value={filters.arena_id}
            onChange={(e) =>
              setFilters({ ...filters, arena_id: e.target.value })
            }
            className="rl-input"
          >
            <option value="">All arenas</option>
            {arenas.map((a) => (
              <option key={a.arena_id} value={a.arena_id}>
                {a.arena_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Stage (Final, Semifinal…)"
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            className="rl-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <p className="text-gray-500 text-center py-12 text-sm">
          No matches match those filters.
        </p>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Link
              key={m.match_id}
              to={`/matches/${m.match_id}`}
              className="block bg-rldark border border-rlborder rounded-2xl px-5 py-4 hover:border-rlpurple/60 transition-all"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-rlpurple font-black font-mono text-lg">
                    #{m.match_id}
                  </span>
                  <div>
                    <div className="font-black text-base tracking-tight">
                      {m.tournament_name}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">
                      {m.tournament_stage} · {m.arena_name} · {m.weather}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">
                  {m.match_date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
