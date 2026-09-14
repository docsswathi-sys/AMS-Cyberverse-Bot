import {
  Activity,
  Flag,
  CalendarDays,
  Trophy,
  User,
  Shield,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Command Center",
    icon: Activity,
    path: "/",
  },
  {
    label: "CTF Arena",
    icon: Flag,
    path: "/ctf",
  },
  {
    label: "Events",
    icon: CalendarDays,
    path: "/events",
  },
  {
    label: "Leaderboard",
    icon: Trophy,
    path: "/leaderboard",
  },
  {
    label: "Profile",
    icon: User,
    path: "/profile",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-[#070b14]/95 px-4 py-5">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
          <Shield className="h-5 w-5 text-cyan-300" />
        </div>

        <div>
          <h1 className="text-sm font-bold tracking-[0.18em] text-white">
            AMS
          </h1>

          <p className="text-xs tracking-[0.12em] text-cyan-300">
            CYBERVERSE
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-cyan-400/15 bg-cyan-400/10 text-cyan-300"
                    : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />

              <span className="text-sm font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* System status */}
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-xs font-medium text-slate-300">
            System Online
          </span>
        </div>

        <p className="text-[11px] leading-4 text-slate-500">
          AMS Cyberverse operations interface
        </p>
      </div>
    </aside>
  );
}