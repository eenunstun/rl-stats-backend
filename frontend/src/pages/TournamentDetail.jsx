import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

export default function TournamentDetail() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/api/tournaments/${id}`)
      .then(setTournament)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!tournament)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-rlpurple border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="animate-fade-up space-y-8">
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
      >
        <ArrowLeft size={12} /> Tournaments
      </Link>

      <div
        className="relative bg-rl-gradient border border-rlborder rounded-3xl p-8 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(26,27,30,0.95) 0%, rgba(18,18,20,0.95) 100%), url(/rocket-league-pysonix-tournament-image.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-2">
          Tournament · #{tournament.tournament_id}
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
          {tournament.tournament_name}
        </h1>
        <div className="flex flex-wrap gap-6 text-[11px] font-black uppercase tracking-widest text-gray-300">
          <span className="inline-flex items-center gap-2">
            <MapPin size={12} className="text-rlpurple" />
            {tournament.country}
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar size={12} className="text-rlpurple" />
            {tournament.start_date} → {tournament.end_date}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
          Matches ({tournament.matches?.length || 0})
        </p>
        {tournament.matches?.length ? (
          <div className="space-y-2">
            {tournament.matches.map((m) => (
              <Link
                key={m.match_id}
                to={`/matches/${m.match_id}`}
                className="block bg-rldark border border-rlborder rounded-2xl px-5 py-4 hover:border-rlpurple/60 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-rlpurple font-black font-mono">
                      #{m.match_id}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      {m.tournament_stage}
                    </span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-mono">
                    {m.match_date} @ {m.arena_name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No matches yet.</p>
        )}
      </div>
    </div>
  );
}
