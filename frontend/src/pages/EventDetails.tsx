import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Flag,
  Loader2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { api } from "../services/api";
import type { Challenge, Event } from "../types/api";

export default function EventDetails() {
  const { id } = useParams();

  const eventId = Number(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      if (!Number.isFinite(eventId)) {
        setError("Invalid event ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [eventData, challengeData] = await Promise.all([
          api.event(eventId),
          api.eventChallenges(eventId),
        ]);

        setEvent(eventData);
        setChallenges(challengeData.challenges);
      } catch (err) {
        console.error("Failed to load event:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load event.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading operation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          to="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-red-400" />

          <h1 className="mt-4 text-lg font-semibold text-white">
            Operation unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Event not found."}
          </p>
        </div>
      </div>
    );
  }

  const isActive = event.status === "active";

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {/* EVENT HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                isActive
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-slate-400"
              }`}
            >
              {event.status}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              AMS Cyberverse Event
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                    Cyber Operation
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-white lg:text-3xl">
                    {event.name}
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-400">
                {event.description ||
                  "No description is available for this event."}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Challenges
              </p>

              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {challenges.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHALLENGES */}
      <section className="mt-8">
        <div className="mb-5 flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-400" />

          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
            Operation Challenges
          </h2>
        </div>

        {challenges.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
            <Flag className="mx-auto h-8 w-8 text-slate-600" />

            <h3 className="mt-4 text-base font-semibold text-white">
              No challenges deployed
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Challenges for this operation will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((challenge) => (
              <Link
                key={challenge.id}
                to={`/ctf/${challenge.id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-cyan-400/[0.025]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                    <Flag className="h-5 w-5 text-cyan-300" />
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                </div>

                <div className="mt-5">
                  <h3 className="text-base font-semibold text-white">
                    {challenge.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {challenge.description ||
                      "Analyze the target and recover the flag."}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs text-slate-500">
                    {challenge.category || "General"}
                  </span>

                  <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-2.5 py-1 text-xs font-semibold text-cyan-300">
                    {challenge.points} XP
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}