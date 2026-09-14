import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import type { Quiz, QuizQuestion } from "../types/api";

const DISCORD_ID =
  import.meta.env.VITE_DEV_DISCORD_ID || "123456789";

export default function Quiz() {
  const { id } = useParams();

  const quizId = Number(id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);

        const [quizData, questionData] = await Promise.all([
          api.quiz(quizId),
          api.quizQuestions(quizId),
        ]);

        setQuiz(quizData);
        setQuestions(questionData.questions);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load quiz.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(quizId)) {
      loadQuiz();
    }
  }, [quizId]);

  async function handleSubmit() {
    if (!selectedAnswer || submitting) {
      return;
    }

    const question = questions[currentIndex];

    if (!question) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setIsCorrect(null);

      const result = await api.submitQuizAnswer(
        question.id,
        DISCORD_ID,
        selectedAnswer,
      );

      if (result.status === "correct") {
        setIsCorrect(true);
        setMessage(
          `Correct! +${result.points_awarded ?? question.points} points`,
        );
      } else if (result.status === "already_solved") {
        setIsCorrect(true);
        setMessage(
          result.message || "You already solved this question.",
        );
      } else if (result.status === "incorrect") {
        setIsCorrect(false);
        setMessage(
          result.message || "Incorrect answer. Try again.",
        );
      } else {
        setIsCorrect(false);
        setMessage(
          result.message || "Unable to submit answer.",
        );
      }
    } catch (error) {
      setIsCorrect(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedAnswer("");
      setMessage("");
      setIsCorrect(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
          <CircleAlert className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm text-red-300">
            {message || "Quiz not found."}
          </p>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];

  if (!question) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
        <h2 className="text-xl font-semibold text-white">
          No questions available
        </h2>
      </div>
    );
  }

  const options = [
    { key: "A", value: question.option_a },
    { key: "B", value: question.option_b },
    { key: "C", value: question.option_c },
    { key: "D", value: question.option_d },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Cyber Knowledge Assessment
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white">
          {quiz.title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          {quiz.description}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Question {currentIndex + 1} / {questions.length}
        </span>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-300">
          {question.points} points
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl shadow-black/20 lg:p-8">
        <p className="mb-8 text-lg font-semibold leading-8 text-white">
          {question.question}
        </p>

        <div className="space-y-3">
          {options.map((option) => {
            const selected = selectedAnswer === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSelectedAnswer(option.key);
                  setMessage("");
                  setIsCorrect(null);
                }}
                className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                    selected
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 text-slate-400"
                  }`}
                >
                  {option.key}
                </span>

                <span className="flex-1 pt-1 text-sm leading-6 text-slate-200">
                  {option.value}
                </span>

                {selected ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 text-cyan-300" />
                ) : (
                  <CircleAlert className="mt-1 h-4 w-4 text-slate-700" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {message && (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              isCorrect
                ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                : "border-red-400/20 bg-red-400/5 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          {isCorrect && currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={nextQuestion}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Next Question
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}