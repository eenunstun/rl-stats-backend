import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="text-4xl font-black tracking-tighter uppercase">
            RL<span className="text-rlpurple">stats</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </p>
        </div>

        <div className="bg-rldark border border-rlborder rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 gap-1 bg-rlsurface p-1 rounded-xl mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={
                  "py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all " +
                  (mode === m
                    ? "bg-rlpurple text-white shadow-purple"
                    : "text-gray-500 hover:text-white")
                }
              >
                {m === "login" ? "Log in" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" key={mode}>
            <div className="relative animate-tab-slide">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={20}
                className="rl-input pl-11"
              />
            </div>
            <div className="relative animate-tab-slide">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={50}
                className="rl-input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-rlpurple hover:bg-purple-500 rounded-xl text-[11px] font-black uppercase tracking-widest purple-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-6 text-center">
          Seed user · Evrim / SoccerCar@2358 (admin)
        </p>
      </div>
    </div>
  );
}
