import { useEffect, useState } from "react";
import {
  Brain,
  CircleAlert,
  Loader2,
  Play,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

type Quiz = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
};

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoading(true);
        setMessage("");

        const response = await api.quizzes();

        setQuizzes(response.quizzes);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load quizzes.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-300">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span className="text-sm">
            Loading quiz arena...
          </span>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
          <CircleAlert className="mx-auto mb-3 h-8 w-8 text-red-400" />

          <h2 className="mb-2 text-lg font-semibold text-white">
            Quiz Arena unavailable
          </h2>

          <p className="text-sm leading-6 text-red-300">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyan-300" />

          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Cyber Knowledge Arena
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white lg:text-4xl">
          Quiz Arena
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Test your cybersecurity knowledge through
          real-world scenarios, security concepts, and
          defensive thinking.
        </p>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-cyan-300" />

          <h2 className="text-xl font-semibold text-white">
            No quizzes available
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            New cybersecurity assessments will appear here
            when they are published.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl shadow-black/10 transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.04]"
            >
              {/* Card top */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Brain className="h-6 w-6 text-cyan-300" />
                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-cyan-300">
                  {quiz.difficulty}
                </span>
              </div>

              {/* Quiz information */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-cyan-200">
                  {quiz.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {quiz.description}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    {quiz.category}
                  </span>

                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500">
                    Assessment
                  </span>
                </div>
              </div>

              {/* Start button */}
              <div className="mt-7">
                <Link
                  to={`/quiz/${quiz.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-300"
                >
                  <Play className="h-4 w-4" />

                  Start Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}