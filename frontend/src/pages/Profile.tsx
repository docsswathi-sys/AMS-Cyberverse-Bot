import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type UserProfile = {
  discord_id: string | number;
  username: string;
  display_name: string;
  points: number;
  level: number;
  challenges_solved: number;
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const discordId = String(
    import.meta.env.VITE_DEV_DISCORD_ID ?? "",
  ).trim();

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        if (!discordId) {
          throw new Error("Discord user ID is not configured.");
        }

        const response = await api.profile(discordId);
        setProfile(response);

        setProfile(response);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Unable to load operator profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [discordId]);

  const xpForNextLevel = profile
    ? Math.max(0, 100 * Math.pow(profile.level, 1.55))
    : 0;

  const xpForCurrentLevel = profile
    ? 100 * Math.pow(Math.max(0, profile.level - 1), 1.55)
    : 0;

  const progress =
    profile && xpForNextLevel > xpForCurrentLevel
      ? Math.min(
          100,
          Math.max(
            0,
            ((profile.points - xpForCurrentLevel) /
              (xpForNextLevel - xpForCurrentLevel)) *
              100,
          ),
        )
      : 100;

  return (
    <div className="min-h-full space-y-8">
      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Operator Intelligence
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">
          Profile
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Your AMS Cyberverse operator identity, progression, and CTF
          performance.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-10 text-center">
          <div className="text-sm text-cyan-300">
            Loading operator profile...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="text-sm text-red-300">{error}</div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-red-400/20 px-4 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && profile && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-2xl">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-3xl font-black text-cyan-300">
                  {(profile.display_name || profile.username || "O")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Operator
                  </div>

                  <h2 className="mt-1 text-3xl font-bold text-white">
                    {profile.display_name || profile.username}
                  </h2>

                  <div className="mt-1 text-sm text-slate-500">
                    @{profile.username}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-6 py-4 text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Clearance
                </div>

                <div className="mt-1 text-2xl font-black text-cyan-300">
                  LEVEL {String(profile.level).padStart(2, "0")}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Total Points
              </div>
              <div className="mt-3 text-3xl font-black text-cyan-300">
                {profile.points}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Competitive XP
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Challenges Solved
              </div>
              <div className="mt-3 text-3xl font-black text-white">
                {profile.challenges_solved}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Verified CTF solves
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Rank
              </div>
              <div className="mt-3 text-3xl font-black text-white">
                {profile.level >= 100
                  ? "GODMODE"
                  : profile.level <= 10
                    ? "ROOKIE"
                    : profile.level <= 20
                      ? "RECRUIT"
                      : profile.level <= 30
                        ? "SCOUT"
                        : profile.level <= 40
                          ? "INVESTIGATOR"
                          : profile.level <= 50
                            ? "OPERATIVE"
                            : profile.level <= 60
                              ? "HUNTER"
                              : profile.level <= 70
                                ? "RED TEAM"
                                : profile.level <= 80
                                  ? "ELITE"
                                  : profile.level <= 90
                                    ? "COMMANDER"
                                    : "OVERLORD"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Operator classification
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Progression
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Level {profile.level}
                </div>
              </div>

              <div className="text-sm font-semibold text-cyan-300">
                {Math.round(progress)}%
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-slate-600">
              <span>Current level</span>
              <span>Next level</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Discord Identity
            </div>
            <div className="mt-3 break-all font-mono text-sm text-slate-400">
              {String(profile.discord_id)}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/ctf"
              className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
            >
              Enter CTF Arena →
            </Link>

            <Link
              to="/leaderboard"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
            >
              View Leaderboard →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
