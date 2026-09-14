import { Bell, CircleUserRound, Wifi } from "lucide-react";

export default function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#070b14]/80 px-5 backdrop-blur-xl lg:px-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Cyber Operations
        </p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-100">
          AMS Cyberverse
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">
            System Online
          </span>
        </div>

        <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-100">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="flex items-center gap-2 border-l border-white/10 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
            <CircleUserRound className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-200">
              Operator
            </p>
            <p className="text-[10px] text-slate-500">
              Unauthenticated
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}