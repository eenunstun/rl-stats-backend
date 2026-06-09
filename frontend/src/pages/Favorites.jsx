import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Heart, X } from "lucide-react";

export default function Favorites() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, t] = await Promise.all([
      api("/api/users/me/fav-players"),
      api("/api/users/me/fav-teams"),
    ]);
    setPlayers(p);
    setTeams(t);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function removePlayer(id) {
    await api(`/api/users/me/fav-players/${id}`, { method: "DELETE" });
    load();
  }
  async function removeTeam(id) {
    await api(`/api/users/me/fav-teams/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={20} className="text-pink-400" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 mb-1">
            Your picks
          </p>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Favorites
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-rldark border border-rlborder rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
              Players ({players.length})
            </p>
            {players.length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center">
                No favorite players yet. Tap the ☆ on a player page.
              </p>
            ) : (
              <ul className="space-y-2">
                {players.map((p) => (
                  <li
                    key={p.player_id}
                    className="flex items-center justify-between bg-rlsurface border border-rlborder rounded-xl px-4 py-3"
                  >
                    <Link
                      to={`/players/${p.player_id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="font-black tracking-tight">
                        {p.player_name}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {p.platform}
                      </span>
                    </Link>
                    <button
                      onClick={() => removePlayer(p.player_id)}
                      className="text-gray-500 hover:text-red-400"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-rldark border border-rlborder rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
              Teams ({teams.length})
            </p>
            {teams.length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center">
                No favorite teams yet. Tap the ☆ on a team page.
              </p>
            ) : (
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li
                    key={t.team_id}
                    className="flex items-center justify-between bg-rlsurface border border-rlborder rounded-xl px-4 py-3"
                  >
                    <Link
                      to={`/teams/${t.team_id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="font-black tracking-tight">
                        {t.team_name}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {t.region}
                      </span>
                    </Link>
                    <button
                      onClick={() => removeTeam(t.team_id)}
                      className="text-gray-500 hover:text-red-400"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
