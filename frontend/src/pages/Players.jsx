import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Search } from "lucide-react";

const platformColor = {
  PC: "from-blue-500 to-blue-700",
  PS: "from-indigo-500 to-indigo-700",
  XBOX: "from-emerald-500 to-emerald-700",
};

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/players")
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? players.filter((p) =>
        p.player_name.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-1">
            Roster
          </p>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Players
          </h1>
        </div>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rl-input pl-10 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.player_id}
              to={`/players/${p.player_id}`}
              className="group relative bg-rldark border border-rlborder rounded-2xl p-5 hover:border-rlpurple/60 hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div
                className={
                  "absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 group-hover:opacity-40 transition-opacity " +
                  (platformColor[p.platform] ||
                    "from-purple-500 to-purple-700")
                }
              />
              <div className="relative">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  #{p.player_id}
                </div>
                <div className="font-black text-lg tracking-tight mb-1">
                  {p.player_name}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-rlpurple">
                  {p.platform}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
