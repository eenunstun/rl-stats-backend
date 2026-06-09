import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { Star, ArrowLeft } from "lucide-react";

function StatBox({ label, value }) {
  return (
    <div className="bg-rlsurface border border-rlborder rounded-2xl p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </div>
      <div className="text-3xl font-black tracking-tighter">{value}</div>
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setPlayer(await api(`/api/players/${id}`));
    } catch (err) {
      setError(err.message);
    }
    if (user) {
      try {
        const favs = await api("/api/users/me/fav-players");
        setIsFav(favs.some((f) => f.player_id === Number(id)));
      } catch {}
    } else {
      setIsFav(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.user_id]);

  async function toggleFav() {
    try {
      if (isFav) {
        await api(`/api/users/me/fav-players/${id}`, { method: "DELETE" });
      } else {
        await api("/api/users/me/fav-players", {
          method: "POST",
          body: JSON.stringify({ player_id: Number(id) }),
        });
      }
      setIsFav(!isFav);
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!player)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const cs = player.career_stats || {};
  return (
    <div className="animate-fade-up space-y-8">
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
      >
        <ArrowLeft size={12} /> Players
      </Link>

      <div className="bg-rl-gradient border border-rlborder rounded-3xl p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-2">
            Player profile · #{player.player_id}
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">
            {player.player_name}
          </h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mt-3">
            Platform · {player.platform}
          </p>
        </div>
        {user && (
          <button
            onClick={toggleFav}
            className={
              "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all " +
              (isFav
                ? "bg-pink-500/20 border border-pink-500/50 text-pink-300 hover:bg-pink-500/30"
                : "bg-rlsurface border border-rlborder hover:border-rlpurple text-gray-300")
            }
          >
            <Star
              size={14}
              fill={isFav ? "currentColor" : "none"}
              className={isFav ? "text-pink-400" : ""}
            />
            {isFav ? "Favorited" : "Favorite"}
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-3">
          Career stats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatBox label="Matches" value={cs.matches_played ?? 0} />
          <StatBox label="Goals" value={cs.total_goals ?? 0} />
          <StatBox label="Assists" value={cs.total_assists ?? 0} />
          <StatBox label="Saves" value={cs.total_saves ?? 0} />
          <StatBox
            label="Accuracy"
            value={
              cs.avg_shot_accuracy != null
                ? `${cs.avg_shot_accuracy}%`
                : "—"
            }
          />
          <StatBox label="MVPs" value={cs.mvp_count ?? 0} />
        </div>
      </div>

      <div className="bg-rldark border border-rlborder rounded-2xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
          Team history
        </p>
        {player.teams?.length ? (
          <ul className="space-y-3">
            {player.teams.map((t) => (
              <li
                key={`${t.team_id}-${t.since}`}
                className="flex justify-between items-center border-b border-rlborder/50 pb-3 last:border-0 last:pb-0"
              >
                <Link
                  to={`/teams/${t.team_id}`}
                  className="group flex items-center gap-3"
                >
                  <span className="font-black text-lg group-hover:text-rlpurple transition-colors">
                    {t.team_name}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {t.region}
                  </span>
                </Link>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">
                  {t.since} → {t.until || "now"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No team history.</p>
        )}
      </div>
    </div>
  );
}
