import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Flag,
  Search,
  Shield,
  Terminal,
  Trophy,
} from "lucide-react";

import { api } from "../services/api";
import type { Challenge } from "../types/api";

const difficultyStyles: Record<
  Challenge["difficulty"],
  string
> = {
  easy: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
  medium: "border-cyan-400/20 bg-cyan-400/5 text-cyan-300",
  hard: "border-orange-400/20 bg-orange-400/5 text-orange-300",
  expert: "border-red-400/20 bg-red-400/5 text-red-300",
};

export default function CTFArena() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoading(true);
        setError("");

        const activeEvent = await api.activeEvent();

if (!activeEvent) {
  setChallenges([]);
  return;
}

const response = await api.eventChallenges(activeEvent.id);

setChallenges(response.challenges);

        
      } catch (err) {
        console.error("Failed to load challenges:", err);
        setError("Unable to load CTF challenges.");
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return challenges;
    }

    return challenges.filter((challenge) => {
      return (
        challenge.name.toLowerCase().includes(query) ||
        challenge.category.toLowerCase().includes(query) ||
        challenge.difficulty.toLowerCase().includes(query) ||
        challenge.description.toLowerCase().includes(query)
      );
    });
  }, [challenges, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
                  Offensive Security
                </p>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                CTF Arena
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Analyze targets, exploit vulnerabilities, capture flags,
                and advance through the AMS Cyberverse.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                <Flag className="h-4 w-4 text-cyan-300" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Available
                </p>

                <p className="text-sm font-semibold text-cyan-300">
                  {challenges.length} Challenges
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH / STATUS */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search challenges, categories, difficulty..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.025] py-3 pl-11 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30 focus:bg-cyan-400/[0.02]"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <Terminal className="h-4 w-4 text-slate-500" />

          <span className="text-xs text-slate-400">
            Live Challenge Feed
          </span>

          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
            <Shield className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading active challenges...
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Connecting to AMS Cyberverse challenge engine
          </p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
              <Shield className="h-4 w-4 text-red-300" />
            </div>

            <div>
              <p className="text-sm font-semibold text-red-300">
                Challenge feed unavailable
              </p>

              <p className="mt-1 text-xs text-red-300/60">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGES */}
      {!loading && !error && (
        <>
          {filteredChallenges.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">
                <Flag className="h-7 w-7 text-slate-600" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-white">
                {search
                  ? "No matching challenges"
                  : "No challenges available"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Try a different challenge name, category, or difficulty."
                  : "The current CTF operation does not have any active challenges yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
}: {
  challenge: Challenge;
}) {
  const difficulty =
    difficultyStyles[challenge.difficulty] ??
    difficultyStyles.medium;

  return (
    <Link
      to={`/ctf/${challenge.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-cyan-400/[0.025] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)]"
    >
      {/* GLOW */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/5 blur-3xl transition group-hover:bg-cyan-400/10" />

      <div className="relative">
        {/* TOP */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/5">
            <Flag className="h-5 w-5 text-cyan-300" />
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${difficulty}`}
          >
            {challenge.difficulty}
          </span>
        </div>

        {/* TITLE */}
        <h2 className="mt-5 text-base font-semibold text-white transition group-hover:text-cyan-200">
          {challenge.name}
        </h2>

        {/* DESCRIPTION */}
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
          {challenge.description}
        </p>

        {/* META */}
        <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Category
            </p>

            <p className="mt-1 text-xs font-medium text-slate-300">
              {challenge.category}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-cyan-400" />

            <span className="text-sm font-semibold text-cyan-300">
              {challenge.points}
            </span>

            <span className="text-[10px] text-slate-600">
              PTS
            </span>
          </div>
        </div>

        {/* OPEN CHALLENGE */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/10 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500 transition group-hover:text-slate-300">
            Open challenge
          </span>

          <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cyan-300" />
        </div>
      </div>
    </Link>
  );
}