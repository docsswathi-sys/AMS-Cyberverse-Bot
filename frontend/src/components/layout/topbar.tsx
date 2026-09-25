import { useEffect, useState } from "react";
import {
  Bell,
  CircleUserRound,
  LogIn,
  LogOut,
  Wifi,
} from "lucide-react";

import { api } from "../../services/api";
import type { UserProfile } from "../../types/api";

const DISCORD_LOGIN_URL =
  "https://ams-cyberverse-backend.vercel.app/auth/discord/login";

export default function TopBar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticatedUser = await api.authMe();
        setUser(authenticatedUser);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

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

        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="flex items-center gap-3 border-l border-white/10 pl-3">
          {checkingAuth ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full border border-white/10 bg-white/5" />

              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-400">
                  Checking session...
                </p>

                <p className="text-[10px] text-slate-600">
                  Authenticating
                </p>
              </div>
            </div>
          ) : user ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                <CircleUserRound className="h-4 w-4 text-cyan-300" />
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-200">
                  {user.display_name || user.username}
                </p>

                <p className="text-[10px] text-emerald-400">
                  Authenticated
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <a
              href={DISCORD_LOGIN_URL}
              className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/15 hover:text-cyan-200"
            >
              <LogIn className="h-4 w-4" />

              <span>Login with Discord</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}