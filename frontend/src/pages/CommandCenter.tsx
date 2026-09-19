import { useEffect, useState } from "react";
import {
  Activity,
  Flag,
  Trophy,
  Target,
  ShieldCheck,
  Users,
} from "lucide-react";

import { api } from "../services/api";
import type {
  Challenge,
  Event,
  LeaderboardEntry,
  UserProfile,
} from "../types/api";

export default function CommandCenter() {
  const [event, setEvent] = useState<Event | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCommandCenter() {
      try {
        setLoading(true);
        setError("");

        const discordId = String(
          import.meta.env.VITE_DEV_DISCORD_ID ?? ""
        ).trim();

        const [activeEvent, challengeData, leaderboardData] =
          await Promise.all([
            api.activeEvent(),
            api.challenges(),
            api.leaderboard(5),
          ]);

        setEvent(activeEvent);
        setChallenges(challengeData.challenges);
        setLeaderboard(leaderboardData.leaderboard);

        if (discordId) {
          try {
            const user = await api.profile(discordId);
            setProfile(user);
          } catch {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error(err);
        setError(
          "Unable to connect to the AMS Cyberverse backend."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCommandCenter();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-300">
          <Activity className="h-5 w-5 animate-pulse" />
          <span className="text-sm tracking-wide">
            Initializing command center...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-16">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-red-300" />
            <h1 className="text-lg font-semibold text-white">
              Backend connection failed
            </h1>
          </div>

          <p className="text-sm text-slate-400">{error}</p>

          <p className="mt-4 text-xs text-slate-500">
            Verify that the FastAPI server is running on port 8000.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Operations Interface
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Command Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor active operations, CTF activity, operator
              progress, and competitive intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              Platform Online
            </span>
          </div>
        </div>
      </section>

      {/* Active Operation */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-[#09111f] to-[#070b14] p-6 shadow-2xl shadow-cyan-950/20">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <Target className="h-4 w-4" />
            Active Operation
          </div>

          <h2 className="mt-4 text-2xl font-semibold text-white">
            {event?.name || "No active operation"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {event?.description ||
              "There is currently no active CTF operation."}
          </p>

          {event && (
            <div className="mt-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">
              ● {event.status.toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          icon={<Flag />}
          label="Challenges"
          value={challenges.length}
        />

        <StatCard
          icon={<Trophy />}
          label="Your Points"
          value={profile?.points ?? "—"}
        />

        <StatCard
          icon={<Target />}
          label="Challenges Solved"
          value={profile?.challenges_solved ?? "—"}
        />

        <StatCard
          icon={<Users />}
          label="Leaderboard"
          value={leaderboard.length}
        />

      </section>

      {/* Lower Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">

        {/* Challenges */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                CTF Arena
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Active Challenges
              </h2>
            </div>

            <span className="text-xs text-slate-500">
              {challenges.length} available
            </span>
          </div>

          <div className="space-y-3">
            {challenges.slice(0, 5).map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {challenge.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {challenge.category} ·{" "}
                    {challenge.difficulty}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan-300">
                    {challenge.points}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    points
                  </p>
                </div>
              </div>
            ))}

            {challenges.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No active challenges available.
              </p>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Competitive Intel
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Top Operators
            </h2>
          </div>

          <div className="space-y-3">
            {leaderboard.map((operator) => (
              <div
                key={operator.discord_id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-semibold text-slate-500">
                    #{operator.position}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {operator.display_name}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Level {operator.level} · {operator.rank}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold text-cyan-300">
                  {operator.points}
                </span>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No leaderboard data available.
              </p>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-cyan-400/20">
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{icon}</span>

        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
      </div>

      <p className="mt-5 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
    </div>
  );
}