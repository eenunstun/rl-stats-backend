import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const regionAccent = {
  Europe: "border-l-blue-500",
  "North America": "border-l-red-500",
  "South America": "border-l-yellow-500",
  Australia: "border-l-green-500",
  Asia: "border-l-pink-500",
};

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/teams")
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-1">
          Squadrons
        </p>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Teams
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <Link
              key={t.team_id}
              to={`/teams/${t.team_id}`}
              className={
                "bg-rldark border border-rlborder border-l-4 rounded-2xl p-6 hover:border-rlpurple hover:-translate-y-0.5 transition-all " +
                (regionAccent[t.region] || "border-l-purple-500")
              }
            >
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                #{t.team_id}
              </div>
              <div className="font-black text-2xl tracking-tighter uppercase mb-2">
                {t.team_name}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t.region}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
