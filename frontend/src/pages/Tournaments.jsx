import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Calendar, MapPin } from "lucide-react";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/tournaments")
      .then(setTournaments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-1">
          Competitions
        </p>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Tournaments
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link
              key={t.tournament_id}
              to={`/tournaments/${t.tournament_id}`}
              className="block bg-rldark border border-rlborder rounded-2xl p-6 hover:border-rlpurple/60 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    #{t.tournament_id}
                  </div>
                  <div className="font-black text-xl tracking-tight">
                    {t.tournament_name}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={12} className="text-rlpurple" />
                    {t.country}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={12} className="text-rlpurple" />
                    {t.start_date} → {t.end_date}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
