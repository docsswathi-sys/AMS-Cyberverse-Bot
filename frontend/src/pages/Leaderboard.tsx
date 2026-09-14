import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type LeaderboardEntry = {
  discord_id: string | number;
  username: string;
  display_name: string;
  points: number;
  level: number;
  challenges_solved: number;
};

export default function Leaderboard() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.leaderboard(100);

        setPlayers(response.leaderboard ?? []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError("Unable to load leaderboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-full space-y-8">
      {/* Header */}
      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Competitive Intelligence
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Leaderboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Track operator performance, earned points, and CTF progression
              across AMS Cyberverse.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Operators
            </div>
            <div className="mt-1 text-xl font-semibold text-cyan-300">
              {players.length}
            </div>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10 text-center">
          <div className="text-sm text-cyan-300">
            Loading operator rankings...
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Empty */}
      {!loading && !error && players.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10 text-center">
          <div className="text-lg font-semibold text-white">
            No operators ranked yet
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Complete CTF challenges to appear on the leaderboard.
          </p>
        </div>
      )}

      {/* Leaderboard */}
      {!loading && !error && players.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl">
          {/* Table header */}
          <div className="grid grid-cols-[70px_1fr_110px_90px_110px] gap-4 border-b border-white/10 bg-white/[0.02] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <div>Rank</div>
            <div>Operator</div>
            <div>Points</div>
            <div>Level</div>
            <div>Solved</div>
          </div>

          <div>
            {players.map((player, index) => {
              const rank = index + 1;

              return (
                <div
                  key={String(player.discord_id)}
                  className="grid grid-cols-[70px_1fr_110px_90px_110px] items-center gap-4 border-b border-white/[0.06] px-6 py-5 transition hover:bg-cyan-400/[0.03]"
                >
                  {/* Rank */}
                  <div>
                    <span
                      className={
                        rank === 1
                          ? "text-2xl font-black text-yellow-300"
                          : rank === 2
                            ? "text-2xl font-black text-slate-300"
                            : rank === 3
                              ? "text-2xl font-black text-orange-300"
                              : "text-lg font-semibold text-slate-500"
                      }
                    >
                      #{rank}
                    </span>
                  </div>

                  {/* Operator */}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">
                      {player.display_name || player.username}
                    </div>

                    <div className="mt-1 truncate text-xs text-slate-500">
                      @{player.username}
                    </div>
                  </div>

                  {/* Points */}
                  <div>
                    <div className="font-bold text-cyan-300">
                      {player.points}
                    </div>

                    <div className="text-[10px] uppercase tracking-wider text-slate-600">
                      XP
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <span className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-2 py-1 text-xs font-semibold text-cyan-300">
                      LVL {player.level}
                    </span>
                  </div>

                  {/* Solved */}
                  <div>
                    <div className="font-semibold text-white">
                      {player.challenges_solved}
                    </div>

                    <div className="text-[10px] uppercase tracking-wider text-slate-600">
                      Challenges
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer navigation */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/ctf"
          className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
        >
          Enter CTF Arena →
        </Link>

        <Link
          to="/profile"
          className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
        >
          View Operator Profile →
        </Link>
      </div>
    </div>
  );
}