import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Loader2, Shield, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import type { Event } from "../types/api";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await api.events();
        setEvents(response.events);
      } catch (err) {
        console.error("Failed to load events:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load events.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const activeEvents = events.filter(
    (event) => event.status === "active",
  );

  const otherEvents = events.filter(
    (event) => event.status !== "active",
  );

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading cyber operations...
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Connecting to AMS Cyberverse
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <Shield className="mx-auto h-8 w-8 text-red-400" />

          <h1 className="mt-4 text-lg font-semibold text-white">
            Event feed unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-cyan-400" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Cyber Operations
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            Events
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Join active cyber operations, solve challenges,
            capture flags, and build your standing across the
            AMS Cyberverse.
          </p>
        </div>
      </section>

      {/* ACTIVE EVENTS */}
      {activeEvents.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Active Operations
            </h2>
          </div>

          <div className="grid gap-4">
            {activeEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.025] p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                        <Trophy className="h-5 w-5 text-emerald-300" />
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          Live Event
                        </p>

                        <h3 className="mt-1 text-xl font-semibold text-white">
                          {event.name}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                      {event.description || "Active cybersecurity operation."}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm font-semibold text-emerald-300">
                    Enter Operation
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* OTHER EVENTS */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />

          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Event Archive
          </h2>
        </div>

        {otherEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-600" />

            <p className="mt-4 text-sm text-slate-500">
              No previous events available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {otherEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-cyan-400/[0.02]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {event.status}
                    </span>

                    <h3 className="mt-4 text-base font-semibold text-white group-hover:text-cyan-200">
                      {event.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                      {event.description || "Cybersecurity event."}
                    </p>
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}