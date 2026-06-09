import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Trash2, Plus, ShieldAlert } from "lucide-react";

function Form({ fields, onSubmit, submitLabel = "Create" }) {
  const [state, setState] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit(state);
      setState({});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 mb-4">
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <input
            key={f.name}
            type={f.type || "text"}
            placeholder={f.label || f.name}
            value={state[f.name] || ""}
            onChange={(e) =>
              setState({ ...state, [f.name]: e.target.value })
            }
            required={!f.optional}
            className="rl-input text-sm"
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 bg-rlpurple hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest purple-glow disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        <Plus size={12} />
        {busy ? "…" : submitLabel}
      </button>
      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </form>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-rldark border border-rlborder rounded-2xl p-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-rlpurple mb-4">
        {title}
      </p>
      {children}
    </section>
  );
}

function List({ items, renderLabel, onDelete }) {
  if (!items.length) {
    return (
      <p className="text-gray-500 text-xs py-3 text-center">None yet.</p>
    );
  }
  return (
    <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {items.map((it) => (
        <li
          key={it.key}
          className="flex justify-between items-center bg-rlsurface border border-rlborder rounded-xl px-3 py-2"
        >
          <span className="text-sm font-mono text-gray-300 truncate">
            {renderLabel(it)}
          </span>
          <button
            onClick={() => onDelete(it)}
            className="text-gray-500 hover:text-red-400 ml-3 shrink-0"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Admin() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [arenas, setArenas] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  async function reload() {
    try {
      const [p, t, tn, a, m] = await Promise.all([
        api("/api/players"),
        api("/api/teams"),
        api("/api/tournaments"),
        api("/api/arenas"),
        api("/api/matches"),
      ]);
      setPlayers(p);
      setTeams(t);
      setTournaments(tn);
      setArenas(a);
      setMatches(m);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function del(path, label) {
    if (!confirm(`Delete ${label}?`)) return;
    try {
      await api(path, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="bg-rl-gradient border border-rlborder rounded-3xl p-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-rlpurple/20 border border-rlpurple/40 flex items-center justify-center">
          <ShieldAlert size={24} className="text-rlpurple" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rlpurple mb-1">
            Restricted
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
            Admin control
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Create and delete entities. Deletes refuse to drop rows that other
            tables still reference; deleting a match cascades over PLAYS_AS and
            PLAYER_MATCH_STATS.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Players">
          <Form
            fields={[
              { name: "player_name", label: "Player name" },
              { name: "platform", label: "Platform (PC/PS/XBOX)" },
            ]}
            onSubmit={async (s) => {
              await api("/api/players", {
                method: "POST",
                body: JSON.stringify(s),
              });
              reload();
            }}
          />
          <List
            items={players.map((p) => ({ ...p, key: p.player_id }))}
            renderLabel={(p) =>
              `#${p.player_id} · ${p.player_name} (${p.platform})`
            }
            onDelete={(p) =>
              del(`/api/players/${p.player_id}`, `player ${p.player_name}`)
            }
          />
        </Section>

        <Section title="Teams">
          <Form
            fields={[
              { name: "team_name", label: "Team name" },
              { name: "region", label: "Region" },
            ]}
            onSubmit={async (s) => {
              await api("/api/teams", {
                method: "POST",
                body: JSON.stringify(s),
              });
              reload();
            }}
          />
          <List
            items={teams.map((t) => ({ ...t, key: t.team_id }))}
            renderLabel={(t) => `#${t.team_id} · ${t.team_name} (${t.region})`}
            onDelete={(t) =>
              del(`/api/teams/${t.team_id}`, `team ${t.team_name}`)
            }
          />
        </Section>

        <Section title="Tournaments">
          <Form
            fields={[
              { name: "tournament_name", label: "Tournament name" },
              { name: "country", label: "Country" },
              { name: "start_date", type: "date" },
              { name: "end_date", type: "date" },
            ]}
            onSubmit={async (s) => {
              await api("/api/tournaments", {
                method: "POST",
                body: JSON.stringify(s),
              });
              reload();
            }}
          />
          <List
            items={tournaments.map((t) => ({ ...t, key: t.tournament_id }))}
            renderLabel={(t) =>
              `#${t.tournament_id} · ${t.tournament_name} (${t.country})`
            }
            onDelete={(t) =>
              del(
                `/api/tournaments/${t.tournament_id}`,
                `tournament ${t.tournament_name}`
              )
            }
          />
        </Section>

        <Section title="Arenas">
          <Form
            fields={[{ name: "arena_name", label: "Arena name" }]}
            onSubmit={async (s) => {
              await api("/api/arenas", {
                method: "POST",
                body: JSON.stringify(s),
              });
              reload();
            }}
          />
          <List
            items={arenas.map((a) => ({ ...a, key: a.arena_id }))}
            renderLabel={(a) => `#${a.arena_id} · ${a.arena_name}`}
            onDelete={(a) =>
              del(`/api/arenas/${a.arena_id}`, `arena ${a.arena_name}`)
            }
          />
        </Section>
      </div>

      <Section title="Matches">
        <Form
          fields={[
            { name: "match_date", type: "date" },
            { name: "tournament_stage", label: "Stage (e.g. Final)" },
            { name: "weather", label: "Weather" },
            { name: "tournament_id", type: "number", label: "Tournament id" },
            { name: "arena_id", type: "number", label: "Arena id" },
          ]}
          onSubmit={async (s) => {
            await api("/api/matches", {
              method: "POST",
              body: JSON.stringify({
                ...s,
                tournament_id: Number(s.tournament_id),
                arena_id: Number(s.arena_id),
              }),
            });
            reload();
          }}
        />
        <List
          items={matches.map((m) => ({ ...m, key: m.match_id }))}
          renderLabel={(m) =>
            `#${m.match_id} · ${m.match_date} · ${m.tournament_name} @ ${m.arena_name} (${m.tournament_stage})`
          }
          onDelete={(m) =>
            del(`/api/matches/${m.match_id}`, `match #${m.match_id}`)
          }
        />
      </Section>

      <div className="grid md:grid-cols-3 gap-6">
        <Section title="Assign player → team (PLAYS_FOR)">
          <Form
            fields={[
              { name: "player_id", type: "number", label: "Player id" },
              { name: "team_id", type: "number", label: "Team id" },
              { name: "since", type: "date" },
              { name: "until", type: "date", label: "Until (optional)", optional: true },
            ]}
            submitLabel="Assign"
            onSubmit={async (s) => {
              await api(`/api/players/${Number(s.player_id)}/plays-for`, {
                method: "POST",
                body: JSON.stringify({
                  team_id: Number(s.team_id),
                  since: s.since,
                  until: s.until || null,
                }),
              });
            }}
          />
        </Section>

        <Section title="Assign team → match (PLAYS_AS)">
          <Form
            fields={[
              { name: "match_id", type: "number", label: "Match id" },
              { name: "team_id", type: "number", label: "Team id" },
              { name: "team_type", label: "BLUE or ORANGE" },
            ]}
            submitLabel="Assign"
            onSubmit={async (s) => {
              await api(`/api/matches/${Number(s.match_id)}/plays-as`, {
                method: "POST",
                body: JSON.stringify({
                  team_id: Number(s.team_id),
                  team_type: s.team_type,
                }),
              });
            }}
          />
        </Section>

        <Section title="Record stat (PLAYER_MATCH_STATS)">
          <Form
            fields={[
              { name: "match_id", type: "number", label: "Match id" },
              { name: "player_id", type: "number", label: "Player id" },
              { name: "goals", type: "number" },
              { name: "assists", type: "number" },
              { name: "saves", type: "number" },
              { name: "shot_accuracy", type: "number", label: "Accuracy %" },
              { name: "mvp", label: "MVP? (true/false)", optional: true },
            ]}
            submitLabel="Record"
            onSubmit={async (s) => {
              await api(`/api/matches/${Number(s.match_id)}/stats`, {
                method: "POST",
                body: JSON.stringify({
                  player_id: Number(s.player_id),
                  goals: Number(s.goals),
                  assists: Number(s.assists),
                  saves: Number(s.saves),
                  shot_accuracy: Number(s.shot_accuracy),
                  mvp: s.mvp === "true",
                }),
              });
            }}
          />
        </Section>
      </div>
    </div>
  );
}
