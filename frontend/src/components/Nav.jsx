import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { LogOut, Shield } from "lucide-react";

function navLinkClass({ isActive }) {
  return (
    "text-[10px] font-black uppercase tracking-widest transition-colors " +
    (isActive ? "text-white" : "text-gray-500 hover:text-white")
  );
}

export default function Nav() {
  const { user, logout } = useAuth();
  const initial = (user?.username || "?").slice(0, 1).toUpperCase();
  return (
    <nav className="glass sticky top-0 z-50 border-b border-rlborder">
      <div className="relative max-w-7xl mx-auto h-20 px-8 flex items-center">
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/players" className={navLinkClass}>
            Players
          </NavLink>
          <NavLink to="/teams" className={navLinkClass}>
            Teams
          </NavLink>
          <NavLink to="/tournaments" className={navLinkClass}>
            Tournaments
          </NavLink>
          <NavLink to="/matches" className={navLinkClass}>
            Matches
          </NavLink>
          {user && (
            <NavLink to="/favorites" className={navLinkClass}>
              Favorites
            </NavLink>
          )}
          {user?.is_admin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 select-none group cursor-pointer"
        >
          <div className="text-3xl font-black tracking-tighter uppercase transition-all duration-500 group-hover:tracking-normal">
            RL<span className="text-rlpurple">stats</span>
          </div>
        </Link>

        <div className="ml-auto">
          {user ? (
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-3 py-1.5 shadow-2xl backdrop-blur-md transition-all duration-500 hover:border-rlpurple">
              <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                <div className="w-8 h-8 rounded-xl bg-rlpurple flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-purple-500/20">
                  {initial}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-white">
                    {user.username}
                  </span>
                  {user.is_admin && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-rlpurple flex items-center gap-1">
                      <Shield size={9} /> admin
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="group flex items-center gap-2 hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition-all duration-300 active:scale-95"
                title="Log out"
              >
                <LogOut
                  size={14}
                  className="text-gray-400 group-hover:text-red-400"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-400">
                  Logout
                </span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-[10px] font-black uppercase tracking-widest text-white bg-rlpurple hover:bg-purple-500 px-4 py-2 rounded-xl purple-glow"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
