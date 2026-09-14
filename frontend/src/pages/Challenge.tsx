import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  LockKeyhole,
  Send,
  Shield,
  Terminal,
  Trophy,
  XCircle,
} from "lucide-react";

import { api } from "../services/api";
import type { Challenge as ChallengeType } from "../types/api";

type SubmissionResult =
  | "correct"
  | "incorrect"
  | "already_solved"
  | null;

export default function Challenge() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] =
    useState<ChallengeType | null>(null);

  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<SubmissionResult>(null);

  const [pointsAwarded, setPointsAwarded] = useState<number | null>(
    null,
  );

  const [totalPoints, setTotalPoints] = useState<number | null>(
    null,
  );

  const [newLevel, setNewLevel] = useState<number | null>(
    null,
  );

  useEffect(() => {
    async function loadChallenge() {
      if (!id) {
        setError("Invalid challenge ID.");
        setLoading(false);
        return;
      }

      const challengeId = Number(id);

      if (!Number.isInteger(challengeId) || challengeId <= 0) {
        setError("Invalid challenge ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await api.challenge(challengeId);

        setChallenge(data);
      } catch (err) {
        console.error("Failed to load challenge:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this challenge.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadChallenge();
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!challenge || !flag.trim()) {
      return;
    }

    const discordId = String(
      import.meta.env.VITE_DEV_DISCORD_ID ?? "",
    ).trim();

    if (!discordId) {
      setError(
        "Development Discord ID is not configured.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);
      setError("");

      const response = await api.submitFlag(
        challenge.id,
        discordId,
        flag.trim(),
      );

      if (response.status === "correct") {
        setResult("correct");

        setPointsAwarded(
          response.points_awarded ??
            response.points ??
            challenge.points,
        );

        setTotalPoints(
          response.total_points ?? null,
        );

        setNewLevel(
          response.level ?? null,
        );

        setFlag("");
      } else if (
        response.status === "already_solved"
      ) {
        setResult("already_solved");
      } else if (
        response.status === "incorrect"
      ) {
        setResult("incorrect");
      }
    } catch (err) {
      console.error("Flag submission failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit flag.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
            <Shield className="h-7 w-7 animate-pulse text-cyan-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading challenge...
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Retrieving challenge intelligence
          </p>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-400" />

          <h1 className="mt-4 text-lg font-semibold text-white">
            Challenge unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => navigate("/ctf")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/20 hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CTF Arena
          </button>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const difficultyClass =
    challenge.difficulty === "easy"
      ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
      : challenge.difficulty === "medium"
        ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
        : challenge.difficulty === "hard"
          ? "border-orange-400/20 bg-orange-400/5 text-orange-300"
          : "border-red-400/20 bg-red-400/5 text-red-300";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* BACK */}
      <Link
        to="/ctf"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CTF Arena
      </Link>

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col justify-between gap-6 lg:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/5">
                  <Flag className="h-5 w-5 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                    Challenge #{challenge.id}
                  </p>

                  <p className="text-xs text-slate-600">
                    {challenge.category}
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {challenge.name}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                {challenge.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span
                className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${difficultyClass}`}
              >
                {challenge.difficulty}
              </span>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-cyan-400" />

                <span className="text-xl font-semibold text-cyan-300">
                  {challenge.points}
                </span>

                <span className="text-xs text-slate-600">
                  POINTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* INTELLIGENCE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <Terminal className="h-4 w-4 text-cyan-300" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Challenge Intelligence
              </h2>

              <p className="text-[11px] text-slate-600">
                Mission information
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Objective
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Analyze the challenge environment, identify
                the intended attack path, and recover the
                hidden flag.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Category
                </p>

                <p className="mt-2 text-sm font-medium text-slate-300">
                  {challenge.category}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Difficulty
                </p>

                <p className="mt-2 text-sm font-medium capitalize text-slate-300">
                  {challenge.difficulty}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Reward
                </p>

                <p className="mt-2 text-sm font-medium text-cyan-300">
                  {challenge.points} XP
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  <span className="text-sm font-medium text-emerald-300">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBMISSION */}
        <section className="h-fit rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.025] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/5">
              <LockKeyhole className="h-5 w-5 text-cyan-300" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Capture the Flag
              </h2>

              <p className="text-[11px] text-slate-600">
                Submit your discovered flag
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="flag"
                className="text-[10px] font-semibold uppercase tracking-wider text-slate-500"
              >
                Flag
              </label>

              <div className="relative mt-2">
                <Flag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  id="flag"
                  value={flag}
                  onChange={(event) =>
                    setFlag(event.target.value)
                  }
                  placeholder="AMS{your_flag_here}"
                  autoComplete="off"
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-400/30 disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!flag.trim() || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />

              {submitting
                ? "Verifying..."
                : "Submit Flag"}
            </button>
          </form>

          {/* API ERROR */}
          {error && challenge && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />

                <p className="text-sm font-semibold text-red-300">
                  Submission error
                </p>
              </div>

              <p className="mt-1 text-xs text-red-300/60">
                {error}
              </p>
            </div>
          )}

          {/* CORRECT */}
          {result === "correct" && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                <p className="text-sm font-semibold text-emerald-300">
                  Flag captured
                </p>
              </div>

              <p className="mt-1 text-xs text-emerald-300/60">
                Challenge solved successfully.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-300/50">
                    Reward
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    +{pointsAwarded ?? challenge.points} XP
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-300/50">
                    Level
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    {newLevel ?? "Updated"}
                  </p>
                </div>
              </div>

              {totalPoints !== null && (
                <p className="mt-3 text-[11px] text-emerald-300/50">
                  Total XP: {totalPoints}
                </p>
              )}
            </div>
          )}

          {/* INCORRECT */}
          {result === "incorrect" && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />

                <p className="text-sm font-semibold text-red-300">
                  Incorrect flag
                </p>
              </div>

              <p className="mt-1 text-xs text-red-300/60">
                The submitted flag does not match. Keep analyzing.
              </p>
            </div>
          )}

          {/* ALREADY SOLVED */}
          {result === "already_solved" && (
            <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />

                <p className="text-sm font-semibold text-yellow-300">
                  Already solved
                </p>
              </div>

              <p className="mt-1 text-xs text-yellow-300/60">
                You have already captured this challenge.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-600" />

          <p className="text-[11px] text-slate-600">
            AMS Cyberverse CTF Engine
          </p>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-slate-700">
          Challenge ID: {challenge.id}
        </p>
      </section>
    </div>
  );
}